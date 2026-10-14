import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { config } from 'dotenv';
import { ROLES, CATEGORIES, COLORS } from './config';
import {
  buildWelcomeEmbed,
  buildRulesEmbed,
  buildVerificationEmbed,
  buildVerificationButton,
  buildRolePickerEmbed,
  buildRolePickerButtons,
  buildServicesEmbed,
  buildHowToOrderEmbed,
  buildFAQEmbed,
  buildTicketEmbed,
  buildTicketButton,
} from './utils/embeds';
import { logger } from './utils/logger';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

async function setupServer() {
  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    logger.error('GUILD_ID not set in .env');
    process.exit(1);
  }

  await client.login(process.env.DISCORD_TOKEN);
  logger.info('Bot logged in, starting server setup...');

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    logger.error(`Guild ${guildId} not found`);
    process.exit(1);
  }

  logger.info(`Setting up: ${guild.name}`);

  // ═══════════════════════════════════════════════════════════
  //  STEP 1: CREATE ROLES
  // ═══════════════════════════════════════════════════════════
  logger.info('Creating roles...');

  const createdRoles = new Map<string, string>();

  for (const roleDef of ROLES) {
    const existing = guild.roles.cache.find(r => r.name === roleDef.name);
    if (existing) {
      logger.info(`  Role exists: ${roleDef.name}`);
      createdRoles.set(roleDef.name, existing.id);
      continue;
    }

    try {
      const role = await guild.roles.create({
        name: roleDef.name,
        color: roleDef.color,
        hoist: roleDef.hoist,
        permissions: [...roleDef.permissions] as bigint[],
        reason: 'TMA Server Setup',
      });
      createdRoles.set(roleDef.name, role.id);
      logger.success(`  Created role: ${roleDef.name}`);
    } catch (err) {
      logger.error(`  Failed to create role: ${roleDef.name}`, err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  STEP 2: CREATE CATEGORIES & CHANNELS
  // ═══════════════════════════════════════════════════════════
  logger.info('Creating channels...');

  const verifiedRoleId = createdRoles.get('✅ Verified');
  const staffRoleIds = [
    createdRoles.get('👑 Owner'),
    createdRoles.get('🛡️ Admin'),
    createdRoles.get('⚔️ Moderator'),
  ].filter(Boolean) as string[];

  const channelMap = new Map<string, string>();

  for (const category of CATEGORIES) {
    // Check if category exists
    let cat = guild.channels.cache.find(
      c => c.name === category.name && c.type === ChannelType.GuildCategory
    );

    if (!cat) {
      try {
        cat = await guild.channels.create({
          name: category.name,
          type: ChannelType.GuildCategory,
          reason: 'TMA Server Setup',
        });
        logger.success(`  Created category: ${category.name}`);
      } catch (err) {
        logger.error(`  Failed to create category: ${category.name}`, err);
        continue;
      }
    } else {
      logger.info(`  Category exists: ${category.name}`);
    }

    // Set category permissions for staff-only categories
    const isStaffCategory = category.channels.every(ch => ch.staffOnly);
    if (isStaffCategory && 'permissionOverwrites' in cat) {
      try {
        await (cat as any).permissionOverwrites.set([
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          ...staffRoleIds.map(id => ({
            id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] as bigint[],
          })),
        ]);
      } catch (err) {
        logger.error(`  Failed to set permissions for category: ${category.name}`, err);
      }
    }

    for (const chConfig of category.channels) {
      // Check if channel exists
      let channel = guild.channels.cache.find(
        c => c.name === chConfig.name && c.parentId === cat!.id
      );

      if (channel) {
        logger.info(`    Channel exists: ${chConfig.name}`);
        channelMap.set(chConfig.name, channel.id);
        continue;
      }

      try {
        const permissionOverwrites: Array<{
          id: string;
          allow?: bigint[];
          deny?: bigint[];
        }> = [];

        if (chConfig.staffOnly) {
          permissionOverwrites.push({
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          });
          for (const roleId of staffRoleIds) {
            permissionOverwrites.push({
              id: roleId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            });
          }
          // Marketers can see marketing channel
          const marketerId = createdRoles.get('📣 Marketer');
          if (marketerId && chConfig.name === '📣・marketing-plans') {
            permissionOverwrites.push({
              id: marketerId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            });
          }
        } else if (chConfig.verifiedOnly) {
          permissionOverwrites.push({
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          });
          if (verifiedRoleId) {
            permissionOverwrites.push({
              id: verifiedRoleId,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: chConfig.readonly ? [PermissionFlagsBits.SendMessages] : [],
            });
          }
          for (const roleId of staffRoleIds) {
            permissionOverwrites.push({
              id: roleId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            });
          }
        } else if (chConfig.readonly) {
          permissionOverwrites.push({
            id: guild.id,
            deny: [PermissionFlagsBits.SendMessages],
          });
          for (const roleId of staffRoleIds) {
            permissionOverwrites.push({
              id: roleId,
              allow: [PermissionFlagsBits.SendMessages],
            });
          }
        }

        channel = await guild.channels.create({
          name: chConfig.name,
          type: chConfig.type as ChannelType.GuildText | ChannelType.GuildVoice,
          parent: cat.id,
          topic: chConfig.topic,
          rateLimitPerUser: chConfig.slowMode || 0,
          permissionOverwrites,
          reason: 'TMA Server Setup',
        });

        channelMap.set(chConfig.name, channel.id);
        logger.success(`    Created channel: ${chConfig.name}`);
      } catch (err) {
        logger.error(`    Failed to create channel: ${chConfig.name}`, err);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  STEP 3: POST EMBEDS IN CHANNELS
  // ═══════════════════════════════════════════════════════════
  logger.info('Posting setup embeds...');

  // Welcome channel
  const welcomeId = channelMap.get('👋・welcome');
  if (welcomeId) {
    const ch = guild.channels.cache.get(welcomeId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({ embeds: [buildWelcomeEmbed()] });
        logger.success('  Posted welcome embed');
      }
    }
  }

  // Rules channel
  const rulesId = channelMap.get('📜・rules');
  if (rulesId) {
    const ch = guild.channels.cache.get(rulesId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({ embeds: [buildRulesEmbed()] });
        logger.success('  Posted rules embed');
      }
    }
  }

  // Verification channel
  const verifyId = channelMap.get('✅・verify-here');
  if (verifyId) {
    const ch = guild.channels.cache.get(verifyId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({
          embeds: [buildVerificationEmbed()],
          components: [buildVerificationButton()],
        });
        logger.success('  Posted verification embed + button');
      }
    }
  }

  // Role picker channel
  const rolesId = channelMap.get('🎭・pick-your-roles');
  if (rolesId) {
    const ch = guild.channels.cache.get(rolesId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({
          embeds: [buildRolePickerEmbed()],
          components: buildRolePickerButtons(),
        });
        logger.success('  Posted role picker embed + buttons');
      }
    }
  }

  // Services channel
  const servicesId = channelMap.get('💎・our-services');
  if (servicesId) {
    const ch = guild.channels.cache.get(servicesId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({ embeds: [buildServicesEmbed()] });
        logger.success('  Posted services embed');
      }
    }
  }

  // FAQ channel
  const faqId = channelMap.get('❓・faq');
  if (faqId) {
    const ch = guild.channels.cache.get(faqId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({ embeds: [buildFAQEmbed()] });
        logger.success('  Posted FAQ embed');
      }
    }
  }

  // How to order channel
  const howToId = channelMap.get('📋・how-to-order');
  if (howToId) {
    const ch = guild.channels.cache.get(howToId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({ embeds: [buildHowToOrderEmbed()] });
        logger.success('  Posted how-to-order embed');
      }
    }
  }

  // Ticket channel
  const ticketId = channelMap.get('🎫・create-ticket');
  if (ticketId) {
    const ch = guild.channels.cache.get(ticketId) as TextChannel;
    if (ch) {
      const existing = await ch.messages.fetch({ limit: 5 });
      if (existing.filter(m => m.author.id === client.user!.id).size === 0) {
        await ch.send({
          embeds: [buildTicketEmbed()],
          components: [buildTicketButton()],
        });
        logger.success('  Posted ticket embed + button');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  DONE
  // ═══════════════════════════════════════════════════════════
  logger.success('\n✅ Server setup complete!');
  logger.info(`  Roles created: ${createdRoles.size}`);
  logger.info(`  Channels created: ${channelMap.size}`);
  logger.info('\nRun "npm run dev" to start the bot.\n');

  client.destroy();
  process.exit(0);
}

setupServer().catch(err => {
  logger.error('Setup failed', err);
  process.exit(1);
});

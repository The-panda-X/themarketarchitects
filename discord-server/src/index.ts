import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  Events,
  TextChannel,
} from 'discord.js';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { handleVerification } from './systems/verification';
import { handleRoleToggle } from './systems/roles';
import {
  handleTicketCreate,
  handleTicketClose,
  handleTicketCategory,
  handleTicketPriority,
  handleTicketRating,
  updateTicketActivity,
  startTicketAutoClose,
} from './systems/tickets';
import { handleMemberJoin, handleMemberLeave } from './systems/welcome';
import { checkMessage } from './systems/anti-spam';
import { checkForRaid } from './systems/anti-raid';
import { handleModCommand } from './commands/moderation';
import { handleEngagementCommand } from './commands/engagement';
import { handleAnalyticsCommand } from './commands/analytics';
import { handleSecurityCommand } from './commands/security';
import { handleUtilityCommand } from './commands/utility';
import { handleSuggestion } from './systems/suggestions';
import { handleAFKMentions } from './systems/afk';
import { trackMessage } from './systems/tracker';
import { startScheduler, startDailyTips } from './systems/scheduler';
import { EMOJIS } from './config';

config();

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN not found in .env file');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

// ═══════════════════════════════════════════════════════════════
//  BOT READY
// ═══════════════════════════════════════════════════════════════
client.once(Events.ClientReady, (readyClient) => {
  logger.success(`Bot online: ${readyClient.user.tag}`);
  logger.info(`Servers: ${readyClient.guilds.cache.size}`);
  logger.info(`Members: ${readyClient.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);

  // Rotating status
  const statuses = [
    { name: '98.4% Success Rate', type: ActivityType.Custom },
    { name: 'themarketarchitects.com', type: ActivityType.Custom },
    { name: `${readyClient.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} traders`, type: ActivityType.Watching },
    { name: 'Prop Firm Challenges', type: ActivityType.Competing },
  ];

  let statusIndex = 0;
  setInterval(() => {
    const status = statuses[statusIndex % statuses.length];
    readyClient.user.setPresence({
      activities: [{ name: status.name, type: status.type }],
      status: 'online',
    });
    statusIndex++;
  }, 30_000);

  // Start background systems
  startScheduler(client);
  startTicketAutoClose(client);

  const guildId = process.env.GUILD_ID;
  if (guildId) {
    startDailyTips(client, guildId);
  }
});

// ═══════════════════════════════════════════════════════════════
//  MEMBER JOIN / LEAVE
// ═══════════════════════════════════════════════════════════════
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const isRaid = await checkForRaid(member);
    if (isRaid) return;
    await handleMemberJoin(member);
  } catch (err) {
    logger.error(`Error handling member join: ${member.user.tag}`, err);
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    await handleMemberLeave(member as import('discord.js').GuildMember);
  } catch (err) {
    logger.error(`Error handling member leave`, err);
  }
});

// ═══════════════════════════════════════════════════════════════
//  MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  try {
    // Track message for analytics
    trackMessage(message);

    // Update ticket activity tracking
    if (message.channel instanceof TextChannel && message.channel.name.startsWith('ticket-')) {
      updateTicketActivity(message.channel.id);
    }

    // Run anti-spam check
    const blocked = await checkMessage(message);
    if (blocked) return;

    // Handle suggestions channel
    await handleSuggestion(message);

    // Handle AFK mentions
    await handleAFKMentions(message);
  } catch (err) {
    logger.error('Error processing message', err);
  }
});

// ═══════════════════════════════════════════════════════════════
//  INTERACTION HANDLING (Buttons, Select Menus, Commands)
// ═══════════════════════════════════════════════════════════════
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    try {
      // Try each command handler
      if (await handleEngagementCommand(interaction)) return;
      if (await handleAnalyticsCommand(interaction)) return;
      if (await handleSecurityCommand(interaction)) return;
      if (await handleUtilityCommand(interaction)) return;
      await handleModCommand(interaction);
    } catch (err) {
      logger.error(`Command error: ${interaction.commandName}`, err);
      try {
        const reply = interaction.deferred || interaction.replied
          ? interaction.editReply.bind(interaction)
          : interaction.reply.bind(interaction);
        await reply({ content: `${EMOJIS.CROSS} An error occurred.`, ephemeral: true } as any);
      } catch { /* interaction expired */ }
    }
    return;
  }

  // String select menus (ticket category/priority)
  if (interaction.isStringSelectMenu()) {
    try {
      if (interaction.customId === 'tma_ticket_category') {
        await handleTicketCategory(interaction);
        return;
      }
      if (interaction.customId === 'tma_ticket_priority') {
        await handleTicketPriority(interaction);
        return;
      }
    } catch (err) {
      logger.error(`Select menu error: ${interaction.customId}`, err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `${EMOJIS.CROSS} An error occurred.`, ephemeral: true });
        }
      } catch { /* interaction expired */ }
    }
    return;
  }

  // Button interactions
  if (interaction.isButton()) {
    try {
      // Verification
      if (interaction.customId === 'tma_verify_button') {
        await handleVerification(interaction);
        return;
      }

      // Ticket system
      if (interaction.customId === 'tma_create_ticket') {
        await handleTicketCreate(interaction);
        return;
      }
      if (interaction.customId === 'tma_close_ticket') {
        await handleTicketClose(interaction);
        return;
      }

      // Ticket rating
      if (interaction.customId.startsWith('tma_ticket_rate_')) {
        await handleTicketRating(interaction);
        return;
      }

      // Role picker
      if (interaction.customId.startsWith('role_')) {
        await handleRoleToggle(interaction);
        return;
      }
    } catch (err) {
      logger.error(`Button error: ${interaction.customId}`, err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `${EMOJIS.CROSS} An error occurred.`, ephemeral: true });
        }
      } catch { /* interaction expired */ }
    }
  }
});

// ═══════════════════════════════════════════════════════════════
//  ERROR HANDLING
// ═══════════════════════════════════════════════════════════════
client.on(Events.Error, (err) => {
  logger.error('Client error', err);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
});

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  client.destroy();
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════
//  START BOT
// ═══════════════════════════════════════════════════════════════
client.login(process.env.DISCORD_TOKEN).catch(err => {
  logger.error('Failed to login', err);
  process.exit(1);
});

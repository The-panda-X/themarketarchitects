import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  Events,
} from 'discord.js';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { handleVerification } from './systems/verification';
import { handleRoleToggle } from './systems/roles';
import { handleTicketCreate, handleTicketClose } from './systems/tickets';
import { handleMemberJoin, handleMemberLeave } from './systems/welcome';
import { checkMessage } from './systems/anti-spam';
import { checkForRaid } from './systems/anti-raid';
import { handleModCommand } from './commands/moderation';
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
});

// ═══════════════════════════════════════════════════════════════
//  MEMBER JOIN / LEAVE
// ═══════════════════════════════════════════════════════════════
client.on(Events.GuildMemberAdd, async (member) => {
  // Check for raid first
  const isRaid = await checkForRaid(member);
  if (isRaid) return;

  await handleMemberJoin(member);
});

client.on(Events.GuildMemberRemove, async (member) => {
  await handleMemberLeave(member as import('discord.js').GuildMember);
});

// ═══════════════════════════════════════════════════════════════
//  MESSAGE HANDLING (Anti-Spam)
// ═══════════════════════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // Run anti-spam check
  await checkMessage(message);
});

// ═══════════════════════════════════════════════════════════════
//  INTERACTION HANDLING (Buttons + Commands)
// ═══════════════════════════════════════════════════════════════
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    try {
      await handleModCommand(interaction);
    } catch (err) {
      logger.error(`Command error: ${interaction.commandName}`, err);
      const reply = interaction.deferred || interaction.replied
        ? interaction.editReply.bind(interaction)
        : interaction.reply.bind(interaction);
      await reply({ content: `${EMOJIS.CROSS} An error occurred.`, ephemeral: true } as any);
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
      } catch {
        // interaction may have expired
      }
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

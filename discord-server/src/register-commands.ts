import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { moderationCommands } from './commands/moderation';
import { logger } from './utils/logger';

config();

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  logger.error('Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env');
  process.exit(1);
}

const commands = moderationCommands.map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try {
    logger.info(`Registering ${commands.length} slash commands...`);

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    logger.success(`Registered ${commands.length} commands successfully!`);
  } catch (err) {
    logger.error('Failed to register commands', err);
  }
}

registerCommands();

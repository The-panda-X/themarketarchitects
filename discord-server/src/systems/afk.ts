import { Message, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

interface AFKEntry {
  reason: string;
  timestamp: number;
}

const afkUsers = new Map<string, AFKEntry>();

export function setAFK(userId: string, reason: string): void {
  afkUsers.set(userId, { reason, timestamp: Date.now() });
}

export function removeAFK(userId: string): AFKEntry | undefined {
  const entry = afkUsers.get(userId);
  if (entry) {
    afkUsers.delete(userId);
  }
  return entry;
}

export function isAFK(userId: string): AFKEntry | undefined {
  return afkUsers.get(userId);
}

export async function handleAFKMentions(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  // If the user who sent a message is AFK, remove their AFK
  const senderAFK = removeAFK(message.author.id);
  if (senderAFK) {
    const duration = Math.floor((Date.now() - senderAFK.timestamp) / 60_000);
    try {
      const msg = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription(`${EMOJIS.CHECK} Welcome back, ${message.author}! You were AFK for **${duration > 0 ? `${duration} minute${duration !== 1 ? 's' : ''}` : 'less than a minute'}**.`),
        ],
      });
      setTimeout(() => msg.delete().catch(() => {}), 8_000);
    } catch { /* perms */ }
    logger.event(`AFK removed: ${message.author.tag}`);
  }

  // Check if any mentioned users are AFK
  for (const [, user] of message.mentions.users) {
    const afkEntry = isAFK(user.id);
    if (afkEntry) {
      const timestamp = Math.floor(afkEntry.timestamp / 1000);
      try {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.WARNING)
              .setDescription(`${EMOJIS.LOADING} **${user.displayName}** is AFK: ${afkEntry.reason}\n*Since <t:${timestamp}:R>*`),
          ],
        });
      } catch { /* perms */ }
    }
  }
}

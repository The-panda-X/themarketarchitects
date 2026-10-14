import { Message, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { AUTOMOD, COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';
import { buildModLogEmbed } from '../utils/embeds';

interface MessageRecord {
  content: string;
  timestamp: number;
}

const userMessages = new Map<string, MessageRecord[]>();
const warnCounts = new Map<string, number>();

function cleanOldMessages(userId: string) {
  const records = userMessages.get(userId);
  if (!records) return;
  const cutoff = Date.now() - 30_000;
  const filtered = records.filter(r => r.timestamp > cutoff);
  if (filtered.length === 0) userMessages.delete(userId);
  else userMessages.set(userId, filtered);
}

export async function checkMessage(message: Message): Promise<boolean> {
  if (!message.guild || message.author.bot) return false;

  const member = message.member;
  if (!member) return false;

  const isStaff = member.roles.cache.some(r =>
    ['👑 Owner', '🛡️ Admin', '⚔️ Moderator'].includes(r.name)
  );
  if (isStaff) return false;

  const content = message.content;
  const userId = message.author.id;
  const channel = message.channel as TextChannel;

  // ── Image-Only Channel Enforcement ──
  if (AUTOMOD.imageOnlyChannels.includes(channel.name)) {
    if (message.attachments.size === 0 && !content.match(/https?:\/\/\S+\.(png|jpg|jpeg|gif|webp)/i)) {
      try { await message.delete(); } catch { /* already deleted */ }
      try {
        const warn = await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.WARNING)
              .setDescription(`${EMOJIS.WARNING} ${member.user}, this channel is for **images only**. Please share your trading results as screenshots!`),
          ],
        });
        setTimeout(() => warn.delete().catch(() => {}), 8_000);
      } catch { /* channel perms */ }
      return true;
    }
  }

  // ── Blocked Words ──
  const lowerContent = content.toLowerCase();
  if (AUTOMOD.blockedWords.some(word => lowerContent.includes(word))) {
    await deleteAndWarn(message, member, 'Blocked content detected');
    return true;
  }

  // ── Blocked Patterns (Discord invites, short links, crypto scams) ──
  if (AUTOMOD.blockedPatterns.some(pattern => pattern.test(content))) {
    const isWhitelisted = AUTOMOD.inviteLinkWhitelist.some(link => content.includes(link));
    if (!isWhitelisted) {
      await deleteAndWarn(message, member, 'Unauthorized links');
      return true;
    }
  }

  // ── Mass Mentions ──
  if (message.mentions.users.size + message.mentions.roles.size > AUTOMOD.maxMentions) {
    await deleteAndWarn(message, member, 'Mass mentions');
    return true;
  }

  // ── Excessive Emojis ──
  const emojiCount = (content.match(/<a?:\w+:\d+>|[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > AUTOMOD.maxEmojis) {
    await deleteAndWarn(message, member, 'Emoji spam');
    return true;
  }

  // ── Excessive Newlines ──
  const newlineCount = (content.match(/\n/g) || []).length;
  if (newlineCount > AUTOMOD.maxNewlines) {
    await deleteAndWarn(message, member, 'Wall of text');
    return true;
  }

  // ── CAPS LOCK Detection ──
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= AUTOMOD.capsLockMinLength) {
    const upperCount = (content.match(/[A-Z]/g) || []).length;
    if (upperCount / letters.length >= AUTOMOD.capsLockThreshold) {
      await deleteAndWarn(message, member, 'Excessive CAPS LOCK');
      return true;
    }
  }

  // ── Rapid Messages (Spam) ──
  cleanOldMessages(userId);
  const records = userMessages.get(userId) || [];
  records.push({ content, timestamp: Date.now() });
  userMessages.set(userId, records);

  const recentMessages = records.filter(r => r.timestamp > Date.now() - AUTOMOD.spamTimeWindow);
  if (recentMessages.length >= AUTOMOD.spamMessageCount) {
    await deleteAndWarn(message, member, 'Message spam (too many messages too fast)');
    return true;
  }

  // ── Duplicate Messages ──
  const duplicates = records.filter(
    r => r.content === content && r.timestamp > Date.now() - AUTOMOD.duplicateTimeWindow
  );
  if (duplicates.length >= AUTOMOD.maxDuplicateMessages) {
    await deleteAndWarn(message, member, 'Duplicate message spam');
    return true;
  }

  return false;
}

async function deleteAndWarn(message: Message, member: GuildMember, reason: string) {
  try {
    await message.delete();
  } catch {
    // Message may already be deleted
  }

  const userId = member.id;
  const warns = (warnCounts.get(userId) || 0) + 1;
  warnCounts.set(userId, warns);

  logger.mod(`Anti-spam: ${member.user.tag} — ${reason} (warning ${warns})`);

  // Escalating punishment
  if (warns >= 4) {
    try {
      await member.ban({ reason: `Auto-mod: repeated violations — ${reason}` });
      logger.mod(`BANNED: ${member.user.tag} (${warns} warnings)`);
    } catch {
      logger.error(`Failed to ban ${member.user.tag}`);
    }
  } else if (warns >= 3) {
    try {
      await member.timeout(24 * 60 * 60 * 1000, `Auto-mod: ${reason}`);
    } catch {
      logger.error(`Failed to timeout ${member.user.tag}`);
    }
  } else if (warns >= 2) {
    try {
      await member.timeout(60 * 60 * 1000, `Auto-mod: ${reason}`);
    } catch {
      logger.error(`Failed to timeout ${member.user.tag}`);
    }
  }

  // Send warning DM
  try {
    await member.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.WARNING)
          .setTitle(`${EMOJIS.WARNING} Warning — The Market Architects`)
          .setDescription(
            `Your message was removed for: **${reason}**\n\n` +
            `This is warning **${warns}/4**. On the 4th warning you will be banned.\n\n` +
            `Please review the server rules.`
          )
          .setTimestamp(),
      ],
    });
  } catch {
    // DMs may be closed
  }

  // Log to mod-logs channel
  const modLogs = message.guild?.channels.cache.find(
    c => c.name === '📝・mod-logs' && c.isTextBased()
  ) as TextChannel | undefined;

  if (modLogs) {
    await modLogs.send({
      embeds: [buildModLogEmbed(
        warns >= 4 ? 'BAN' : warns >= 2 ? 'TIMEOUT' : 'WARN',
        'Auto-Mod',
        `${member.user.tag} (${member.id})`,
        `${reason} — Warning ${warns}/4`
      )],
    });
  }
}

// Reset warnings periodically (every 24 hours)
setInterval(() => {
  warnCounts.clear();
  logger.info('Warning counts reset');
}, 24 * 60 * 60 * 1000);

import { GuildMember, TextChannel } from 'discord.js';
import { EMOJIS } from '../config';
import { buildMemberJoinDM } from '../utils/embeds';
import { logger } from '../utils/logger';

export async function handleMemberJoin(member: GuildMember) {
  const guild = member.guild;

  // Assign unverified role
  const unverifiedRole = guild.roles.cache.find(r => r.name === '⏳ Unverified');
  if (unverifiedRole) {
    try {
      await member.roles.add(unverifiedRole);
    } catch {
      logger.error(`Failed to assign unverified role to ${member.user.tag}`);
    }
  }

  // Send welcome message in welcome channel
  const welcomeChannel = guild.channels.cache.find(
    c => c.name === '👋・welcome' && c.isTextBased()
  ) as TextChannel | undefined;

  if (welcomeChannel) {
    try {
      const msg = await welcomeChannel.send(
        `${EMOJIS.WAVE} Welcome to **The Market Architects**, ${member.user}! ${EMOJIS.SPARKLE}\n\n` +
        `${EMOJIS.POINT_RIGHT} Head to **#verify-here** to unlock the server!\n` +
        `${EMOJIS.POINT_RIGHT} Check out **#rules** first!`
      );

      // Auto-delete after 30 seconds to keep channel clean
      setTimeout(() => msg.delete().catch(() => {}), 30_000);
    } catch {
      logger.error(`Failed to send welcome message for ${member.user.tag}`);
    }
  }

  // Send DM
  try {
    await member.send({
      embeds: [buildMemberJoinDM(member.displayName)],
    });
  } catch {
    logger.warn(`Could not DM ${member.user.tag} — DMs may be closed`);
  }

  logger.event(`Member joined: ${member.user.tag} (${guild.memberCount} members)`);
}

export async function handleMemberLeave(member: GuildMember) {
  const guild = member.guild;

  const modLogs = guild.channels.cache.find(
    c => c.name === '📝・mod-logs' && c.isTextBased()
  ) as TextChannel | undefined;

  if (modLogs) {
    await modLogs.send(
      `${EMOJIS.CROSS} **${member.user.tag}** left the server. ` +
      `(${guild.memberCount} members remaining)`
    );
  }

  logger.event(`Member left: ${member.user.tag} (${guild.memberCount} members)`);
}

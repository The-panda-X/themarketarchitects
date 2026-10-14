import { GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { AUTOMOD, COLORS, EMOJIS } from '../config';
import { buildMemberJoinDM } from '../utils/embeds';
import { logger } from '../utils/logger';
import { trackJoin, trackLeave } from './tracker';
import { checkMilestone } from './milestones';

export async function handleMemberJoin(member: GuildMember) {
  const guild = member.guild;
  trackJoin();

  // Assign unverified role
  const unverifiedRole = guild.roles.cache.find(r => r.name === '⏳ Unverified');
  if (unverifiedRole) {
    try {
      await member.roles.add(unverifiedRole);
    } catch {
      logger.error(`Failed to assign unverified role to ${member.user.tag}`);
    }
  }

  // Alt account detection — flag accounts younger than threshold
  const accountAge = Date.now() - member.user.createdTimestamp;
  const thresholdMs = AUTOMOD.newAccountThresholdDays * 24 * 60 * 60 * 1000;

  if (accountAge < thresholdMs) {
    const daysOld = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    const modLogs = guild.channels.cache.find(
      c => c.name === '📝・mod-logs' && c.isTextBased()
    ) as TextChannel | undefined;

    if (modLogs) {
      await modLogs.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle(`${EMOJIS.WARNING} New Account Alert`)
            .setDescription(
              `**${member.user.tag}** (${member.id}) joined with an account that is only **${daysOld} day${daysOld !== 1 ? 's' : ''} old**.\n\n` +
              `This could be an alt or bot account. Please monitor.`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp(),
        ],
      });
    }
    logger.warn(`New account alert: ${member.user.tag} is only ${daysOld} days old`);
  }

  // Send welcome message in welcome channel
  const welcomeChannel = guild.channels.cache.find(
    c => c.name === '👋・welcome' && c.isTextBased()
  ) as TextChannel | undefined;

  if (welcomeChannel) {
    try {
      const memberNumber = guild.memberCount;
      const msg = await welcomeChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setDescription(
              `${EMOJIS.WAVE} Welcome to **The Market Architects**, ${member.user}! ${EMOJIS.SPARKLE}\n\n` +
              `You are member **#${memberNumber}**! ${EMOJIS.TROPHY}\n\n` +
              `${EMOJIS.POINT_RIGHT} Head to **#verify-here** to unlock the server!\n` +
              `${EMOJIS.POINT_RIGHT} Check out **#rules** first!`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp(),
        ],
      });

      setTimeout(() => msg.delete().catch(() => {}), 60_000);
    } catch {
      logger.error(`Failed to send welcome message for ${member.user.tag}`);
    }
  }

  // Send DM
  try {
    await member.send({
      embeds: [buildMemberJoinDM(member.displayName, guild.memberCount)],
    });
  } catch {
    logger.warn(`Could not DM ${member.user.tag} — DMs may be closed`);
  }

  logger.event(`Member joined: ${member.user.tag} (${guild.memberCount} members)`);

  // Check for milestones
  await checkMilestone(guild);
}

export async function handleMemberLeave(member: GuildMember) {
  const guild = member.guild;
  trackLeave();

  const modLogs = guild.channels.cache.find(
    c => c.name === '📝・mod-logs' && c.isTextBased()
  ) as TextChannel | undefined;

  if (modLogs) {
    const joinedAt = member.joinedAt;
    const duration = joinedAt
      ? `Joined <t:${Math.floor(joinedAt.getTime() / 1000)}:R>`
      : 'Join date unknown';

    await modLogs.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.MUTED)
          .setDescription(
            `${EMOJIS.CROSS} **${member.user.tag}** left the server.\n` +
            `${duration} | ${guild.memberCount} members remaining`
          )
          .setTimestamp(),
      ],
    });
  }

  logger.event(`Member left: ${member.user.tag} (${guild.memberCount} members)`);
}

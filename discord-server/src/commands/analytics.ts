import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { getStatsForPeriod, getTodayStats, getLeaderboard } from '../systems/tracker';
import { logger } from '../utils/logger';

export const analyticsCommands = [
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View server statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the most active members this week')
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Number of members to show')
        .setMinValue(5)
        .setMaxValue(25)
    ),
];

export async function handleAnalyticsCommand(interaction: ChatInputCommandInteraction): Promise<boolean> {
  switch (interaction.commandName) {
    case 'stats': {
      await handleStats(interaction);
      return true;
    }
    case 'leaderboard': {
      await handleLeaderboard(interaction);
      return true;
    }
    default:
      return false;
  }
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const today = getTodayStats();
  const weekStats = getStatsForPeriod(7);
  const monthStats = getStatsForPeriod(30);

  const totalMembers = guild.memberCount;
  const onlineMembers = guild.members.cache.filter(
    m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd'
  ).size;

  const verifiedRole = guild.roles.cache.find(r => r.name === '✅ Verified');
  const verifiedCount = verifiedRole ? verifiedRole.members.size : 0;
  const verificationRate = totalMembers > 0 ? ((verifiedCount / totalMembers) * 100).toFixed(1) : '0';

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.CHART} Server Statistics`)
        .addFields(
          {
            name: `${EMOJIS.STAR} Member Overview`,
            value: [
              `${EMOJIS.GREEN_CIRCLE} **Total Members:** ${totalMembers}`,
              `${EMOJIS.GREEN_CIRCLE} **Online Now:** ${onlineMembers}`,
              `${EMOJIS.CHECK} **Verified:** ${verifiedCount} (${verificationRate}%)`,
            ].join('\n'),
            inline: true,
          },
          {
            name: `${EMOJIS.CHART} Today`,
            value: [
              `${EMOJIS.ARROW_RIGHT} Joins: ${today.joins}`,
              `${EMOJIS.ARROW_RIGHT} Leaves: ${today.leaves}`,
              `${EMOJIS.ARROW_RIGHT} Messages: ${today.messages}`,
              `${EMOJIS.ARROW_RIGHT} Tickets: ${today.tickets}`,
              `${EMOJIS.ARROW_RIGHT} Verifications: ${today.verifications}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: `${EMOJIS.CHART} This Week`,
            value: [
              `${EMOJIS.ARROW_RIGHT} Joins: ${weekStats.joins}`,
              `${EMOJIS.ARROW_RIGHT} Leaves: ${weekStats.leaves}`,
              `${EMOJIS.ARROW_RIGHT} Messages: ${weekStats.messages}`,
              `${EMOJIS.ARROW_RIGHT} Tickets: ${weekStats.tickets}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: `${EMOJIS.CHART} This Month`,
            value: [
              `${EMOJIS.ARROW_RIGHT} Joins: ${monthStats.joins}`,
              `${EMOJIS.ARROW_RIGHT} Leaves: ${monthStats.leaves}`,
              `${EMOJIS.ARROW_RIGHT} Messages: ${monthStats.messages}`,
              `${EMOJIS.ARROW_RIGHT} Net Growth: ${monthStats.joins - monthStats.leaves}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: `${EMOJIS.SHIELD} Server Info`,
            value: [
              `${EMOJIS.SPEECH} Channels: ${guild.channels.cache.size}`,
              `${EMOJIS.STAR} Roles: ${guild.roles.cache.size}`,
              `${EMOJIS.CHART} Boosts: ${guild.premiumSubscriptionCount ?? 0}`,
            ].join('\n'),
            inline: true,
          },
        )
        .setFooter({ text: 'The Market Architects — Analytics' })
        .setTimestamp(),
    ],
  });

  logger.event(`Stats viewed by ${interaction.user.tag}`);
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const count = interaction.options.getInteger('count') ?? 10;
  const leaders = getLeaderboard(count);

  if (leaders.length === 0) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setDescription(`${EMOJIS.SPEECH} No activity recorded this week yet!`),
      ],
    });
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const leaderboardText = leaders.map((entry, i) => {
    const prefix = i < 3 ? medals[i] : `**${i + 1}.**`;
    return `${prefix} <@${entry.userId}> — **${entry.messageCount}** messages`;
  }).join('\n');

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${EMOJIS.TROPHY} Weekly Leaderboard`)
        .setDescription(leaderboardText)
        .setFooter({ text: 'Resets every Monday • The Market Architects' })
        .setTimestamp(),
    ],
  });

  logger.event(`Leaderboard viewed by ${interaction.user.tag}`);
}

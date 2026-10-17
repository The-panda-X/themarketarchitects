import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { buildModLogEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';

export const moderationCommands = [
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)
        .addChoices(
          { name: '5 minutes', value: 5 },
          { name: '15 minutes', value: 15 },
          { name: '1 hour', value: 60 },
          { name: '6 hours', value: 360 },
          { name: '12 hours', value: 720 },
          { name: '24 hours', value: 1440 },
          { name: '7 days', value: 10080 },
        )
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('delete_days')
        .setDescription('Days of messages to delete')
        .addChoices(
          { name: 'None', value: 0 },
          { name: '1 day', value: 1 },
          { name: '7 days', value: 7 },
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages in bulk')
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(opt => opt.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display server information'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display user information')
    .addUserOption(opt => opt.setName('user').setDescription('User to look up')),
];

export async function handleModCommand(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const executor = interaction.member as GuildMember;

  switch (interaction.commandName) {
    case 'warn': {
      const target = interaction.options.getMember('user') as GuildMember;
      const reason = interaction.options.getString('reason', true);

      if (!target) {
        await interaction.reply({ content: `${EMOJIS.CROSS} User not found.`, ephemeral: true });
        return;
      }

      try {
        await target.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.WARNING)
              .setTitle(`${EMOJIS.WARNING} Warning — ${guild.name}`)
              .setDescription(`You have been warned for: **${reason}**\n\nPlease review the server rules.`)
              .setTimestamp(),
          ],
        });
      } catch {
        // DMs closed
      }

      await logModAction(guild, 'WARN', executor.user.tag, target.user.tag, reason);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setDescription(`${EMOJIS.WARNING} **${target.user.tag}** has been warned.\n**Reason:** ${reason}`),
        ],
      });
      break;
    }

    case 'mute': {
      const target = interaction.options.getMember('user') as GuildMember;
      const duration = interaction.options.getInteger('duration', true);
      const reason = interaction.options.getString('reason', true);

      if (!target) {
        await interaction.reply({ content: `${EMOJIS.CROSS} User not found.`, ephemeral: true });
        return;
      }

      try {
        await target.timeout(duration * 60 * 1000, reason);
        await logModAction(guild, 'MUTE', executor.user.tag, target.user.tag, `${reason} (${duration}min)`);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.INFO)
              .setDescription(`${EMOJIS.LOCK} **${target.user.tag}** has been muted for **${duration} minutes**.\n**Reason:** ${reason}`),
          ],
        });
      } catch (err) {
        logger.error(`Failed to mute ${target.user.tag}`, err);
        await interaction.reply({ content: `${EMOJIS.CROSS} Failed to mute user.`, ephemeral: true });
      }
      break;
    }

    case 'kick': {
      const target = interaction.options.getMember('user') as GuildMember;
      const reason = interaction.options.getString('reason', true);

      if (!target) {
        await interaction.reply({ content: `${EMOJIS.CROSS} User not found.`, ephemeral: true });
        return;
      }

      try {
        await target.kick(reason);
        await logModAction(guild, 'KICK', executor.user.tag, target.user.tag, reason);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.DANGER)
              .setDescription(`${EMOJIS.CROSS} **${target.user.tag}** has been kicked.\n**Reason:** ${reason}`),
          ],
        });
      } catch (err) {
        logger.error(`Failed to kick ${target.user.tag}`, err);
        await interaction.reply({ content: `${EMOJIS.CROSS} Failed to kick user.`, ephemeral: true });
      }
      break;
    }

    case 'ban': {
      const target = interaction.options.getMember('user') as GuildMember;
      const reason = interaction.options.getString('reason', true);
      const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

      if (!target) {
        await interaction.reply({ content: `${EMOJIS.CROSS} User not found.`, ephemeral: true });
        return;
      }

      try {
        await target.ban({ reason, deleteMessageSeconds: deleteDays * 86400 });
        await logModAction(guild, 'BAN', executor.user.tag, target.user.tag, reason);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.DANGER)
              .setDescription(`${EMOJIS.CROSS} **${target.user.tag}** has been **banned**.\n**Reason:** ${reason}`),
          ],
        });
      } catch (err) {
        logger.error(`Failed to ban ${target.user.tag}`, err);
        await interaction.reply({ content: `${EMOJIS.CROSS} Failed to ban user.`, ephemeral: true });
      }
      break;
    }

    case 'purge': {
      const count = interaction.options.getInteger('count', true);
      const targetUser = interaction.options.getUser('user');
      const channel = interaction.channel as TextChannel;

      await interaction.deferReply({ ephemeral: true });

      try {
        let messages = await channel.messages.fetch({ limit: count });
        if (targetUser) {
          messages = messages.filter(m => m.author.id === targetUser.id);
        }

        const deleted = await channel.bulkDelete(messages, true);
        await interaction.editReply({
          content: `${EMOJIS.CHECK} Deleted **${deleted.size}** messages.`,
        });
        logger.mod(`Purge: ${executor.user.tag} deleted ${deleted.size} messages in #${channel.name}`);
      } catch (err) {
        logger.error('Purge failed', err);
        await interaction.editReply({ content: `${EMOJIS.CROSS} Failed to delete messages.` });
      }
      break;
    }

    case 'serverinfo': {
      const owner = await guild.fetchOwner();
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`${EMOJIS.CHART} ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
              { name: `${EMOJIS.CROWN} Owner`, value: owner.user.tag, inline: true },
              { name: `${EMOJIS.STAR} Members`, value: `${guild.memberCount}`, inline: true },
              { name: `${EMOJIS.SPEECH} Channels`, value: `${guild.channels.cache.size}`, inline: true },
              { name: `${EMOJIS.SHIELD} Roles`, value: `${guild.roles.cache.size}`, inline: true },
              { name: `${EMOJIS.CHART} Boosts`, value: `${guild.premiumSubscriptionCount ?? 0}`, inline: true },
              { name: `${EMOJIS.GLOBE} Created`, value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            )
            .setFooter({ text: `ID: ${guild.id}` }),
        ],
      });
      break;
    }

    case 'userinfo': {
      const target = (interaction.options.getMember('user') as GuildMember) || (interaction.member as GuildMember);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
            .addFields(
              { name: `${EMOJIS.STAR} Display Name`, value: target.displayName, inline: true },
              { name: `${EMOJIS.SHIELD} Top Role`, value: `${target.roles.highest}`, inline: true },
              { name: `${EMOJIS.GLOBE} Joined Server`, value: target.joinedAt ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
              { name: `${EMOJIS.CHART} Account Created`, value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
              { name: `${EMOJIS.BOOK} Roles (${target.roles.cache.size - 1})`, value: target.roles.cache.filter(r => r.id !== guild.id).map(r => `${r}`).join(', ') || 'None', inline: false },
            )
            .setFooter({ text: `ID: ${target.id}` }),
        ],
      });
      break;
    }
  }
}

async function logModAction(guild: import('discord.js').Guild, action: string, mod: string, target: string, reason: string) {
  const modLogs = guild.channels.cache.find(
    c => c.name === '📝・mod-logs' && c.isTextBased()
  ) as TextChannel | undefined;

  if (modLogs) {
    await modLogs.send({ embeds: [buildModLogEmbed(action, mod, target, reason)] });
  }

  logger.mod(`${action}: ${target} by ${mod} — ${reason}`);
}

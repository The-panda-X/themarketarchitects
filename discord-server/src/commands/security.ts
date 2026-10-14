import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

let lockdownActive = false;
const lockedChannels = new Map<string, bigint | null>();

export const securityCommands = [
  new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Toggle server lockdown — prevent all non-staff from sending messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('quarantine')
    .setDescription('Quarantine a suspicious user')
    .addUserOption(opt => opt.setName('user').setDescription('User to quarantine').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for quarantine'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
];

export async function handleSecurityCommand(interaction: ChatInputCommandInteraction): Promise<boolean> {
  switch (interaction.commandName) {
    case 'lockdown': {
      await handleLockdown(interaction);
      return true;
    }
    case 'quarantine': {
      await handleQuarantine(interaction);
      return true;
    }
    default:
      return false;
  }
}

async function handleLockdown(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;

  await interaction.deferReply();

  if (!lockdownActive) {
    lockdownActive = true;
    let lockedCount = 0;

    for (const [, channel] of guild.channels.cache) {
      if (!channel.isTextBased() || channel.type !== 0) continue;
      const textChannel = channel as TextChannel;

      if (textChannel.parent?.name === '🔒 STAFF ZONE') continue;

      const everyonePerms = textChannel.permissionOverwrites.cache.get(guild.id);
      lockedChannels.set(channel.id, everyonePerms?.deny.bitfield ?? null);

      try {
        await textChannel.permissionOverwrites.edit(guild.id, {
          SendMessages: false,
        });
        lockedCount++;
      } catch {
        logger.error(`Failed to lock #${textChannel.name}`);
      }
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.DANGER)
          .setTitle(`${EMOJIS.LOCK} SERVER LOCKDOWN ACTIVATED`)
          .setDescription(
            `**${lockedCount} channels** have been locked.\n\n` +
            `${EMOJIS.SHIELD} Only staff can send messages.\n` +
            `${EMOJIS.POINT_RIGHT} Use \`/lockdown\` again to lift the lockdown.`
          )
          .setTimestamp(),
      ],
    });

    // Alert in mod-logs
    const modLogs = guild.channels.cache.find(
      c => c.name === '📝・mod-logs' && c.isTextBased()
    ) as TextChannel | undefined;

    if (modLogs) {
      await modLogs.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.DANGER)
            .setTitle(`${EMOJIS.WARNING} LOCKDOWN ACTIVATED`)
            .setDescription(`Activated by ${interaction.user.tag}\n${lockedCount} channels locked.`)
            .setTimestamp(),
        ],
      });
    }

    logger.mod(`LOCKDOWN activated by ${interaction.user.tag} — ${lockedCount} channels locked`);
  } else {
    lockdownActive = false;
    let unlockedCount = 0;

    for (const [channelId] of lockedChannels) {
      const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) continue;

      try {
        await channel.permissionOverwrites.edit(guild.id, {
          SendMessages: null,
        });
        unlockedCount++;
      } catch {
        logger.error(`Failed to unlock #${channel.name}`);
      }
    }

    lockedChannels.clear();

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle(`${EMOJIS.UNLOCK} LOCKDOWN LIFTED`)
          .setDescription(`**${unlockedCount} channels** have been unlocked.`)
          .setTimestamp(),
      ],
    });

    logger.mod(`LOCKDOWN lifted by ${interaction.user.tag} — ${unlockedCount} channels unlocked`);
  }
}

async function handleQuarantine(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember('user') as GuildMember | null;
  const reason = interaction.options.getString('reason') || 'Suspicious activity';
  const guild = interaction.guild!;

  if (!target) {
    await interaction.reply({ content: `${EMOJIS.CROSS} User not found.`, ephemeral: true });
    return;
  }

  // Find or create quarantine role
  let quarantineRole = guild.roles.cache.find(r => r.name === '🔒 Quarantined');
  if (!quarantineRole) {
    try {
      quarantineRole = await guild.roles.create({
        name: '🔒 Quarantined',
        color: 0x2c2f33,
        permissions: [],
        reason: 'Quarantine system',
      });

      // Set channel permissions: deny ViewChannel everywhere except #rules and #verify-here
      for (const [, channel] of guild.channels.cache) {
        if (!channel.isTextBased() || !('permissionOverwrites' in channel)) continue;
        const name = channel.name;
        const allowView = name === '📜・rules' || name === '✅・verify-here';

        try {
          await (channel as TextChannel).permissionOverwrites.edit(quarantineRole, {
            ViewChannel: allowView ? true : false,
            SendMessages: false,
          });
        } catch { /* skip */ }
      }
    } catch (err) {
      logger.error('Failed to create quarantine role', err);
      await interaction.reply({ content: `${EMOJIS.CROSS} Failed to create quarantine role.`, ephemeral: true });
      return;
    }
  }

  try {
    // Remove all roles except @everyone and add quarantine
    const rolesToRemove = target.roles.cache.filter(r => r.id !== guild.id);
    for (const [, role] of rolesToRemove) {
      await target.roles.remove(role).catch(() => {});
    }
    await target.roles.add(quarantineRole);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.DANGER)
          .setTitle(`${EMOJIS.LOCK} User Quarantined`)
          .setDescription(
            `**${target.user.tag}** has been quarantined.\n\n` +
            `**Reason:** ${reason}\n\n` +
            `They can only see #rules and #verify-here.`
          )
          .setTimestamp(),
      ],
    });

    // DM the user
    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.DANGER)
            .setTitle(`${EMOJIS.LOCK} You Have Been Quarantined`)
            .setDescription(
              `You have been quarantined in **The Market Architects** for: **${reason}**\n\n` +
              `A staff member will review your account. If this was a mistake, please wait for staff to assist you.`
            ),
        ],
      });
    } catch { /* DMs closed */ }

    // Log to mod-logs
    const modLogs = guild.channels.cache.find(
      c => c.name === '📝・mod-logs' && c.isTextBased()
    ) as TextChannel | undefined;

    if (modLogs) {
      await modLogs.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.DANGER)
            .setTitle(`${EMOJIS.LOCK} User Quarantined`)
            .addFields(
              { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
              { name: 'By', value: interaction.user.tag, inline: true },
              { name: 'Reason', value: reason, inline: false },
            )
            .setTimestamp(),
        ],
      });
    }

    logger.mod(`Quarantined: ${target.user.tag} by ${interaction.user.tag} — ${reason}`);
  } catch (err) {
    logger.error(`Failed to quarantine ${target.user.tag}`, err);
    await interaction.reply({ content: `${EMOJIS.CROSS} Failed to quarantine user.`, ephemeral: true });
  }
}

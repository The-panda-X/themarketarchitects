import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { scheduleMessage, getScheduledMessages, cancelScheduledMessage } from '../systems/scheduler';
import { logger } from '../utils/logger';

export const utilityCommands = [
  new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule a message to be posted later')
    .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Message content').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes from now').setRequired(true).setMinValue(1).setMaxValue(43200))
    .addStringOption(opt => opt.setName('embed_title').setDescription('Optional embed title'))
    .addStringOption(opt => opt.setName('embed_description').setDescription('Optional embed description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('scheduled')
    .setDescription('View pending scheduled messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Approve or deny a suggestion')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Action to take')
        .setRequired(true)
        .addChoices(
          { name: 'Approve', value: 'approve' },
          { name: 'Deny', value: 'deny' },
        )
    )
    .addStringOption(opt => opt.setName('message_id').setDescription('Suggestion message ID').setRequired(true))
    .addStringOption(opt => opt.setName('response').setDescription('Staff response'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
];

export async function handleUtilityCommand(interaction: ChatInputCommandInteraction): Promise<boolean> {
  switch (interaction.commandName) {
    case 'schedule': {
      await handleSchedule(interaction);
      return true;
    }
    case 'scheduled': {
      await handleScheduledList(interaction);
      return true;
    }
    case 'suggestion': {
      await handleSuggestionAction(interaction);
      return true;
    }
    default:
      return false;
  }
}

async function handleSchedule(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const message = interaction.options.getString('message', true);
  const minutes = interaction.options.getInteger('minutes', true);
  const embedTitle = interaction.options.getString('embed_title') ?? undefined;
  const embedDescription = interaction.options.getString('embed_description') ?? undefined;

  const scheduledAt = new Date(Date.now() + minutes * 60 * 1000);
  const id = scheduleMessage(channel.id, message, scheduledAt, interaction.user.tag, embedTitle, embedDescription);

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(`${EMOJIS.CHECK} Message Scheduled`)
        .setDescription(
          `**Channel:** ${channel}\n` +
          `**Delivers:** <t:${Math.floor(scheduledAt.getTime() / 1000)}:R>\n` +
          `**ID:** \`${id}\`\n\n` +
          `**Preview:** ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`
        ),
    ],
  });

  logger.event(`Message scheduled by ${interaction.user.tag} for #${channel.name} in ${minutes}min`);
}

async function handleScheduledList(interaction: ChatInputCommandInteraction) {
  const messages = getScheduledMessages();

  if (messages.length === 0) {
    await interaction.reply({
      ephemeral: true,
      content: `${EMOJIS.CHECK} No pending scheduled messages.`,
    });
    return;
  }

  const list = messages.map(m => {
    const channel = interaction.guild?.channels.cache.get(m.channelId);
    return `**${m.id}** → ${channel || 'Unknown'} at <t:${Math.floor(m.scheduledAt / 1000)}:f>\n> ${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}`;
  }).join('\n\n');

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle(`${EMOJIS.LOADING} Scheduled Messages`)
        .setDescription(list),
    ],
  });
}

async function handleSuggestionAction(interaction: ChatInputCommandInteraction) {
  const action = interaction.options.getString('action', true);
  const messageId = interaction.options.getString('message_id', true);
  const response = interaction.options.getString('response') || undefined;

  const guild = interaction.guild!;
  const suggestionsChannel = guild.channels.cache.find(
    c => c.name === '💡・suggestions' && c.isTextBased()
  ) as TextChannel | undefined;

  if (!suggestionsChannel) {
    await interaction.reply({ ephemeral: true, content: `${EMOJIS.CROSS} Suggestions channel not found.` });
    return;
  }

  try {
    const msg = await suggestionsChannel.messages.fetch(messageId);
    if (!msg.embeds.length) {
      await interaction.reply({ ephemeral: true, content: `${EMOJIS.CROSS} That message is not a suggestion.` });
      return;
    }

    const originalEmbed = msg.embeds[0];
    const isApproved = action === 'approve';

    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(isApproved ? COLORS.SUCCESS : COLORS.DANGER)
      .setFields(
        { name: 'Status', value: isApproved ? `${EMOJIS.CHECK} Approved` : `${EMOJIS.CROSS} Denied`, inline: true },
        { name: 'Reviewed by', value: interaction.user.tag, inline: true },
        ...(response ? [{ name: 'Staff Response', value: response, inline: false }] : []),
      );

    await msg.edit({ embeds: [updatedEmbed] });

    await interaction.reply({
      ephemeral: true,
      content: `${EMOJIS.CHECK} Suggestion ${isApproved ? 'approved' : 'denied'}.`,
    });

    logger.event(`Suggestion ${action}: ${messageId} by ${interaction.user.tag}`);
  } catch {
    await interaction.reply({ ephemeral: true, content: `${EMOJIS.CROSS} Could not find that suggestion message.` });
  }
}

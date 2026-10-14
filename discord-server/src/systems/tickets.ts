import {
  ButtonInteraction,
  GuildMember,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

export async function handleTicketCreate(interaction: ButtonInteraction) {
  if (interaction.customId !== 'tma_create_ticket') return;

  await interaction.deferReply({ ephemeral: true });

  const member = interaction.member as GuildMember;
  const guild = interaction.guild!;

  // Check for existing open ticket
  const existingTicket = guild.channels.cache.find(
    c => c.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  );

  if (existingTicket) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.WARNING)
          .setDescription(
            `${EMOJIS.WARNING} You already have an open ticket: ${existingTicket}\n\n` +
            `Please use your existing ticket or close it first.`
          ),
      ],
    });
    return;
  }

  // Find the support category
  const supportCategory = guild.channels.cache.find(
    c => c.name === '🎧 SUPPORT' && c.type === ChannelType.GuildCategory
  );

  // Find staff roles
  const staffRoles = guild.roles.cache.filter(r =>
    ['👑 Owner', '🛡️ Admin', '⚔️ Moderator'].includes(r.name)
  );

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: supportCategory?.id,
      topic: `Support ticket for ${member.user.tag}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        ...staffRoles.map(role => ({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
          ] as bigint[],
        })),
      ],
    });

    // Send ticket embed
    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('tma_close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `${member.user} | ${staffRoles.map(r => `<@&${r.id}>`).join(' ')}`,
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.GOLD)
          .setTitle(`${EMOJIS.SPEECH} Support Ticket`)
          .setDescription(
            `${DIVIDER}\n\n` +
            `Hello ${member.user}, a staff member will be with you shortly!\n\n` +
            `**Please describe your issue in detail:**\n` +
            `• What service are you using?\n` +
            `• What is the problem?\n` +
            `• Any relevant screenshots or order IDs\n\n` +
            `${DIVIDER}`
          )
          .setFooter({ text: `Ticket opened by ${member.user.tag}` })
          .setTimestamp(),
      ],
      components: [closeRow],
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(
            `${EMOJIS.CHECK} Your ticket has been created: ${ticketChannel}\n\n` +
            `A staff member will respond shortly.`
          ),
      ],
    });

    logger.event(`Ticket created: ${member.user.tag} → #${ticketChannel.name}`);
  } catch (err) {
    logger.error(`Failed to create ticket for ${member.user.tag}`, err);
    await interaction.editReply({
      content: `${EMOJIS.CROSS} Failed to create ticket. Please contact an admin.`,
    });
  }
}

const DIVIDER = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

export async function handleTicketClose(interaction: ButtonInteraction) {
  if (interaction.customId !== 'tma_close_ticket') return;

  await interaction.deferReply();

  const member = interaction.member as GuildMember;
  const channel = interaction.channel as TextChannel;

  // Only staff or ticket creator can close
  const isStaff = member.roles.cache.some(r =>
    ['👑 Owner', '🛡️ Admin', '⚔️ Moderator'].includes(r.name)
  );
  const isTicketOwner = channel.name.includes(
    member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  if (!isStaff && !isTicketOwner) {
    await interaction.editReply({
      content: `${EMOJIS.CROSS} Only staff or the ticket creator can close this ticket.`,
    });
    return;
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.DANGER)
        .setDescription(
          `${EMOJIS.LOCK} This ticket will be deleted in **10 seconds**.\n\n` +
          `Closed by ${member.user}`
        ),
    ],
  });

  logger.event(`Ticket closed: #${channel.name} by ${member.user.tag}`);

  // Save transcript to mod-logs
  const modLogs = interaction.guild?.channels.cache.find(
    c => c.name === '📝・mod-logs' && c.isTextBased()
  ) as TextChannel | undefined;

  if (modLogs) {
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`)
      .join('\n');

    await modLogs.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setTitle(`${EMOJIS.BOOK} Ticket Transcript — #${channel.name}`)
          .setDescription(
            transcript.length > 4000
              ? transcript.substring(0, 4000) + '\n... (truncated)'
              : transcript || '*No messages*'
          )
          .setFooter({ text: `Closed by ${member.user.tag}` })
          .setTimestamp(),
      ],
    });
  }

  setTimeout(async () => {
    try {
      await channel.delete();
    } catch {
      logger.error(`Failed to delete ticket channel #${channel.name}`);
    }
  }, 10_000);
}

import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  GuildMember,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  TextChannel,
} from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';
import { trackTicket } from './tracker';

const DIVIDER = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

const TICKET_CATEGORIES = [
  { label: 'General Question', value: 'general', emoji: '💬', description: 'General inquiries about TMA' },
  { label: 'Order Issue', value: 'order_issue', emoji: '📦', description: 'Issues with an existing order' },
  { label: 'Refund Request', value: 'refund', emoji: '💸', description: 'Request a refund' },
  { label: 'Technical Issue', value: 'technical', emoji: '🔧', description: 'Technical or platform problems' },
  { label: 'Partnership', value: 'partnership', emoji: '🤝', description: 'Partnership or collaboration inquiry' },
];

const TICKET_PRIORITIES = [
  { label: 'Low', value: 'low', emoji: '🟢', description: 'Not urgent — can wait a few days' },
  { label: 'Medium', value: 'medium', emoji: '🟡', description: 'Moderate urgency — within 24 hours' },
  { label: 'High', value: 'high', emoji: '🟠', description: 'Urgent — needs attention soon' },
  { label: 'Urgent', value: 'urgent', emoji: '🔴', description: 'Critical — immediate attention needed' },
];

interface PendingTicket {
  category?: string;
  priority?: string;
  userId: string;
  timestamp: number;
}

const pendingTickets = new Map<string, PendingTicket>();

interface TicketMeta {
  channelId: string;
  userId: string;
  category: string;
  priority: string;
  createdAt: number;
  lastActivity: number;
  warningsSent: number;
}

const activeTickets = new Map<string, TicketMeta>();

export async function handleTicketCreate(interaction: ButtonInteraction) {
  if (interaction.customId !== 'tma_create_ticket') return;

  const member = interaction.member as GuildMember;
  const guild = interaction.guild!;

  const existingTicket = guild.channels.cache.find(
    c => c.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  );

  if (existingTicket) {
    await interaction.reply({
      ephemeral: true,
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

  pendingTickets.set(member.id, { userId: member.id, timestamp: Date.now() });

  const categoryMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('tma_ticket_category')
      .setPlaceholder('Select a ticket category...')
      .addOptions(TICKET_CATEGORIES.map(c => ({
        label: c.label,
        value: c.value,
        emoji: c.emoji,
        description: c.description,
      })))
  );

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${EMOJIS.SPEECH} Create Support Ticket`)
        .setDescription(`${DIVIDER}\n\n**Step 1/2:** Select the category for your ticket.\n\n${DIVIDER}`),
    ],
    components: [categoryMenu],
  });
}

export async function handleTicketCategory(interaction: StringSelectMenuInteraction) {
  const member = interaction.member as GuildMember;
  const pending = pendingTickets.get(member.id);
  if (!pending) {
    await interaction.reply({ ephemeral: true, content: `${EMOJIS.CROSS} Ticket session expired. Please try again.` });
    return;
  }

  pending.category = interaction.values[0];

  const priorityMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('tma_ticket_priority')
      .setPlaceholder('Select priority level...')
      .addOptions(TICKET_PRIORITIES.map(p => ({
        label: p.label,
        value: p.value,
        emoji: p.emoji,
        description: p.description,
      })))
  );

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${EMOJIS.SPEECH} Create Support Ticket`)
        .setDescription(
          `${DIVIDER}\n\n` +
          `**Category:** ${TICKET_CATEGORIES.find(c => c.value === pending.category)?.emoji} ${TICKET_CATEGORIES.find(c => c.value === pending.category)?.label}\n\n` +
          `**Step 2/2:** Select the priority level.\n\n${DIVIDER}`
        ),
    ],
    components: [priorityMenu],
  });
}

export async function handleTicketPriority(interaction: StringSelectMenuInteraction) {
  const member = interaction.member as GuildMember;
  const guild = interaction.guild!;
  const pending = pendingTickets.get(member.id);

  if (!pending || !pending.category) {
    await interaction.reply({ ephemeral: true, content: `${EMOJIS.CROSS} Ticket session expired. Please try again.` });
    return;
  }

  pending.priority = interaction.values[0];
  pendingTickets.delete(member.id);

  const category = TICKET_CATEGORIES.find(c => c.value === pending.category)!;
  const priority = TICKET_PRIORITIES.find(p => p.value === pending.priority)!;

  const supportCategory = guild.channels.cache.find(
    c => c.name === '🎧 SUPPORT' && c.type === ChannelType.GuildCategory
  );

  const staffRoles = guild.roles.cache.filter(r =>
    ['👑 Owner', '🛡️ Admin', '⚔️ Moderator'].includes(r.name)
  );

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: supportCategory?.id,
      topic: `${category.emoji} ${category.label} | ${priority.emoji} ${priority.label} | ${member.user.tag}`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
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

    activeTickets.set(ticketChannel.id, {
      channelId: ticketChannel.id,
      userId: member.id,
      category: pending.category!,
      priority: pending.priority!,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      warningsSent: 0,
    });

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('tma_close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    const priorityColor = pending.priority === 'urgent' ? COLORS.DANGER
      : pending.priority === 'high' ? COLORS.WARNING
      : pending.priority === 'medium' ? COLORS.GOLD
      : COLORS.SUCCESS;

    await ticketChannel.send({
      content: `${member.user} | ${staffRoles.map(r => `<@&${r.id}>`).join(' ')}`,
      embeds: [
        new EmbedBuilder()
          .setColor(priorityColor)
          .setTitle(`${EMOJIS.SPEECH} Support Ticket`)
          .setDescription(
            `${DIVIDER}\n\n` +
            `Hello ${member.user}, a staff member will be with you shortly!\n\n` +
            `**Category:** ${category.emoji} ${category.label}\n` +
            `**Priority:** ${priority.emoji} ${priority.label}\n\n` +
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

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(
            `${EMOJIS.CHECK} Your ticket has been created: ${ticketChannel}\n\n` +
            `**Category:** ${category.emoji} ${category.label}\n` +
            `**Priority:** ${priority.emoji} ${priority.label}\n\n` +
            `A staff member will respond shortly.`
          ),
      ],
      components: [],
    });

    trackTicket();
    logger.event(`Ticket created: ${member.user.tag} → #${ticketChannel.name} [${category.label}/${priority.label}]`);
  } catch (err) {
    logger.error(`Failed to create ticket for ${member.user.tag}`, err);
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.DANGER)
          .setDescription(`${EMOJIS.CROSS} Failed to create ticket. Please contact an admin.`),
      ],
      components: [],
    });
  }
}

export async function handleTicketClose(interaction: ButtonInteraction) {
  if (interaction.customId !== 'tma_close_ticket') return;

  const member = interaction.member as GuildMember;
  const channel = interaction.channel as TextChannel;

  const isStaff = member.roles.cache.some(r =>
    ['👑 Owner', '🛡️ Admin', '⚔️ Moderator'].includes(r.name)
  );
  const isTicketOwner = channel.name.includes(
    member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  if (!isStaff && !isTicketOwner) {
    await interaction.reply({
      ephemeral: true,
      content: `${EMOJIS.CROSS} Only staff or the ticket creator can close this ticket.`,
    });
    return;
  }

  // Show rating buttons
  const ratingRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...[1, 2, 3, 4, 5].map(n =>
      new ButtonBuilder()
        .setCustomId(`tma_ticket_rate_${n}`)
        .setLabel('⭐'.repeat(n))
        .setStyle(n >= 4 ? ButtonStyle.Success : n >= 2 ? ButtonStyle.Primary : ButtonStyle.Danger)
    )
  );

  const skipRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('tma_ticket_rate_skip')
      .setLabel('Skip Rating')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${EMOJIS.STAR} Rate Your Support Experience`)
        .setDescription('How was your experience? Your feedback helps us improve!'),
    ],
    components: [ratingRow, skipRow],
  });
}

export async function handleTicketRating(interaction: ButtonInteraction) {
  const channel = interaction.channel as TextChannel;
  const member = interaction.member as GuildMember;
  const rating = interaction.customId === 'tma_ticket_rate_skip'
    ? null
    : parseInt(interaction.customId.replace('tma_ticket_rate_', ''));

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.DANGER)
        .setDescription(
          `${EMOJIS.LOCK} This ticket will be deleted in **10 seconds**.\n\n` +
          `${rating ? `Rating: ${'⭐'.repeat(rating)} (${rating}/5)` : 'No rating provided'}\n` +
          `Closed by ${member.user}`
        ),
    ],
    components: [],
  });

  logger.event(`Ticket closed: #${channel.name} by ${member.user.tag}${rating ? ` — Rating: ${rating}/5` : ''}`);

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

    const ticketMeta = activeTickets.get(channel.id);
    const categoryInfo = ticketMeta
      ? `Category: ${TICKET_CATEGORIES.find(c => c.value === ticketMeta.category)?.label || 'Unknown'} | Priority: ${TICKET_PRIORITIES.find(p => p.value === ticketMeta.priority)?.label || 'Unknown'}`
      : '';

    await modLogs.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setTitle(`${EMOJIS.BOOK} Ticket Transcript — #${channel.name}`)
          .setDescription(
            transcript.length > 3800
              ? transcript.substring(0, 3800) + '\n... (truncated)'
              : transcript || '*No messages*'
          )
          .addFields(
            { name: 'Details', value: categoryInfo || 'N/A', inline: true },
            { name: 'Rating', value: rating ? `${'⭐'.repeat(rating)} (${rating}/5)` : 'Not rated', inline: true },
          )
          .setFooter({ text: `Closed by ${member.user.tag}` })
          .setTimestamp(),
      ],
    });
  }

  activeTickets.delete(channel.id);

  setTimeout(async () => {
    try {
      await channel.delete();
    } catch {
      logger.error(`Failed to delete ticket channel #${channel.name}`);
    }
  }, 10_000);
}

export function updateTicketActivity(channelId: string): void {
  const meta = activeTickets.get(channelId);
  if (meta) {
    meta.lastActivity = Date.now();
  }
}

export function startTicketAutoClose(client: import('discord.js').Client): void {
  setInterval(async () => {
    const now = Date.now();
    const WARNING_THRESHOLD = 24 * 60 * 60 * 1000;
    const CLOSE_THRESHOLD = 48 * 60 * 60 * 1000;

    for (const [channelId, meta] of activeTickets) {
      const inactiveTime = now - meta.lastActivity;
      const channel = client.channels.cache.get(channelId) as TextChannel | undefined;

      if (!channel) {
        activeTickets.delete(channelId);
        continue;
      }

      if (inactiveTime >= CLOSE_THRESHOLD) {
        try {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.DANGER)
                .setDescription(`${EMOJIS.LOCK} This ticket has been **automatically closed** due to 48 hours of inactivity.`),
            ],
          });
          setTimeout(() => channel.delete().catch(() => {}), 10_000);
          activeTickets.delete(channelId);
          logger.event(`Ticket auto-closed: #${channel.name} (48h inactivity)`);
        } catch {
          logger.error(`Failed to auto-close ticket #${channel.name}`);
        }
      } else if (inactiveTime >= WARNING_THRESHOLD && meta.warningsSent === 0) {
        try {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(
                  `${EMOJIS.WARNING} This ticket has been inactive for **24 hours**.\n\n` +
                  `It will be **automatically closed** in 24 hours if no new messages are sent.`
                ),
            ],
          });
          meta.warningsSent++;
        } catch {
          logger.error(`Failed to send inactivity warning for #${channel.name}`);
        }
      }
    }
  }, 30 * 60 * 1000);

  logger.info('Ticket auto-close system started');
}

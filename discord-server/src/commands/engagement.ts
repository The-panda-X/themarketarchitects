import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { COLORS, EMOJIS, SERVER } from '../config';
import { logger } from '../utils/logger';

export const engagementCommands = [
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a formatted announcement')
    .addStringOption(opt => opt.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Announcement message').setRequired(true))
    .addRoleOption(opt => opt.setName('ping').setDescription('Role to ping'))
    .addStringOption(opt => opt.setName('color').setDescription('Embed color (red/gold/blue/green)').addChoices(
      { name: 'Red (Default)', value: 'red' },
      { name: 'Gold', value: 'gold' },
      { name: 'Blue', value: 'blue' },
      { name: 'Green', value: 'green' },
    ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create a reaction-based giveaway')
    .addStringOption(opt => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(10))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed in any channel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true))
    .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Embed description').setRequired(true))
    .addStringOption(opt => opt.setName('color').setDescription('Embed color').addChoices(
      { name: 'Red', value: 'red' },
      { name: 'Gold', value: 'gold' },
      { name: 'Blue', value: 'blue' },
      { name: 'Green', value: 'green' },
      { name: 'White', value: 'white' },
    ))
    .addStringOption(opt => opt.setName('footer').setDescription('Footer text'))
    .addStringOption(opt => opt.setName('image').setDescription('Image URL'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for going AFK')),
];

const COLOR_MAP: Record<string, number> = {
  red: COLORS.PRIMARY,
  gold: COLORS.GOLD,
  blue: COLORS.INFO,
  green: COLORS.SUCCESS,
  white: COLORS.WHITE,
};

interface GiveawayData {
  messageId: string;
  channelId: string;
  prize: string;
  winnersCount: number;
  endsAt: number;
  hostId: string;
}

const activeGiveaways = new Map<string, GiveawayData>();

export async function handleEngagementCommand(interaction: ChatInputCommandInteraction): Promise<boolean> {
  switch (interaction.commandName) {
    case 'announce': {
      await handleAnnounce(interaction);
      return true;
    }
    case 'giveaway': {
      await handleGiveaway(interaction);
      return true;
    }
    case 'embed': {
      await handleEmbed(interaction);
      return true;
    }
    case 'afk': {
      await handleAFK(interaction);
      return true;
    }
    default:
      return false;
  }
}

async function handleAnnounce(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const message = interaction.options.getString('message', true);
  const pingRole = interaction.options.getRole('ping');
  const color = interaction.options.getString('color') || 'red';

  const guild = interaction.guild!;
  const announcements = guild.channels.cache.find(
    c => c.name === '📢・announcements' && c.isTextBased()
  ) as TextChannel | undefined;

  if (!announcements) {
    await interaction.reply({ content: `${EMOJIS.CROSS} Announcements channel not found.`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR_MAP[color] || COLORS.PRIMARY)
    .setTitle(`${EMOJIS.MEGAPHONE} ${title}`)
    .setDescription(message)
    .setFooter({ text: `The Market Architects` })
    .setTimestamp();

  await announcements.send({
    content: pingRole ? `<@&${pingRole.id}>` : undefined,
    embeds: [embed],
  });

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setDescription(`${EMOJIS.CHECK} Announcement posted to ${announcements}!`),
    ],
  });

  logger.event(`Announcement posted by ${interaction.user.tag}: ${title}`);
}

async function handleGiveaway(interaction: ChatInputCommandInteraction) {
  const prize = interaction.options.getString('prize', true);
  const duration = interaction.options.getInteger('duration', true);
  const winnersCount = interaction.options.getInteger('winners') ?? 1;
  const channel = interaction.channel as TextChannel;

  const endsAt = Date.now() + duration * 60 * 1000;

  const embed = new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`${EMOJIS.SPARKLE} GIVEAWAY ${EMOJIS.SPARKLE}`)
    .setDescription(
      `**${prize}**\n\n` +
      `React with 🎉 to enter!\n\n` +
      `${EMOJIS.STAR} **Winners:** ${winnersCount}\n` +
      `${EMOJIS.LOADING} **Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n` +
      `${EMOJIS.CROWN} **Hosted by:** ${interaction.user}`
    )
    .setFooter({ text: `${winnersCount} winner${winnersCount > 1 ? 's' : ''} | Ends at` })
    .setTimestamp(endsAt);

  await interaction.reply({ content: `${EMOJIS.CHECK} Giveaway started!`, ephemeral: true });

  const msg = await channel.send({ embeds: [embed] });
  await msg.react('🎉');

  const giveaway: GiveawayData = {
    messageId: msg.id,
    channelId: channel.id,
    prize,
    winnersCount,
    endsAt,
    hostId: interaction.user.id,
  };
  activeGiveaways.set(msg.id, giveaway);

  setTimeout(async () => {
    try {
      const fetchedMsg = await channel.messages.fetch(msg.id);
      const reaction = fetchedMsg.reactions.cache.get('🎉');
      const users = reaction ? await reaction.users.fetch() : undefined;
      const entries = users ? users.filter(u => !u.bot) : undefined;

      if (!entries || entries.size === 0) {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.DANGER)
              .setTitle(`${EMOJIS.CROSS} Giveaway Ended`)
              .setDescription(`Nobody entered the giveaway for **${prize}**!`),
          ],
        });
      } else {
        const entryArray = Array.from(entries.values());
        const winners: typeof entryArray = [];
        const count = Math.min(winnersCount, entryArray.length);

        while (winners.length < count) {
          const idx = Math.floor(Math.random() * entryArray.length);
          const winner = entryArray.splice(idx, 1)[0];
          winners.push(winner);
        }

        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.GOLD)
              .setTitle(`${EMOJIS.TROPHY} Giveaway Winner${winners.length > 1 ? 's' : ''}!`)
              .setDescription(
                `**Prize:** ${prize}\n\n` +
                `${EMOJIS.SPARKLE} ${winners.map(w => `<@${w.id}>`).join(', ')} ${EMOJIS.SPARKLE}\n\n` +
                `Congratulations! Please contact ${interaction.user} to claim your prize.`
              )
              .setTimestamp(),
          ],
        });
      }

      activeGiveaways.delete(msg.id);
      logger.event(`Giveaway ended: ${prize}`);
    } catch (err) {
      logger.error('Failed to end giveaway', err);
    }
  }, duration * 60 * 1000);

  logger.event(`Giveaway started by ${interaction.user.tag}: ${prize} (${duration}min, ${winnersCount} winners)`);
}

async function handleEmbed(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description', true);
  const color = interaction.options.getString('color') || 'red';
  const footer = interaction.options.getString('footer');
  const image = interaction.options.getString('image');

  const embed = new EmbedBuilder()
    .setColor(COLOR_MAP[color] || COLORS.PRIMARY)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (footer) embed.setFooter({ text: footer });
  if (image) embed.setImage(image);

  try {
    await channel.send({ embeds: [embed] });
    await interaction.reply({
      ephemeral: true,
      content: `${EMOJIS.CHECK} Embed sent to ${channel}!`,
    });
    logger.event(`Custom embed sent by ${interaction.user.tag} to #${channel.name}`);
  } catch (err) {
    logger.error(`Failed to send embed to #${channel.name}`, err);
    await interaction.reply({ ephemeral: true, content: `${EMOJIS.CROSS} Failed to send embed. Check channel permissions.` });
  }
}

async function handleAFK(interaction: ChatInputCommandInteraction) {
  const { setAFK } = await import('../systems/afk');
  const reason = interaction.options.getString('reason') || 'AFK';

  setAFK(interaction.user.id, reason);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setDescription(`${EMOJIS.LOADING} ${interaction.user} is now **AFK**: ${reason}`),
    ],
  });

  logger.event(`AFK set: ${interaction.user.tag} — ${reason}`);
}

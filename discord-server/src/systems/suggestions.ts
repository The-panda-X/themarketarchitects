import { Message, TextChannel, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

export async function handleSuggestion(message: Message): Promise<boolean> {
  if (!message.guild || message.author.bot) return false;

  const channel = message.channel as TextChannel;
  if (channel.name !== '💡・suggestions') return false;

  try {
    const embed = new EmbedBuilder()
      .setColor(COLORS.GOLD)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(`${EMOJIS.SPEECH} New Suggestion`)
      .setDescription(message.content)
      .addFields({ name: 'Status', value: `${EMOJIS.LOADING} Pending Review`, inline: true })
      .setFooter({ text: `Suggestion ID: ${message.id}` })
      .setTimestamp();

    await message.delete().catch(() => {});

    const suggestionMsg = await channel.send({ embeds: [embed] });
    await suggestionMsg.react('✅');
    await suggestionMsg.react('❌');

    logger.event(`Suggestion submitted by ${message.author.tag}`);
    return true;
  } catch (err) {
    logger.error('Failed to process suggestion', err);
    return false;
  }
}

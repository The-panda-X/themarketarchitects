import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

const MILESTONE_INTERVAL = 50;
let lastMilestone = 0;

export async function checkMilestone(guild: Guild): Promise<void> {
  const memberCount = guild.memberCount;
  const currentMilestone = Math.floor(memberCount / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;

  if (currentMilestone <= 0 || currentMilestone === lastMilestone) return;
  if (memberCount !== currentMilestone) return;

  lastMilestone = currentMilestone;

  const announcements = guild.channels.cache.find(
    c => c.name === '📢・announcements' && c.isTextBased()
  ) as TextChannel | undefined;

  if (!announcements) return;

  try {
    await announcements.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.GOLD)
          .setTitle(`${EMOJIS.TROPHY}${EMOJIS.SPARKLE} MILESTONE REACHED! ${EMOJIS.SPARKLE}${EMOJIS.TROPHY}`)
          .setDescription(
            `We just hit **${currentMilestone} members**! ${EMOJIS.ROCKET}\n\n` +
            `Thank you all for being part of **The Market Architects** community! ` +
            `Every one of you makes this community stronger.\n\n` +
            `${EMOJIS.POINT_RIGHT} Share the love — invite your trader friends!\n` +
            `${EMOJIS.POINT_RIGHT} Next milestone: **${currentMilestone + MILESTONE_INTERVAL} members**!`
          )
          .setFooter({ text: 'The Market Architects — Growing Together' })
          .setTimestamp(),
      ],
    });

    logger.success(`Milestone reached: ${currentMilestone} members!`);
  } catch (err) {
    logger.error('Failed to post milestone announcement', err);
  }
}

import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

interface ScheduledMessage {
  id: string;
  channelId: string;
  content: string;
  embedTitle?: string;
  embedDescription?: string;
  scheduledAt: number;
  createdBy: string;
  executed: boolean;
}

const scheduledMessages: ScheduledMessage[] = [];
let messageIdCounter = 0;

export function scheduleMessage(channelId: string, content: string, scheduledAt: Date, createdBy: string, embedTitle?: string, embedDescription?: string): string {
  const id = `sched_${++messageIdCounter}`;
  scheduledMessages.push({
    id,
    channelId,
    content,
    embedTitle,
    embedDescription,
    scheduledAt: scheduledAt.getTime(),
    createdBy,
    executed: false,
  });
  return id;
}

export function getScheduledMessages(): ScheduledMessage[] {
  return scheduledMessages.filter(m => !m.executed);
}

export function cancelScheduledMessage(id: string): boolean {
  const msg = scheduledMessages.find(m => m.id === id && !m.executed);
  if (msg) {
    msg.executed = true;
    return true;
  }
  return false;
}

export function startScheduler(client: Client): void {
  setInterval(async () => {
    const now = Date.now();
    for (const msg of scheduledMessages) {
      if (msg.executed || msg.scheduledAt > now) continue;
      msg.executed = true;

      try {
        const channel = client.channels.cache.get(msg.channelId) as TextChannel | undefined;
        if (!channel) {
          logger.warn(`Scheduled message ${msg.id}: channel not found`);
          continue;
        }

        if (msg.embedTitle || msg.embedDescription) {
          await channel.send({
            content: msg.content || undefined,
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setTitle(msg.embedTitle || null)
                .setDescription(msg.embedDescription || null)
                .setTimestamp(),
            ],
          });
        } else {
          await channel.send(msg.content);
        }

        logger.success(`Scheduled message ${msg.id} delivered to #${channel.name}`);
      } catch (err) {
        logger.error(`Failed to deliver scheduled message ${msg.id}`, err);
      }
    }
  }, 30_000);

  logger.info('Message scheduler started');
}

const TRADING_TIPS = [
  `${EMOJIS.TARGET} **Tip of the Day:** Always define your risk before entering a trade. A 1-2% max risk per trade keeps your account safe long-term.`,
  `${EMOJIS.CHART} **Tip of the Day:** Don't chase the market. If you miss an entry, wait for the next setup. Patience is a trader's best friend.`,
  `${EMOJIS.SHIELD} **Tip of the Day:** Journal every trade — wins AND losses. Reviewing your journal weekly reveals patterns you can't see in the moment.`,
  `${EMOJIS.BOLT} **Tip of the Day:** Avoid trading during high-impact news unless your strategy is designed for it. Volatility cuts both ways.`,
  `${EMOJIS.STAR} **Tip of the Day:** Focus on one or two currency pairs. Mastering a pair's behavior beats surface-level knowledge of dozens.`,
  `${EMOJIS.TROPHY} **Tip of the Day:** Your trading plan is your edge. Trading without one is gambling. Write it down and follow it.`,
  `${EMOJIS.DIAMOND} **Tip of the Day:** Never move your stop loss further away from entry. If the setup is invalidated, accept the loss and move on.`,
  `${EMOJIS.MONEY} **Tip of the Day:** Compound your gains, don't increase lot size recklessly. Steady growth beats boom-bust cycles.`,
  `${EMOJIS.BOOK} **Tip of the Day:** Backtest your strategy on at least 100 trades before going live. Data beats intuition.`,
  `${EMOJIS.ROCKET} **Tip of the Day:** Scale into winners, not losers. Adding to a losing position is one of the fastest ways to blow an account.`,
];

let tipIndex = 0;

export function startDailyTips(client: Client, guildId: string): void {
  function postTip() {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const education = guild.channels.cache.find(
      c => c.name === '📚・education' && c.isTextBased()
    ) as TextChannel | undefined;

    if (!education) return;

    const tip = TRADING_TIPS[tipIndex % TRADING_TIPS.length];
    tipIndex++;

    education.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.GOLD)
          .setTitle(`${EMOJIS.BOOK} Daily Trading Tip`)
          .setDescription(tip)
          .setFooter({ text: 'The Market Architects — Level Up Your Trading' })
          .setTimestamp(),
      ],
    }).catch(err => logger.error('Failed to post daily tip', err));
  }

  // Post first tip at next 9:00 AM UTC, then every 24 hours
  const now = new Date();
  const next9am = new Date(now);
  next9am.setUTCHours(9, 0, 0, 0);
  if (now > next9am) next9am.setDate(next9am.getDate() + 1);

  const delay = next9am.getTime() - now.getTime();
  setTimeout(() => {
    postTip();
    setInterval(postTip, 24 * 60 * 60 * 1000);
  }, delay);

  logger.info('Daily trading tips scheduled');
}

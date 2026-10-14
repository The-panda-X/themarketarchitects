import { Message, GuildMember } from 'discord.js';

interface DailyStats {
  date: string;
  joins: number;
  leaves: number;
  messages: number;
  tickets: number;
  verifications: number;
}

interface MemberActivity {
  userId: string;
  username: string;
  messageCount: number;
  weekStart: number;
}

const stats: Map<string, DailyStats> = new Map();
const weeklyActivity: Map<string, MemberActivity> = new Map();
const inviteTracker: Map<string, string> = new Map();

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getOrCreateToday(): DailyStats {
  const key = todayKey();
  let day = stats.get(key);
  if (!day) {
    day = { date: key, joins: 0, leaves: 0, messages: 0, tickets: 0, verifications: 0 };
    stats.set(key, day);
  }
  return day;
}

function currentWeekStart(): number {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

export function trackJoin(): void {
  getOrCreateToday().joins++;
}

export function trackLeave(): void {
  getOrCreateToday().leaves++;
}

export function trackMessage(message: Message): void {
  if (message.author.bot) return;
  getOrCreateToday().messages++;

  const weekStart = currentWeekStart();
  const entry = weeklyActivity.get(message.author.id);
  if (entry && entry.weekStart === weekStart) {
    entry.messageCount++;
    entry.username = message.author.tag;
  } else {
    weeklyActivity.set(message.author.id, {
      userId: message.author.id,
      username: message.author.tag,
      messageCount: 1,
      weekStart,
    });
  }
}

export function trackTicket(): void {
  getOrCreateToday().tickets++;
}

export function trackVerification(): void {
  getOrCreateToday().verifications++;
}

export function trackInviteSource(userId: string, inviteCode: string): void {
  inviteTracker.set(userId, inviteCode);
}

export function getStatsForPeriod(days: number): { joins: number; leaves: number; messages: number; tickets: number; verifications: number } {
  const result = { joins: 0, leaves: 0, messages: 0, tickets: 0, verifications: 0 };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  for (const [date, day] of stats) {
    if (date >= cutoffStr) {
      result.joins += day.joins;
      result.leaves += day.leaves;
      result.messages += day.messages;
      result.tickets += day.tickets;
      result.verifications += day.verifications;
    }
  }
  return result;
}

export function getTodayStats(): DailyStats {
  return getOrCreateToday();
}

export function getLeaderboard(limit: number = 10): MemberActivity[] {
  const weekStart = currentWeekStart();
  return Array.from(weeklyActivity.values())
    .filter(a => a.weekStart === weekStart)
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, limit);
}

export function resetWeeklyLeaderboard(): void {
  weeklyActivity.clear();
}

// Clean stats older than 90 days periodically
setInterval(() => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  for (const date of stats.keys()) {
    if (date < cutoffStr) stats.delete(date);
  }
}, 24 * 60 * 60 * 1000);

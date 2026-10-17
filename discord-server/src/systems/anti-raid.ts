import { GuildMember, TextChannel } from 'discord.js';
import { EMOJIS } from '../config';
import { logger } from '../utils/logger';

interface JoinRecord {
  userId: string;
  timestamp: number;
}

const recentJoins: JoinRecord[] = [];
let raidMode = false;

const RAID_THRESHOLD = 10;
const RAID_WINDOW = 10_000;
const RAID_COOLDOWN = 5 * 60 * 1000;

export async function checkForRaid(member: GuildMember): Promise<boolean> {
  const now = Date.now();

  // Clean old records
  while (recentJoins.length > 0 && recentJoins[0].timestamp < now - RAID_WINDOW) {
    recentJoins.shift();
  }

  recentJoins.push({ userId: member.id, timestamp: now });

  // Check if raid threshold exceeded
  if (recentJoins.length >= RAID_THRESHOLD && !raidMode) {
    raidMode = true;
    logger.warn(`RAID DETECTED: ${recentJoins.length} joins in ${RAID_WINDOW / 1000}s`);

    // Alert staff
    const modLogs = member.guild.channels.cache.find(
      c => c.name === '📝・mod-logs' && c.isTextBased()
    ) as TextChannel | undefined;

    if (modLogs) {
      const staffRoles = member.guild.roles.cache.filter(r =>
        ['👑 Owner', '🛡️ Admin'].includes(r.name)
      );

      await modLogs.send(
        `${EMOJIS.WARNING}${EMOJIS.WARNING}${EMOJIS.WARNING} **RAID ALERT** ${EMOJIS.WARNING}${EMOJIS.WARNING}${EMOJIS.WARNING}\n\n` +
        `**${recentJoins.length} accounts joined in ${RAID_WINDOW / 1000} seconds!**\n\n` +
        `${EMOJIS.SHIELD} Anti-raid mode **ENABLED** — new accounts will be kicked for ${RAID_COOLDOWN / 60000} minutes.\n\n` +
        `${staffRoles.map(r => `<@&${r.id}>`).join(' ')} please review!`
      );
    }

    // Auto-disable after cooldown
    setTimeout(() => {
      raidMode = false;
      logger.info('Anti-raid mode disabled (cooldown expired)');
      if (modLogs) {
        modLogs.send(`${EMOJIS.CHECK} Anti-raid mode **DISABLED** — cooldown expired.`);
      }
    }, RAID_COOLDOWN);
  }

  if (raidMode) {
    // Kick new joins during raid mode (unless account is old)
    const accountAge = Date.now() - member.user.createdTimestamp;
    const isNewAccount = accountAge < 30 * 24 * 60 * 60 * 1000; // 30 days

    if (isNewAccount) {
      try {
        await member.kick('Anti-raid: suspicious join during raid detection');
        logger.mod(`Raid-kicked: ${member.user.tag} (account age: ${Math.floor(accountAge / 86400000)}d)`);
        return true;
      } catch {
        logger.error(`Failed to kick ${member.user.tag} during raid`);
      }
    }
  }

  return false;
}

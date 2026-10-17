import { ButtonInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config';
import { logger } from '../utils/logger';

const ROLE_MAP: Record<string, string> = {
  role_challenge_passing: '🎯 Challenge Passing',
  role_account_management: '📈 Account Management',
  role_account_growth: '🚀 Account Growth',
  role_announcements: '🔔 Announcements',
  role_signal_alerts: '📊 Signal Alerts',
  role_promo_alerts: '🎁 Promo Alerts',
};

export async function handleRoleToggle(interaction: ButtonInteraction) {
  const roleName = ROLE_MAP[interaction.customId];
  if (!roleName) return;

  await interaction.deferReply({ ephemeral: true });

  const member = interaction.member as GuildMember;
  const guild = interaction.guild!;
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (!role) {
    await interaction.editReply({
      content: `${EMOJIS.CROSS} Role not found. Please contact an admin.`,
    });
    return;
  }

  try {
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setDescription(`${EMOJIS.CROSS} Removed role: **${roleName}**`),
        ],
      });
      logger.event(`Role removed: ${member.user.tag} → ${roleName}`);
    } else {
      await member.roles.add(role);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription(`${EMOJIS.CHECK} Added role: **${roleName}**`),
        ],
      });
      logger.event(`Role added: ${member.user.tag} → ${roleName}`);
    }
  } catch (err) {
    logger.error(`Role toggle failed for ${member.user.tag}`, err);
    await interaction.editReply({
      content: `${EMOJIS.CROSS} Failed to update role. Please contact an admin.`,
    });
  }
}

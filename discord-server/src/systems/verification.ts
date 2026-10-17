import {
  ButtonInteraction,
  GuildMember,
  EmbedBuilder,
} from 'discord.js';
import { COLORS, EMOJIS, VERIFICATION } from '../config';
import { logger } from '../utils/logger';

export async function handleVerification(interaction: ButtonInteraction) {
  if (interaction.customId !== VERIFICATION.customId) return;

  await interaction.deferReply({ ephemeral: true });

  const member = interaction.member as GuildMember;
  const guild = interaction.guild!;

  // Check account age
  const accountAge = Date.now() - member.user.createdTimestamp;
  const minAge = VERIFICATION.minAccountAgeDays * 24 * 60 * 60 * 1000;

  if (accountAge < minAge) {
    const daysOld = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.DANGER)
          .setTitle(`${EMOJIS.CROSS} Verification Failed`)
          .setDescription(
            `Your account is only **${daysOld} days old**.\n\n` +
            `For security, accounts must be at least **${VERIFICATION.minAccountAgeDays} days old** to verify.\n\n` +
            `Please try again later.`
          ),
      ],
    });
    logger.mod(`Verification denied: ${member.user.tag} (account too new: ${daysOld} days)`);
    return;
  }

  // Check if already verified
  const verifiedRole = guild.roles.cache.find(r => r.name === '✅ Verified');
  const unverifiedRole = guild.roles.cache.find(r => r.name === '⏳ Unverified');

  if (!verifiedRole) {
    await interaction.editReply({
      content: `${EMOJIS.CROSS} Verification role not found. Please contact an admin.`,
    });
    return;
  }

  if (member.roles.cache.has(verifiedRole.id)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setDescription(`${EMOJIS.CHECK} You're already verified!`),
      ],
    });
    return;
  }

  // Assign verified role, remove unverified
  try {
    await member.roles.add(verifiedRole);
    if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
      await member.roles.remove(unverifiedRole);
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle(`${EMOJIS.CHECK} Verification Complete!`)
          .setDescription(
            `Welcome to **The Market Architects**, ${member.user}! ${EMOJIS.SPARKLE}\n\n` +
            `You now have access to all channels.\n\n` +
            `${EMOJIS.POINT_RIGHT} Head to **#pick-your-roles** to customize your experience!\n` +
            `${EMOJIS.POINT_RIGHT} Check out **#our-services** to see what we offer!`
          ),
      ],
    });

    logger.success(`Verified: ${member.user.tag}`);
  } catch (err) {
    logger.error(`Failed to verify ${member.user.tag}`, err);
    await interaction.editReply({
      content: `${EMOJIS.CROSS} Verification failed. Please contact an admin.`,
    });
  }
}

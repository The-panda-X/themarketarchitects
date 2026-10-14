import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, SERVER } from '../config';

const DIVIDER = `${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}${EMOJIS.BAR}`;

export function buildWelcomeEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.FIRE} Welcome to The Market Architects ${EMOJIS.FIRE}`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `${EMOJIS.DIAMOND} **Premium Prop Firm Services**\n` +
      `${EMOJIS.CHART} **98.4% Success Rate** | ${EMOJIS.GLOBE} New York Based\n\n` +
      `${DIVIDER}\n\n` +
      `We're the industry's leading prop firm challenge passing and account management service. ` +
      `Our expert traders handle everything — from passing your challenge to growing your funded account.\n\n` +
      `${EMOJIS.POINT_RIGHT} **Get started in 3 simple steps:**\n\n` +
      `${EMOJIS.ONE} Read the **rules** in <#RULES_CHANNEL>\n` +
      `${EMOJIS.TWO} **Verify yourself** in <#VERIFY_CHANNEL>\n` +
      `${EMOJIS.THREE} **Pick your roles** in <#ROLES_CHANNEL>\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: `${EMOJIS.TROPHY} Our Services`,
        value:
          `${EMOJIS.TARGET} **Challenge Passing** — We pass your prop firm challenge\n` +
          `${EMOJIS.CHART} **Account Management** — Hands-off funded account profits\n` +
          `${EMOJIS.ROCKET} **Account Growth** — Scale your funded account balance`,
        inline: false,
      },
      {
        name: `${EMOJIS.STAR} Why Choose TMA?`,
        value:
          `${EMOJIS.CHECK} 98.4% Pass Rate\n` +
          `${EMOJIS.CHECK} All Major Prop Firms Supported\n` +
          `${EMOJIS.CHECK} AES-256 Encrypted Credentials\n` +
          `${EMOJIS.CHECK} 24/7 Live Dashboard Tracking`,
        inline: true,
      },
      {
        name: `${EMOJIS.LINK} Quick Links`,
        value:
          `${EMOJIS.GLOBE} [Website](${SERVER.websiteUrl})\n` +
          `${EMOJIS.MONEY} [Services](${SERVER.websiteUrl}/services)\n` +
          `${EMOJIS.SPEECH} [Live Chat](${SERVER.websiteUrl})`,
        inline: true,
      }
    )
    .setImage('https://i.imgur.com/placeholder.png') // Replace with TMA banner
    .setFooter({ text: 'The Market Architects — Your Success, Our Mission' })
    .setTimestamp();
}

export function buildRulesEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.BOOK} Server Rules`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `Please read and follow these rules to maintain a professional and respectful community.\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: `${EMOJIS.ONE} Respect Everyone`,
        value: 'No harassment, hate speech, discrimination, or personal attacks. Treat all members with respect.',
        inline: false,
      },
      {
        name: `${EMOJIS.TWO} No Spam or Self-Promotion`,
        value: 'Do not spam messages, links, or promote other services/servers without permission from staff.',
        inline: false,
      },
      {
        name: `${EMOJIS.THREE} No NSFW Content`,
        value: 'Keep all content appropriate. No explicit, violent, or disturbing material.',
        inline: false,
      },
      {
        name: `${EMOJIS.FOUR} Use Channels Correctly`,
        value: 'Post content in the appropriate channels. Off-topic discussions go in #off-topic.',
        inline: false,
      },
      {
        name: `${EMOJIS.FIVE} No Scams or Phishing`,
        value: 'Do not share suspicious links, fake giveaways, or attempt to scam members. Instant ban.',
        inline: false,
      },
      {
        name: `${EMOJIS.SHIELD} Moderation`,
        value:
          `${EMOJIS.WARNING} **1st offense:** Warning\n` +
          `${EMOJIS.WARNING} **2nd offense:** Mute (1 hour)\n` +
          `${EMOJIS.WARNING} **3rd offense:** Mute (24 hours)\n` +
          `${EMOJIS.CROSS} **4th offense:** Ban\n\n` +
          `*Severe violations (scams, threats, raids) result in an immediate ban.*`,
        inline: false,
      }
    )
    .setFooter({ text: 'By participating in this server, you agree to follow these rules.' });
}

export function buildVerificationEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`${EMOJIS.SHIELD} Verification Required`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `To access the full server, you need to verify yourself.\n\n` +
      `${EMOJIS.POINT_RIGHT} **Click the button below to verify!**\n\n` +
      `${EMOJIS.PIN} **Requirements:**\n` +
      `• Your Discord account must be at least **7 days old**\n` +
      `• You must have read the **rules** above\n\n` +
      `After verification, you'll unlock all channels and features.\n\n` +
      `${DIVIDER}`
    )
    .setFooter({ text: 'Anti-bot protection — keeping our community safe' });
}

export function buildVerificationButton() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('tma_verify_button')
      .setLabel('✅ Verify Me')
      .setStyle(ButtonStyle.Success)
  );
}

export function buildRolePickerEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.STAR} Pick Your Roles`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `Customize your experience! Click the buttons below to assign yourself roles.\n\n` +
      `${DIVIDER}\n\n` +
      `**${EMOJIS.TARGET} Service Interests** — *What are you looking for?*\n\n` +
      `${EMOJIS.RED_CIRCLE} **Challenge Passing** — Pass your prop firm challenge\n` +
      `${EMOJIS.GREEN_CIRCLE} **Account Management** — Managed funded account\n` +
      `${EMOJIS.GOLD_CIRCLE} **Account Growth** — Scale your balance\n\n` +
      `${DIVIDER}\n\n` +
      `**${EMOJIS.BELL} Notification Preferences** — *What pings do you want?*\n\n` +
      `${EMOJIS.MEGAPHONE} **Announcements** — Major TMA updates\n` +
      `${EMOJIS.CHART} **Signal Alerts** — Trading signal notifications\n` +
      `${EMOJIS.SPARKLE} **Promo Alerts** — Deals and promotions\n\n` +
      `${DIVIDER}`
    )
    .setFooter({ text: 'Click a button to toggle a role on/off' });
}

export function buildRolePickerButtons() {
  const interestRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('role_challenge_passing')
      .setLabel('🎯 Challenge Passing')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('role_account_management')
      .setLabel('📈 Account Management')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('role_account_growth')
      .setLabel('🚀 Account Growth')
      .setStyle(ButtonStyle.Primary)
  );

  const notifRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('role_announcements')
      .setLabel('📢 Announcements')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('role_signal_alerts')
      .setLabel('📊 Signal Alerts')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('role_promo_alerts')
      .setLabel('🎁 Promo Alerts')
      .setStyle(ButtonStyle.Secondary)
  );

  return [interestRow, notifRow];
}

export function buildServicesEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.DIAMOND} TMA Premium Services`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `The Market Architects offers three core services to help you succeed in prop trading.\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: `${EMOJIS.TARGET} Challenge Passing`,
        value:
          `Our expert traders pass your prop firm challenge with a **98.4% success rate**.\n\n` +
          `${EMOJIS.CHECK} FTMO, FundedNext, E8, MyForexFunds & more\n` +
          `${EMOJIS.CHECK} All account sizes supported\n` +
          `${EMOJIS.CHECK} Real-time dashboard tracking\n` +
          `${EMOJIS.CHECK} AES-256 encrypted credentials\n` +
          `${EMOJIS.BOLT} Typical completion: **1-4 weeks**`,
        inline: false,
      },
      {
        name: `${EMOJIS.CHART} Account Management`,
        value:
          `Sit back and earn while our team trades your funded account.\n\n` +
          `${EMOJIS.CHECK} Professional risk management\n` +
          `${EMOJIS.CHECK} Consistent profit targets\n` +
          `${EMOJIS.CHECK} Performance-based profit splits\n` +
          `${EMOJIS.MONEY} **Hands-off passive income**`,
        inline: false,
      },
      {
        name: `${EMOJIS.ROCKET} Account Growth`,
        value:
          `Scale your funded account to maximize your earning potential.\n\n` +
          `${EMOJIS.CHECK} Strategic balance building\n` +
          `${EMOJIS.CHECK} Scaling plan optimization\n` +
          `${EMOJIS.CHECK} Long-term growth strategy\n` +
          `${EMOJIS.CROWN} **Turn $10K into $200K+**`,
        inline: false,
      }
    )
    .addFields({
      name: `${EMOJIS.LINK} Ready to Start?`,
      value: `${EMOJIS.POINT_RIGHT} [View Pricing & Order](${SERVER.websiteUrl}/services)\n${EMOJIS.POINT_RIGHT} [Create a Support Ticket](#create-ticket)`,
      inline: false,
    })
    .setFooter({ text: 'The Market Architects — 98.4% Success Rate' });
}

export function buildHowToOrderEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`${EMOJIS.BOOK} How to Place an Order`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `Follow these simple steps to get started with TMA!\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: `${EMOJIS.ONE} Create an Account`,
        value: `Visit [themarketarchitects.com](${SERVER.websiteUrl}) and sign up with your email or Google account.`,
        inline: false,
      },
      {
        name: `${EMOJIS.TWO} Choose Your Service`,
        value: `Browse our services — Challenge Passing, Account Management, or Account Growth — and select your prop firm and account size.`,
        inline: false,
      },
      {
        name: `${EMOJIS.THREE} Complete Payment`,
        value: `Pay securely via **Stripe** (card) or **Crypto** (USDT). We accept all major payment methods.`,
        inline: false,
      },
      {
        name: `${EMOJIS.FOUR} Submit Your Credentials`,
        value: `After payment, submit your trading platform credentials through our **AES-256 encrypted** secure portal.`,
        inline: false,
      },
      {
        name: `${EMOJIS.FIVE} Track Progress`,
        value: `Monitor your challenge progress in real-time through your personal **dashboard** — balance, equity, trades, and more.`,
        inline: false,
      }
    )
    .addFields({
      name: `${EMOJIS.SPEECH} Need Help?`,
      value: `Open a ticket in <#CREATE_TICKET_CHANNEL> or chat with us on our [website](${SERVER.websiteUrl}).`,
      inline: false,
    })
    .setFooter({ text: 'Questions? Our support team is here 24/7' });
}

export function buildFAQEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(`${EMOJIS.SPEECH} Frequently Asked Questions`)
    .setDescription(`${DIVIDER}\n\n${DIVIDER}`)
    .addFields(
      {
        name: `${EMOJIS.POINT_RIGHT} Which prop firms do you support?`,
        value: 'We support all major prop firms — FTMO, FundedNext, E8, The5%ers, MyFundedFX, and more. If your firm isn\'t listed, ask us!',
        inline: false,
      },
      {
        name: `${EMOJIS.POINT_RIGHT} How long does it take to pass a challenge?`,
        value: 'Typically **1-4 weeks** depending on the challenge rules, account size, and market conditions. Our strategic approach prioritizes quality over speed.',
        inline: false,
      },
      {
        name: `${EMOJIS.POINT_RIGHT} Is my account secure?`,
        value: 'Absolutely. We use **AES-256 encryption** (the same standard used by banks) to protect your credentials. Your data is never stored in plain text.',
        inline: false,
      },
      {
        name: `${EMOJIS.POINT_RIGHT} What if you fail my challenge?`,
        value: 'With a **98.4% success rate**, failure is extremely rare. However, depending on your plan, we offer free retries or partial refunds. Check your service plan for details.',
        inline: false,
      },
      {
        name: `${EMOJIS.POINT_RIGHT} Can you manage my account after passing?`,
        value: 'Yes! Our **Account Management** service lets you earn hands-off income from your funded account. Our traders handle everything while you track profits on your dashboard.',
        inline: false,
      },
      {
        name: `${EMOJIS.POINT_RIGHT} How do referrals work?`,
        value: 'Share your unique referral link and earn commissions on every signup. Track your earnings in your dashboard. The referral program is being expanded — stay tuned!',
        inline: false,
      }
    )
    .setFooter({ text: 'More questions? Open a support ticket!' });
}

export function buildMemberJoinDM(memberName: string) {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.WAVE} Welcome to The Market Architects, ${memberName}!`)
    .setDescription(
      `We're excited to have you! Here's a quick rundown:\n\n` +
      `${EMOJIS.ONE} **Verify yourself** in the server to unlock all channels\n` +
      `${EMOJIS.TWO} **Pick your roles** to customize your experience\n` +
      `${EMOJIS.THREE} **Explore our services** — we have a 98.4% success rate!\n\n` +
      `${EMOJIS.POINT_RIGHT} **Website:** [themarketarchitects.com](${SERVER.websiteUrl})\n\n` +
      `If you have any questions, our team is here to help. ${EMOJIS.SPARKLE}`
    )
    .setFooter({ text: 'The Market Architects — Your Success, Our Mission' });
}

export function buildTicketEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`${EMOJIS.SPEECH} Support Tickets`)
    .setDescription(
      `${DIVIDER}\n\n` +
      `Need help? Click the button below to create a **private support ticket**.\n\n` +
      `A staff member will respond as soon as possible.\n\n` +
      `${EMOJIS.PIN} **Before creating a ticket:**\n` +
      `• Check <#FAQ_CHANNEL> for common questions\n` +
      `• Check <#COMMON_ISSUES_CHANNEL> for known solutions\n` +
      `• Be as detailed as possible in your ticket\n\n` +
      `${DIVIDER}`
    )
    .setFooter({ text: 'Average response time: under 2 hours' });
}

export function buildTicketButton() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('tma_create_ticket')
      .setLabel('🎫 Create Ticket')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel('💬 Website Chat')
      .setStyle(ButtonStyle.Link)
      .setURL(SERVER.websiteUrl)
  );
}

export function buildModLogEmbed(action: string, moderator: string, target: string, reason: string) {
  return new EmbedBuilder()
    .setColor(action === 'BAN' ? COLORS.DANGER : action === 'WARN' ? COLORS.WARNING : COLORS.INFO)
    .setTitle(`${EMOJIS.SHIELD} Moderation Action`)
    .addFields(
      { name: 'Action', value: action, inline: true },
      { name: 'Moderator', value: moderator, inline: true },
      { name: 'Target', value: target, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();
}

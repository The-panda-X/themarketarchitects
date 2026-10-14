import { PermissionFlagsBits, ChannelType } from 'discord.js';

// ═══════════════════════════════════════════════════════════════
//  TMA BRAND COLORS
// ═══════════════════════════════════════════════════════════════
export const COLORS = {
  PRIMARY: 0xe63946,      // TMA Red
  GOLD: 0xd4af37,         // Accent Gold
  SUCCESS: 0x2ecc71,      // Green
  WARNING: 0xf39c12,      // Orange/Yellow
  DANGER: 0xe74c3c,       // Danger Red
  INFO: 0x3498db,         // Blue
  DARK: 0x090707,         // Dark background
  MUTED: 0x8b0000,        // Muted red
  WHITE: 0xffffff,
} as const;

// ═══════════════════════════════════════════════════════════════
//  EMOJIS
// ═══════════════════════════════════════════════════════════════
export const EMOJIS = {
  // Status
  CHECK: '✅',
  CROSS: '❌',
  WARNING: '⚠️',
  LOADING: '⏳',
  LOCK: '🔒',
  UNLOCK: '🔓',
  SHIELD: '🛡️',
  STAR: '⭐',

  // TMA Branded
  FIRE: '🔥',
  CHART: '📈',
  TROPHY: '🏆',
  CROWN: '👑',
  DIAMOND: '💎',
  ROCKET: '🚀',
  MONEY: '💰',
  TARGET: '🎯',
  BOLT: '⚡',
  GLOBE: '🌍',

  // Navigation
  ARROW_RIGHT: '➡️',
  ARROW_DOWN: '⬇️',
  POINT_RIGHT: '👉',
  LINK: '🔗',
  BOOK: '📖',
  PIN: '📌',

  // Communication
  BELL: '🔔',
  SPEECH: '💬',
  MEGAPHONE: '📣',
  HANDSHAKE: '🤝',
  WAVE: '👋',
  EYES: '👀',

  // Numbers (for steps)
  ONE: '1️⃣',
  TWO: '2️⃣',
  THREE: '3️⃣',
  FOUR: '4️⃣',
  FIVE: '5️⃣',

  // Decorative
  RED_CIRCLE: '🔴',
  GOLD_CIRCLE: '🟡',
  GREEN_CIRCLE: '🟢',
  SPARKLE: '✨',
  GEM: '💎',
  BAR: '▬',
} as const;

// ═══════════════════════════════════════════════════════════════
//  ROLE CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const ROLES = [
  // ── Staff Roles ──
  {
    name: '👑 Owner',
    color: 0xd4af37,
    hoist: true,
    position: 100,
    permissions: [PermissionFlagsBits.Administrator],
  },
  {
    name: '🛡️ Admin',
    color: 0xe63946,
    hoist: true,
    position: 90,
    permissions: [
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.MentionEveryone,
    ],
  },
  {
    name: '⚔️ Moderator',
    color: 0x3498db,
    hoist: true,
    position: 80,
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.ManageNicknames,
    ],
  },
  {
    name: '📣 Marketer',
    color: 0x9b59b6,
    hoist: true,
    position: 70,
    permissions: [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.MentionEveryone,
    ],
  },
  {
    name: '📊 Trader',
    color: 0x2ecc71,
    hoist: true,
    position: 60,
    permissions: [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
    ],
  },

  // ── Special Roles ──
  {
    name: '💎 VIP Client',
    color: 0xd4af37,
    hoist: true,
    position: 50,
    permissions: [],
  },
  {
    name: '🤝 Partner',
    color: 0xf39c12,
    hoist: true,
    position: 45,
    permissions: [],
  },

  // ── Interest Roles (self-assignable) ──
  {
    name: '🎯 Challenge Passing',
    color: 0xe63946,
    hoist: false,
    position: 30,
    permissions: [],
  },
  {
    name: '📈 Account Management',
    color: 0x2ecc71,
    hoist: false,
    position: 29,
    permissions: [],
  },
  {
    name: '🚀 Account Growth',
    color: 0x3498db,
    hoist: false,
    position: 28,
    permissions: [],
  },

  // ── Notification Roles ──
  {
    name: '🔔 Announcements',
    color: 0x95a5a6,
    hoist: false,
    position: 20,
    permissions: [],
  },
  {
    name: '📊 Signal Alerts',
    color: 0x95a5a6,
    hoist: false,
    position: 19,
    permissions: [],
  },
  {
    name: '🎁 Promo Alerts',
    color: 0x95a5a6,
    hoist: false,
    position: 18,
    permissions: [],
  },

  // ── Base Roles ──
  {
    name: '✅ Verified',
    color: 0x2ecc71,
    hoist: false,
    position: 10,
    permissions: [],
  },
  {
    name: '⏳ Unverified',
    color: 0x95a5a6,
    hoist: false,
    position: 5,
    permissions: [],
  },
] as const;

// ═══════════════════════════════════════════════════════════════
//  CHANNEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export interface ChannelConfig {
  name: string;
  type: ChannelType;
  topic?: string;
  readonly?: boolean;
  verifiedOnly?: boolean;
  staffOnly?: boolean;
  slowMode?: number;
  nsfw?: boolean;
}

export interface CategoryConfig {
  name: string;
  channels: ChannelConfig[];
}

export const CATEGORIES: CategoryConfig[] = [
  // ═══════════════════════════════════════════════════════════
  //  📋 WELCOME & VERIFICATION
  // ═══════════════════════════════════════════════════════════
  {
    name: '📋 WELCOME & VERIFICATION',
    channels: [
      {
        name: '👋・welcome',
        type: ChannelType.GuildText,
        topic: 'Welcome to The Market Architects! Read below to get started.',
        readonly: true,
      },
      {
        name: '📜・rules',
        type: ChannelType.GuildText,
        topic: 'Server rules — read carefully before proceeding.',
        readonly: true,
      },
      {
        name: '✅・verify-here',
        type: ChannelType.GuildText,
        topic: 'Click the button below to verify and unlock the server.',
      },
      {
        name: '🎭・pick-your-roles',
        type: ChannelType.GuildText,
        topic: 'Select your interests and notification preferences.',
        readonly: true,
      },
      {
        name: '📢・announcements',
        type: ChannelType.GuildText,
        topic: 'Official TMA announcements and updates.',
        readonly: true,
        verifiedOnly: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  🔥 TMA SERVICES
  // ═══════════════════════════════════════════════════════════
  {
    name: '🔥 TMA SERVICES',
    channels: [
      {
        name: '💎・our-services',
        type: ChannelType.GuildText,
        topic: 'Explore TMA\'s premium services — Challenge Passing, Account Management, Account Growth.',
        readonly: true,
        verifiedOnly: true,
      },
      {
        name: '💰・pricing',
        type: ChannelType.GuildText,
        topic: 'Transparent pricing for all TMA services.',
        readonly: true,
        verifiedOnly: true,
      },
      {
        name: '🏆・success-stories',
        type: ChannelType.GuildText,
        topic: '98.4% success rate — see real results from our clients.',
        readonly: true,
        verifiedOnly: true,
      },
      {
        name: '❓・faq',
        type: ChannelType.GuildText,
        topic: 'Frequently asked questions about our services.',
        readonly: true,
        verifiedOnly: true,
      },
      {
        name: '🎁・promotions',
        type: ChannelType.GuildText,
        topic: 'Exclusive deals, discount codes, and limited-time offers.',
        readonly: true,
        verifiedOnly: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  📊 TRADING ZONE
  // ═══════════════════════════════════════════════════════════
  {
    name: '📊 TRADING ZONE',
    channels: [
      {
        name: '📈・market-analysis',
        type: ChannelType.GuildText,
        topic: 'Daily market analysis and insights from TMA traders.',
        verifiedOnly: true,
        slowMode: 30,
      },
      {
        name: '⚡・signal-alerts',
        type: ChannelType.GuildText,
        topic: 'Live trading signals from our expert team.',
        readonly: true,
        verifiedOnly: true,
      },
      {
        name: '📉・trading-ideas',
        type: ChannelType.GuildText,
        topic: 'Share and discuss trading setups and ideas.',
        verifiedOnly: true,
        slowMode: 15,
      },
      {
        name: '📚・education',
        type: ChannelType.GuildText,
        topic: 'Trading education, tips, and resources.',
        verifiedOnly: true,
      },
      {
        name: '🗞️・market-news',
        type: ChannelType.GuildText,
        topic: 'Breaking financial news and economic events.',
        verifiedOnly: true,
        slowMode: 60,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  💬 COMMUNITY
  // ═══════════════════════════════════════════════════════════
  {
    name: '💬 COMMUNITY',
    channels: [
      {
        name: '💬・general-chat',
        type: ChannelType.GuildText,
        topic: 'Hang out and chat with fellow traders!',
        verifiedOnly: true,
        slowMode: 5,
      },
      {
        name: '🎉・introductions',
        type: ChannelType.GuildText,
        topic: 'New here? Introduce yourself to the community!',
        verifiedOnly: true,
        slowMode: 60,
      },
      {
        name: '🖼️・trading-results',
        type: ChannelType.GuildText,
        topic: 'Share your trading wins, funded account screenshots, and progress!',
        verifiedOnly: true,
        slowMode: 30,
      },
      {
        name: '🤝・referral-hub',
        type: ChannelType.GuildText,
        topic: 'Share your referral link and earn commissions on every signup.',
        verifiedOnly: true,
        slowMode: 120,
      },
      {
        name: '💡・suggestions',
        type: ChannelType.GuildText,
        topic: 'Have ideas to improve TMA? Drop them here!',
        verifiedOnly: true,
        slowMode: 60,
      },
      {
        name: '🎮・off-topic',
        type: ChannelType.GuildText,
        topic: 'Memes, games, and everything non-trading.',
        verifiedOnly: true,
        slowMode: 10,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  🎧 SUPPORT
  // ═══════════════════════════════════════════════════════════
  {
    name: '🎧 SUPPORT',
    channels: [
      {
        name: '🎫・create-ticket',
        type: ChannelType.GuildText,
        topic: 'Click the button to create a private support ticket.',
        verifiedOnly: true,
      },
      {
        name: '📋・how-to-order',
        type: ChannelType.GuildText,
        topic: 'Step-by-step guide to placing your first order with TMA.',
        readonly: true,
        verifiedOnly: true,
      },
      {
        name: '🔧・common-issues',
        type: ChannelType.GuildText,
        topic: 'Solutions to the most common questions and issues.',
        readonly: true,
        verifiedOnly: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  🎤 VOICE CHANNELS
  // ═══════════════════════════════════════════════════════════
  {
    name: '🎤 VOICE LOUNGE',
    channels: [
      {
        name: '🔊・Trading Talk',
        type: ChannelType.GuildVoice,
        verifiedOnly: true,
      },
      {
        name: '📞・Support Call',
        type: ChannelType.GuildVoice,
        verifiedOnly: true,
      },
      {
        name: '🎵・Chill Zone',
        type: ChannelType.GuildVoice,
        verifiedOnly: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  🔒 STAFF ZONE (Hidden from members)
  // ═══════════════════════════════════════════════════════════
  {
    name: '🔒 STAFF ZONE',
    channels: [
      {
        name: '📋・staff-chat',
        type: ChannelType.GuildText,
        topic: 'Internal staff communication.',
        staffOnly: true,
      },
      {
        name: '📊・lead-tracking',
        type: ChannelType.GuildText,
        topic: 'Track and manage community leads.',
        staffOnly: true,
      },
      {
        name: '📝・mod-logs',
        type: ChannelType.GuildText,
        topic: 'Moderation action logs.',
        staffOnly: true,
      },
      {
        name: '🤖・bot-commands',
        type: ChannelType.GuildText,
        topic: 'Bot administration and commands.',
        staffOnly: true,
      },
      {
        name: '📣・marketing-plans',
        type: ChannelType.GuildText,
        topic: 'Marketing strategies and campaign tracking.',
        staffOnly: true,
      },
      {
        name: '📈・analytics',
        type: ChannelType.GuildText,
        topic: 'Server growth analytics and reports.',
        staffOnly: true,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
//  AUTO-MOD CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const AUTOMOD = {
  maxMentions: 5,
  maxEmojis: 10,
  maxNewlines: 15,
  maxDuplicateMessages: 3,
  duplicateTimeWindow: 10_000,
  spamTimeWindow: 5_000,
  spamMessageCount: 5,
  inviteLinkWhitelist: [] as string[],
  blockedWords: [
    'free nitro', 'free discord', 'steam gift', 'claim your',
    'discord.gift', 'discordgift', 'nitro free',
    '@everyone check', '@here free',
  ],
  blockedPatterns: [
    /discord\.gg\/[a-zA-Z0-9]+/i,
    /discord\.com\/invite\/[a-zA-Z0-9]+/i,
    /bit\.ly\//i,
    /tinyurl\.com\//i,
  ],
};

// ═══════════════════════════════════════════════════════════════
//  VERIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════
export const VERIFICATION = {
  minAccountAgeDays: 7,
  buttonLabel: 'Verify Me',
  buttonEmoji: '✅',
  customId: 'tma_verify_button',
};

// ═══════════════════════════════════════════════════════════════
//  SERVER SETTINGS
// ═══════════════════════════════════════════════════════════════
export const SERVER = {
  name: 'The Market Architects',
  description: '🔥 Premium Prop Firm Challenge Passing & Account Management | 98.4% Success Rate | New York Based',
  websiteUrl: process.env.TMA_WEBSITE_URL || 'https://themarketarchitects.com',
};

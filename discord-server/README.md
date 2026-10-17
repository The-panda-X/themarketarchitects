# TMA Discord Server Bot

Advanced Discord community server for The Market Architects with automated setup, verification, anti-spam, ticketing, and role management.

## Features

- **Auto Server Setup** — One command creates all roles, channels, categories, and embeds
- **Verification System** — Button-based verification with account age check (7+ days)
- **Anti-Spam** — Blocks spam, mass mentions, duplicate messages, invite links, and scam phrases
- **Anti-Raid** — Detects mass joins and auto-kicks new accounts during raids
- **Ticket System** — Private support tickets with transcript logging
- **Role Picker** — Self-assignable interest and notification roles via buttons
- **Moderation** — `/warn`, `/mute`, `/kick`, `/ban`, `/purge` with mod-log audit trail
- **TMA Branded** — Red/gold color theme, custom embeds, rotating bot status

## Server Structure

```
📋 WELCOME & VERIFICATION
  👋・welcome          (read-only, welcome embed)
  📜・rules            (read-only, rules embed)
  ✅・verify-here      (verification button)
  🎭・pick-your-roles  (self-assign roles)
  📢・announcements    (read-only, verified)

🔥 TMA SERVICES
  💎・our-services     (read-only, services embed)
  💰・pricing          (read-only)
  🏆・success-stories  (read-only)
  ❓・faq              (read-only, FAQ embed)
  🎁・promotions       (read-only)

📊 TRADING ZONE
  📈・market-analysis  (verified, 30s slowmode)
  ⚡・signal-alerts    (read-only, verified)
  📉・trading-ideas    (verified, 15s slowmode)
  📚・education        (verified)
  🗞️・market-news      (verified, 60s slowmode)

💬 COMMUNITY
  💬・general-chat     (verified, 5s slowmode)
  🎉・introductions    (verified, 60s slowmode)
  🖼️・trading-results  (verified, 30s slowmode)
  🤝・referral-hub     (verified, 2min slowmode)
  💡・suggestions      (verified, 60s slowmode)
  🎮・off-topic        (verified, 10s slowmode)

🎧 SUPPORT
  🎫・create-ticket    (ticket button)
  📋・how-to-order     (read-only, guide embed)
  🔧・common-issues    (read-only)

🎤 VOICE LOUNGE
  🔊・Trading Talk     (verified)
  📞・Support Call     (verified)
  🎵・Chill Zone       (verified)

🔒 STAFF ZONE (hidden)
  📋・staff-chat
  📊・lead-tracking
  📝・mod-logs
  🤖・bot-commands
  📣・marketing-plans
  📈・analytics
```

## Roles

| Role | Color | Purpose |
|------|-------|---------|
| 👑 Owner | Gold | Server owner |
| 🛡️ Admin | Red | Full admin access |
| ⚔️ Moderator | Blue | Moderation tools |
| 📣 Marketer | Purple | Marketing access |
| 📊 Trader | Green | Signal/trading access |
| 💎 VIP Client | Gold | Premium clients |
| 🤝 Partner | Orange | Business partners |
| 🎯 Challenge Passing | Red | Interest role |
| 📈 Account Management | Green | Interest role |
| 🚀 Account Growth | Blue | Interest role |
| 🔔 Announcements | Gray | Notification role |
| 📊 Signal Alerts | Gray | Notification role |
| 🎁 Promo Alerts | Gray | Notification role |
| ✅ Verified | Green | Verified member |
| ⏳ Unverified | Gray | Pending verification |

## Setup

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it "TMA Bot"
3. Go to **Bot** tab → click **Add Bot**
4. Enable these **Privileged Gateway Intents**:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
5. Copy the **Bot Token**

### 2. Invite Bot to Server

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Permissions: `Administrator`
- Copy the generated URL and open it in your browser to invite the bot

### 3. Configure Environment

```bash
cd discord-server
cp .env.example .env
```

Edit `.env` with your values:
- `DISCORD_TOKEN` — Bot token from step 1
- `CLIENT_ID` — Application ID from Developer Portal
- `GUILD_ID` — Right-click your server name → Copy Server ID (enable Developer Mode in Discord settings first)

### 4. Install & Run

```bash
npm install
npm run register-commands   # Register slash commands
npm run setup               # Auto-create all roles, channels, embeds
npm run dev                 # Start bot (development)
```

For production:
```bash
npm run build
npm start
```

## Slash Commands

| Command | Permission | Description |
|---------|-----------|-------------|
| `/warn @user reason` | Manage Messages | Warn a member |
| `/mute @user duration reason` | Manage Messages | Timeout a member |
| `/kick @user reason` | Kick Members | Kick a member |
| `/ban @user reason` | Ban Members | Ban a member |
| `/purge count [user]` | Manage Messages | Bulk delete messages |
| `/serverinfo` | Everyone | Server statistics |
| `/userinfo [user]` | Everyone | User profile info |

## Hosting

Deploy on any Node.js host:
- **Railway** — `railway up`
- **Render** — Connect repo, set env vars
- **VPS** — Use PM2: `pm2 start dist/index.js --name tma-bot`
- **Docker** — Build and run (Dockerfile not included, add if needed)

# TMA Discord Server Bot

Advanced Discord community server for The Market Architects with automated setup, verification, anti-spam, ticketing, moderation, analytics, engagement tools, and security features.

## Features

### Core Systems
- **Auto Server Setup** — One command creates all roles, channels, categories, and embeds
- **Verification System** — Button-based verification with account age check (7+ days)
- **Anti-Spam** — Blocks spam, mass mentions, duplicate messages, invite links, scam phrases, CAPS LOCK, and image-only channel enforcement
- **Anti-Raid** — Detects mass joins and auto-kicks new accounts during raids
- **Ticket System** — Private support tickets with categories, priority levels, auto-close, and rating system
- **Role Picker** — Self-assignable interest and notification roles via buttons
- **Moderation** — `/warn`, `/mute`, `/kick`, `/ban`, `/purge` with mod-log audit trail
- **TMA Branded** — Red/gold color theme, custom embeds, rotating bot status

### Engagement Features
- **Announcements** — `/announce` sends formatted embeds to #announcements with optional role pings
- **Giveaways** — `/giveaway` creates timed reaction-based giveaways with auto-drawn winners
- **Custom Embeds** — `/embed` lets staff create custom embeds in any channel
- **Suggestions** — Auto-formatted suggestion embeds with vote reactions and staff approve/deny
- **AFK System** — `/afk` sets AFK status, auto-responds when pinged
- **Member Milestones** — Automatic celebration announcement every 50 members
- **Welcome Member Count** — "You are member #XXX!" in welcome messages and DMs

### Analytics & Tracking
- **Server Stats** — `/stats` shows total members, joins today/week/month, verification rate, ticket count
- **Leaderboard** — `/leaderboard` shows most active members by weekly message count
- **Activity Tracking** — Tracks joins, leaves, messages, tickets, and verifications per day
- **Daily Trading Tips** — Auto-posts rotating trading tips in #education at 9:00 AM UTC

### Security
- **Alt Account Detection** — Flags accounts younger than 30 days in mod-logs on join
- **Quarantine System** — `/quarantine` restricts suspicious users to only #rules and #verify-here
- **Server Lockdown** — `/lockdown` instantly prevents all non-staff from sending messages
- **Scam Detection** — Catches crypto scams, fake giveaways, wallet address spam

### Content Scheduling
- **Message Scheduling** — `/schedule` posts a message in any channel at a set time
- **Scheduled List** — `/scheduled` views pending scheduled messages

### Enhanced Ticket System
- **Category Selection** — General, Order Issue, Refund, Technical, Partnership
- **Priority Levels** — Low, Medium, High, Urgent (with color-coded embeds)
- **Auto-Close** — Warning at 24 hours, auto-close at 48 hours of inactivity
- **Rating System** — 1-5 star rating when tickets are closed

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
  📚・education        (verified, daily tips)
  🗞️・market-news      (verified, 60s slowmode)

💬 COMMUNITY
  💬・general-chat     (verified, 5s slowmode)
  🎉・introductions    (verified, 60s slowmode)
  🖼️・trading-results  (verified, image-only, 30s slowmode)
  🤝・referral-hub     (verified, 2min slowmode)
  💡・suggestions      (verified, auto-formatted, 60s slowmode)
  🎮・off-topic        (verified, 10s slowmode)

🎧 SUPPORT
  🎫・create-ticket    (ticket button with category/priority)
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
| 🎯 Challenge Passing | Red | Interest role (self-assign) |
| 📈 Account Management | Green | Interest role (self-assign) |
| 🚀 Account Growth | Blue | Interest role (self-assign) |
| 🔔 Announcements | Gray | Notification role (self-assign) |
| 📊 Signal Alerts | Gray | Notification role (self-assign) |
| 🎁 Promo Alerts | Gray | Notification role (self-assign) |
| ✅ Verified | Green | Verified member |
| ⏳ Unverified | Gray | Pending verification |
| 🔒 Quarantined | Dark | Suspicious/quarantined users |

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

### Moderation
| Command | Permission | Description |
|---------|-----------|-------------|
| `/warn @user reason` | Manage Messages | Warn a member |
| `/mute @user duration reason` | Manage Messages | Timeout a member |
| `/kick @user reason` | Kick Members | Kick a member |
| `/ban @user reason` | Ban Members | Ban a member |
| `/purge count [user]` | Manage Messages | Bulk delete messages |
| `/serverinfo` | Everyone | Server statistics |
| `/userinfo [user]` | Everyone | User profile info |

### Engagement
| Command | Permission | Description |
|---------|-----------|-------------|
| `/announce title message [ping] [color]` | Manage Messages | Post a formatted announcement |
| `/giveaway prize duration [winners]` | Manage Messages | Start a reaction giveaway |
| `/embed channel title description [color] [footer] [image]` | Manage Messages | Create a custom embed |
| `/afk [reason]` | Everyone | Set AFK status |

### Analytics
| Command | Permission | Description |
|---------|-----------|-------------|
| `/stats` | Manage Messages | View server statistics dashboard |
| `/leaderboard [count]` | Everyone | View weekly most active members |

### Security
| Command | Permission | Description |
|---------|-----------|-------------|
| `/lockdown` | Administrator | Toggle server lockdown |
| `/quarantine @user [reason]` | Manage Roles | Quarantine a suspicious user |

### Utility
| Command | Permission | Description |
|---------|-----------|-------------|
| `/schedule channel message minutes [embed_title] [embed_description]` | Manage Messages | Schedule a message |
| `/scheduled` | Manage Messages | View pending scheduled messages |
| `/suggestion approve/deny message_id [response]` | Manage Messages | Approve or deny a suggestion |

## Hosting

Deploy on any Node.js host:
- **Railway** — `railway up`
- **Render** — Connect repo, set env vars
- **VPS** — Use PM2: `pm2 start dist/index.js --name tma-bot`
- **Docker** — Build and run (Dockerfile not included, add if needed)

# The Market Architects — Project Instructions

Next.js 14 SaaS platform for prop firm challenge passing, funded account management, and account growth services.

## Critical Rules

### Database
- **ALWAYS use `prisma db push`** — never `prisma migrate dev`. No Prisma migrations.
- **Stop the dev server before `npx prisma generate`** — it locks `query_engine-windows.dll.node` on Windows.
- Prisma config lives in `prisma.config.ts` (project root).

### Role System (5 tiers)
```
USER → TRADER → MODERATOR → ADMIN → HEAD_ADMIN
```
- Middleware allows TRADER+ to access `/admin/*`, but TRADER is restricted to `/admin/signals` only.
- `requireTrader()` = TRADER, MODERATOR, ADMIN, HEAD_ADMIN (signal sending).
- `requireModerator()` = MODERATOR, ADMIN, HEAD_ADMIN (admin panel access).
- `requireAdmin()` = ADMIN, HEAD_ADMIN (sensitive data: credentials, payments).
- `requireHeadAdmin()` = HEAD_ADMIN only (destructive: deletes, message edits).
- Role helpers and constants are in `src/lib/api-helpers.ts`.
- **TRADER role specifics:**
  - Can only access Signal Hub (`/admin/signals`).
  - `User.canOverrideRisk` (Boolean, default false) controls whether a trader can override the risk % when sending signals. Admins toggle this per-trader in the user detail page.
  - Middleware redirects TRADERs away from all other `/admin/*` pages.
- **Privilege mapping for admin API routes:**
  - Signal sending → `requireTrader()` minimum
  - READ (list/get data) → `requireModerator()` minimum
  - WRITE (create/update) → `requireAdmin()` for sensitive, `requireModerator()` for basic ops (chat, tickets)
  - DELETE (any record) → `requireHeadAdmin()` always
  - Credentials/payments → `requireAdmin()`
  - Message edits → `requireHeadAdmin()`

### API Pattern
- All routes use helpers from `src/lib/api-helpers.ts`: `successResponse()`, `errorResponse()`, `requireAuth()`, `requireModerator()`, `requireAdmin()`, `requireHeadAdmin()`, `handleApiError()`, `parsePagination()`.
- Response shape: `{ data?: T, error?: string, code?: string }` — there is NO `success` boolean field.
- Admin routes use `/api/admin/*`. Dashboard routes use `/api/dashboard/*`. Public routes use `/api/public/*`.

### Component Props (exact — do not guess)
- `<Modal>` uses `isOpen` (NOT `open`)
- `<Badge>` variants: `'default' | 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'gold' | 'outline'` — NO `'orange'`
- `<GlassCard>` variants: `'default' | 'strong' | 'subtle'`, padding: `'none' | 'sm' | 'md' | 'lg'`, glow: `'red' | 'gold' | 'none'`
- `<Button>` variants: `'primary' | 'secondary' | 'ghost' | 'danger'`

### Data Architecture
- **ServicePlan, PropFirm, FAQItem, TrustStat, HomeService** are DB-managed via admin panel — NOT hardcoded.
- `ServicePlan.serviceType` is a flexible `String`. `Order.serviceType` uses the Prisma `ServiceType` enum.
- Homepage fetches data server-side via Prisma in `page.tsx`, passes serialized props to client components.
- `src/lib/constants.ts` only contains: `SITE_CONFIG`, `CRYPTO_WALLETS`, `NAV_LINKS`, `TRADING_PLATFORMS`, `LIVE_NOTIFICATIONS`, `TICKET_PRIORITIES`.

### Auth
- NextAuth **v4** with JWT strategy (8-hour sessions).
- Providers: Google OAuth + Credentials (email/password with bcrypt).
- Google OAuth uses `allowDangerousEmailAccountLinking: true` so existing email/password users can sign in with Google without duplicate account errors.
- 2FA: email-based OTP with brute-force protection (5 attempts, 30-min lockout).
- Session includes `user.id`, `user.role`, `user.twoFactorEnabled`, `user.emailVerified`.
- Config in `src/lib/auth.ts` (single file — there is no separate `auth-options.ts`).

### File Uploads
- Proof images → **Supabase Storage** (bucket: `proof-images`), NOT local filesystem.
- Upload logic in `src/lib/storage.ts`. Requires `SUPABASE_SERVICE_ROLE_KEY`.

### Signal System
- Admin sends signals from Signal Hub → stored as `Signal` records → VPS polls `/api/ea/pending-signals`.
- Discord bridge receives signals via `/api/webhook/signal` → creates `SignalLog` + `SignalDelivery` per challenge.
- Signals also post to Discord via webhook (`src/lib/discord.ts` → `postSignalToDiscord()`).
- Each challenge has its own `eaToken` for MT5 EA authentication.
- EA reports to `/api/ea/report` with token-based auth, updating challenge metrics.

### AI Chatbot
- Rule-based AI assistant that auto-responds to user messages in live chat.
- Core engine in `src/lib/ai-chat.ts` with ~30 intent detectors (greetings, pricing, services, prop firms, refund policy, referrals, etc.).
- Loads knowledge base from DB (FAQs, plans, firms) for accurate responses.
- Staff takeover: AI backs off when a staff member replies within 30 minutes.
- AI messages display with `Sparkles` icon and "AI Assistant" label in the chat UI.
- `ChatMessage.senderRole` includes `ASSISTANT` value for AI-generated messages.

### Referral System
- Users get a referral code at signup + optional custom vanity slug (`/r/your-slug`).
- `User.referralSlug` (unique, optional) resolves via `/r/[slug]` route → redirects to `/register?ref=<referralCode>`.
- Slug validation: 3-30 chars, alphanumeric + hyphens, reserved words blocked (admin, api, dashboard, etc.).
- Slug management: `PUT /api/dashboard/referrals/slug`.
- Commission: 20% flat rate on paid referred orders (`src/lib/referral.ts`).
- **Excluded service types**: `ACCOUNT_MANAGEMENT` and `ACCOUNT_GROWTH` do NOT earn commission (refundable security deposits). Only `CHALLENGE_PASSING` qualifies.
- Commission credited idempotently from Stripe webhook and admin order status change.
- Referral dashboard at `/dashboard/referrals` with stats, slug editor, referral list, and payout requests (USDT TRC20/BEP20, $50 minimum).

### Crypto Payment Verification
- After checkout, customers see wallet addresses (USDT on BEP-20, TRC-20, ERC-20) from `CRYPTO_WALLETS` constant.
- Customers submit: proof screenshot (Supabase Storage) + optional TxID (transaction hash) + payment network.
- Proof upload API: `POST /api/dashboard/payment-proof` (stores `proofImage`, `paymentNetwork`, `cryptoTxId` on Order).
- Admin verification panel at `/admin/crypto-payments` (ADMIN+ role):
  - Filter tabs: Pending / Approved / Rejected / All.
  - Search by email, plan name, or TxID.
  - Proof image modal with order details.
  - TxID auto-links to blockchain explorer (BSCScan for BEP-20, TronScan for TRC-20, Etherscan for ERC-20).
  - One-click Approve → status PAID + confirmation email + referral commission + user notification.
  - One-click Reject → status CANCELLED + user notification.
- API: `GET /api/admin/crypto-payments` (list), `PATCH /api/admin/crypto-payments/[id]` (approve/reject).

### Chat & Unread Badge System
- Live chat between users and staff via `Conversation` + `ChatMessage` models.
- Separate unread counters: `Conversation.userUnread` and `Conversation.staffUnread`.
- Counters increment on message send, reset when the other side opens the conversation.
- `useChatUnread` hook polls `/api/dashboard/chat/unread` every 15 seconds (user side).
- Admin sidebar polls `/api/admin/chat/unread` inline.
- Badge displays in both sidebar and mobile topbar with "9+" cap.

### Discord Server Bot
- Standalone Discord.js bot in `discord-server/` directory (separate from main Next.js app).
- Features: member verification, role assignment (interest + notification roles), ticket system, welcome messages, anti-spam, anti-raid, moderation slash commands.
- Config in `discord-server/src/config.ts` with TMA brand colors, emojis, role structure, channel categories.
- Excluded from Next.js TypeScript compilation (`tsconfig.json` excludes `discord-server/`).

## Tech Stack

- **Framework**: Next.js 14.2 (App Router), React 18, TypeScript (strict)
- **DB**: PostgreSQL via Supabase (pooled + direct connections)
- **ORM**: Prisma 6.x
- **Auth**: NextAuth v4 (JWT)
- **Styling**: Tailwind CSS 3.x with CSS variables, red-tinted dark theme
- **State**: Zustand (cart, notifications), TanStack React Query (server)
- **Forms**: React Hook Form + Zod
- **Payments**: Stripe + Crypto (USDT wallets)
- **Email**: Resend
- **Storage**: Supabase Storage + AWS S3
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Hosting**: Vercel
- **Encryption**: AES-256-GCM (trading credentials)

## Styling

### CSS Variables (globals.css)
```
bg-primary: #090707    bg-secondary: #100c0c    bg-card: #170d0d    bg-elevated: #1f1111
accent-primary: #e63946    accent-hover: #ff1a2e    accent-muted: #8b0000    accent-gold: #d4af37
text-primary: #ffffff    text-secondary: #a0a0a0    text-tertiary: #666666
```

### Tailwind Usage
- Colors via CSS vars: `text-text-primary`, `bg-accent-primary`, `border-border`, etc.
- Glassmorphism: `glass-shine` class, `rgba(230,57,70,0.XX)` borders.
- Fonts: `font-heading` (Space Grotesk), `font-sans` (Inter), `font-mono` (JetBrains Mono), `font-display` (Playfair).
- Glows: `shadow-glow`, `shadow-glow-sm`, `shadow-glow-lg`, `shadow-glow-gold`.

## Database Models

### Enums (8)
```
Role: USER, TRADER, MODERATOR, ADMIN, HEAD_ADMIN
ChallengeStatus: PENDING, IN_PROGRESS, PHASE_1, PHASE_2, PASSED, FAILED, FUNDED
OrderStatus: PENDING_PAYMENT, PAID, IN_PROGRESS, COMPLETED, REFUNDED, CANCELLED
PaymentMethod: STRIPE, PAYPAL, CRYPTO
TicketStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED
ServiceType: CHALLENGE_PASSING, ACCOUNT_MANAGEMENT, ACCOUNT_GROWTH
SplitStatus: PENDING, CONFIRMED, DISPUTED, REJECTED
PayoutStatus: PENDING, PAID, REJECTED
```

### Models (28 total)
**Auth**: User, Account, Session, VerificationToken
**Business**: Order, Challenge, DailyStat, Payment, Credential, ProfitSplit, ReferralPayout
**Signals**: Signal (VPS queue), SignalLog (history), SignalDelivery (per-challenge tracking)
**Content**: ServicePlan, PropFirm, FAQItem, TrustStat, HomeService, BlogPost, Testimonial
**Support**: SupportTicket, TicketReply, Conversation, ChatMessage
**Admin**: Notification, Coupon, Referral, AdminLog, SiteStats

### Key Model Notes
- `User` has: staffNickname, signalNickname, canOverrideRisk, referralBalance, referralSlug (unique vanity URL), referredBy, location tracking fields, otpAttempts/otpLockedUntil.
- `Order` has: proofImage, paymentNetwork, cryptoTxId (for crypto payment verification).
- `Challenge` has: balance, equity, openProfit, totalTrades, openTrades, riskPct, dailyDDLimit, totalDDLimit, dailyCapPct, allowedPairs, isPaused, eaToken, lastReportedAt.
- `ServicePlan` has: sizePricing (JSON for per-size pricing).
- `SupportTicket.responses` is deprecated — use `TicketReply` relation instead.
- `ChatMessage` has: senderName (snapshot of staffNickname), senderRole (USER/MODERATOR/ADMIN/HEAD_ADMIN/ASSISTANT for AI), editedAt (HEAD_ADMIN edits).
- `Conversation` has: userUnread, staffUnread (separate unread counters for badge system).

## Key Library Files (src/lib/)

| File | Purpose |
|------|---------|
| `prisma.ts` | Prisma client singleton |
| `auth.ts` | NextAuth config (Google + Credentials, JWT callbacks, 2FA OTP) |
| `api-helpers.ts` | `successResponse`, `errorResponse`, `requireAuth`, `requireModerator`, `requireAdmin`, `requireHeadAdmin`, `handleApiError`, `parsePagination`, `AuthError` class |
| `utils.ts` | `cn()`, `formatCurrency()`, `formatNumber()`, `formatDate()`, `slugify()`, `getInitials()`, `getStatusColor()`, `getServiceTypeLabel()` |
| `validations.ts` | Zod schemas for forms and API inputs |
| `email.ts` | Resend transactional emails |
| `encrypt.ts` | AES-256-GCM encrypt/decrypt for credentials |
| `stripe.ts` | Stripe SDK + checkout session |
| `s3.ts` | S3 upload/delete |
| `storage.ts` | Supabase Storage proof image upload |
| `constants.ts` | SITE_CONFIG, CRYPTO_WALLETS, NAV_LINKS, TRADING_PLATFORMS, LIVE_NOTIFICATIONS, TICKET_PRIORITIES |
| `discord.ts` | Discord webhook notifications |
| `admin-notify.ts` | Admin notification helpers |
| `signal-sender.ts` | Signal routing logic |
| `staff-display.ts` | Staff nickname display helpers |
| `referral.ts` | Referral commission logic (20% on CHALLENGE_PASSING only) |
| `ai-chat.ts` | AI chatbot response engine (~30 intent detectors, DB knowledge base) |
| `rate-limit.ts` | Rate limiting |
| `geo.ts` | Geolocation from IP |

## Stores (Zustand) — src/store/
- `cartStore.ts` — purchase flow state
- `notificationStore.ts` — notification state

Note: there is NO `authStore.ts` — auth state comes from NextAuth's `useSession()`.

## Hooks — src/hooks/
`useAuth`, `useChatUnread` (polls every 15s), `useCountUp`, `useDebounce`, `useLastPanel`, `useMediaQuery`, `useScrollAnimation`, `useToast`

## Admin Pages — src/app/admin/
| Page | Route | Min Role | Purpose |
|------|-------|----------|---------|
| Dashboard | `/admin` | MODERATOR | Overview stats |
| Users | `/admin/users` | MODERATOR | User management |
| Orders | `/admin/orders` | MODERATOR | Order list + detail (status changes, credentials) |
| Crypto Payments | `/admin/crypto-payments` | ADMIN | Verify/approve/reject crypto payments with proof + TxID |
| Challenges | `/admin/challenges` | MODERATOR | Challenge management |
| Signal Hub | `/admin/signals` | TRADER | Send trading signals |
| Chat | `/admin/chat` | MODERATOR | Staff live chat with users |
| Tickets | `/admin/tickets` | MODERATOR | Support ticket management |
| Payouts | `/admin/payouts` | MODERATOR | Referral payout management |
| Referrals | `/admin/referrals` | MODERATOR | Referral tracking |
| Notifications | `/admin/notifications` | MODERATOR | Notification management |
| Services | `/admin/services` | ADMIN | ServicePlan CRUD |
| Blog | `/admin/blog` | MODERATOR | Blog post management |
| Home Page | `/admin/home-page` | ADMIN | Homepage content management |
| Coupons | `/admin/coupons` | ADMIN | Coupon management |
| Activity Logs | `/admin/logs` | ADMIN | Admin action audit log |
| Settings | `/admin/settings` | ADMIN | Site settings |

## Discord Server Bot — discord-server/
Standalone Discord.js bot (excluded from Next.js build). Features: verification, role assignment, tickets, welcome messages, anti-spam, anti-raid, moderation commands. Config in `discord-server/src/config.ts`.

## Path Alias
`@/*` → `./src/*`

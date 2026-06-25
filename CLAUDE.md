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
- 2FA: email-based OTP with brute-force protection (5 attempts, 30-min lockout).
- Session includes `user.id`, `user.role`, `user.twoFactorEnabled`, `user.emailVerified`.
- Config in `src/lib/auth.ts` (single file — there is no separate `auth-options.ts`).

### File Uploads
- Proof images → **Supabase Storage** (bucket: `proof-images`), NOT local filesystem.
- Upload logic in `src/lib/storage.ts`. Requires `SUPABASE_SERVICE_ROLE_KEY`.

### Signal System
- Admin sends signals from Signal Hub → stored as `Signal` records → VPS polls `/api/ea/pending-signals`.
- Discord bridge receives signals via `/api/webhook/signal` → creates `SignalLog` + `SignalDelivery` per challenge.
- Each challenge has its own `eaToken` for MT5 EA authentication.
- EA reports to `/api/ea/report` with token-based auth, updating challenge metrics.

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
- `User` has: staffNickname, signalNickname, canOverrideRisk, referralBalance, location tracking fields, otpAttempts/otpLockedUntil.
- `Challenge` has: balance, equity, openProfit, totalTrades, openTrades, riskPct, dailyDDLimit, totalDDLimit, dailyCapPct, allowedPairs, isPaused, eaToken, lastReportedAt.
- `ServicePlan` has: sizePricing (JSON for per-size pricing).
- `SupportTicket.responses` is deprecated — use `TicketReply` relation instead.
- `ChatMessage` has: senderName (snapshot of staffNickname), editedAt (HEAD_ADMIN edits).

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
| `referral.ts` | Referral commission logic |
| `rate-limit.ts` | Rate limiting |
| `geo.ts` | Geolocation from IP |

## Stores (Zustand) — src/store/
- `cartStore.ts` — purchase flow state
- `notificationStore.ts` — notification state

Note: there is NO `authStore.ts` — auth state comes from NextAuth's `useSession()`.

## Hooks — src/hooks/
`useAuth`, `useChatUnread`, `useCountUp`, `useDebounce`, `useLastPanel`, `useMediaQuery`, `useScrollAnimation`, `useToast`

## Path Alias
`@/*` → `./src/*`

# The Market Architects - Claude Project Instructions

## Identity

You are working on **The Market Architects** — a Next.js 14 SaaS platform for proprietary trading firm challenge passing, funded account management, and account growth services. The business helps traders get funded by passing prop firm challenges on their behalf and managing funded accounts for profit splits.

## Critical Rules

### Database Operations
- **ALWAYS use `prisma db push`** — never `prisma migrate dev`. This project does NOT use Prisma migrations.
- **Stop the dev server before running `npx prisma generate`** — the dev server locks `query_engine-windows.dll.node` on Windows and the command will fail.
- The Prisma config is in `prisma.config.ts` at project root (NOT in package.json).

### Component API (Do NOT guess — use these exact props)
- `<Modal>` uses `isOpen` (NOT `open`)
- `<Badge>` variants: `'default' | 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'gold' | 'outline'` — there is NO `'orange'` variant
- `<GlassCard>` variants: `'default' | 'strong' | 'subtle'`, padding: `'none' | 'sm' | 'md' | 'lg'`, glow: `'red' | 'gold' | 'none'`
- `<Button>` variants: `'primary' | 'secondary' | 'ghost' | 'danger'`

### Data Architecture
- **ServicePlan, PropFirm, FAQItem, TrustStat** are stored in the database and managed via `/admin/services`. They are NOT hardcoded constants.
- `ServicePlan.serviceType` is a flexible `String` (not a Prisma enum) to allow custom service types from admin panel.
- `Order.serviceType` uses the Prisma `ServiceType` enum for backward compatibility.
- Homepage fetches data server-side via Prisma in `page.tsx` and passes serialized props to client components.
- Dashboard pages fetch client-side from `/api/public/*` endpoints.
- `src/lib/constants.ts` only contains: `SITE_CONFIG`, `CRYPTO_WALLETS`, `NAV_LINKS`, `TRADING_PLATFORMS`, `LIVE_NOTIFICATIONS`, `TICKET_PRIORITIES`.

### Styling Conventions
- Dark theme with red accent (`#e63946`). All backgrounds are near-black (`#0d0303`, `#120404`, `#180c0c`).
- Use CSS variable colors from Tailwind config: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `bg-accent-primary`, `text-accent-primary`, etc.
- Glass-morphism cards use `glass-shine` class and rgba red borders: `border-[rgba(230,57,70,0.XX)]`.
- Font families: `font-heading` (Space Grotesk), `font-sans` (Inter), `font-mono` (JetBrains Mono).
- Glow effects: `shadow-glow`, `shadow-glow-sm`, `shadow-glow-lg`, `shadow-glow-gold`.

### API Pattern
- All API routes use helpers from `src/lib/api-helpers.ts`: `successResponse()`, `errorResponse()`, `requireAuth()`, `requireAdmin()`, `handleApiError()`.
- Response shape: `{ success: boolean, data?: T, error?: string }`.
- Admin routes check role via `requireAdmin()`. Dashboard routes use `requireAuth()`.

### Auth
- NextAuth with JWT strategy (8-hour sessions).
- Providers: Google OAuth + Credentials (email/password with bcrypt).
- Middleware redirects non-admin users from `/admin/*` to `/dashboard`.
- Session includes `user.id` and `user.role`.

### File Uploads
- Proof images upload to **Supabase Storage** (bucket: `proof-images`), NOT the local filesystem.
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable.
- Upload logic in `src/lib/storage.ts`.

### Signal Routing / EA Integration
- MT5 Expert Advisors report to `/api/ea/report` with token-based authentication.
- Each challenge has its own EA token generated via `/api/admin/challenges/[id]/token`.
- Signal webhook at `/api/webhook/signal` routes signals to active challenges.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase (connection pooling)
- **ORM**: Prisma 6.x
- **Auth**: NextAuth v4 (JWT strategy)
- **Styling**: Tailwind CSS 3.x with custom theme
- **State**: Zustand (client), TanStack React Query (server)
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe + Crypto (USDT wallets)
- **Email**: Resend
- **Storage**: Supabase Storage + AWS S3
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Hosting**: Vercel
- **Encryption**: AES-256-GCM for credentials

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json).

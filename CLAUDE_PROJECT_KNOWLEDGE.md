# The Market Architects - Project Knowledge File

## Project Structure

```
the-market-architects/
├── prisma/
│   ├── schema.prisma          # Database schema (20+ models)
│   ├── seed.ts                # Main database seeder
│   └── seed-services.ts       # Service plans/firms/FAQ/stats seeder
├── prisma.config.ts           # Prisma config (seed command, schema path)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage (async server component, fetches from Prisma)
│   │   ├── layout.tsx         # Root layout (fonts, providers, metadata)
│   │   ├── error.tsx          # Global error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   ├── sitemap.ts         # Dynamic sitemap
│   │   ├── robots.ts          # Robots.txt
│   │   ├── middleware.ts      # Auth + role-based routing
│   │   ├── (auth)/            # Auth pages (login, register, forgot/reset password, verify email)
│   │   ├── (marketing)/       # Public pages (about, blog, contact, pricing, services)
│   │   ├── dashboard/         # User dashboard (14 pages)
│   │   ├── admin/             # Admin panel (14 pages)
│   │   └── api/               # API routes (60+ endpoints)
│   ├── components/
│   │   ├── providers/         # SessionProvider, QueryProvider, ToastProvider
│   │   ├── layout/            # Navbar, Footer, Sidebars, Topbars, MobileNav
│   │   ├── home/              # HeroSection, PricingSection, FAQSection, etc. (10 components)
│   │   ├── about/             # FloatingAboutLogo
│   │   ├── effects/           # ParticleField, GradientOrb, CandlestickBg, ScrollReveal
│   │   └── ui/                # 20+ reusable components (Button, Input, Modal, Table, etc.)
│   ├── hooks/                 # useAuth, useToast, useMediaQuery, useCountUp, etc. (7 hooks)
│   ├── store/                 # authStore, cartStore, notificationStore (Zustand)
│   ├── types/                 # TypeScript types + NextAuth augmentation
│   ├── lib/                   # Core utilities (see below)
│   └── utils/                 # Additional utilities
├── public/                    # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## Database Models (Prisma)

### Core Auth
- **User** — id, email, name, avatar, role (USER/ADMIN), passwordHash, emailVerified, twoFactorEnabled, twoFactorSecret, referralCode, referredBy, timestamps
- **Account** — OAuth provider data (next-auth adapter)
- **Session** — Session tokens (next-auth adapter)
- **VerificationToken** — Email verification + password reset tokens

### Business Logic
- **Order** — userId, serviceType (enum), planName, planDetails (JSON), accountSize, firmName, status (enum), totalAmount, discountAmount, couponCode, proofImage, paymentNetwork, notes
- **Challenge** — orderId, userId, firmName, accountSize, status (enum), currentPhase, targetProfit, currentProfit, maxDrawdown, currentDrawdown, daysTraded, winRate, proofImages[], eaToken, adminNotes
- **DailyStat** — challengeId, date, profit, loss, tradesCount, winCount, lossCount, notes
- **Payment** — orderId, userId, amount, currency, method (enum), stripePaymentId, status, invoiceUrl
- **Credential** — orderId, platform, server, loginId (encrypted), password (encrypted), notes
- **ProfitSplit** — orderId, userId, challengeId, periodStart, periodEnd, grossProfit, splitPercent, traderShare, clientShare, status (enum), proofUrl, notes

### Content Management (Admin-managed)
- **ServicePlan** — name, tier, serviceType (String, flexible), price, originalPrice, priceLabel, description, features[], popular, accountSizes[], guarantee, successRate, deliveryDays, sortOrder, isActive
- **PropFirm** — name, logo, phases, accountSizes[], sortOrder, isActive
- **FAQItem** — question, answer, sortOrder, isActive
- **TrustStat** — label, value (Float), suffix, prefix, icon (String → mapped to Lucide component), sortOrder
- **BlogPost** — title, slug, content, excerpt, coverImage, category, tags[], published, publishedAt, authorId
- **Testimonial** — name, avatar, role, content, rating, featured

### Support & Admin
- **SupportTicket** — userId, subject, message, status (enum), priority, adminNotes, responses (JSON[])
- **Notification** — userId, title, message, type, link, read
- **Coupon** — code, discountPercent, discountAmount, maxUses, usedCount, validFrom, validUntil, isActive
- **Referral** — referrerId, referredId, orderId, commission, status
- **AdminLog** — adminId, action, target, details, ipAddress
- **SiteStats** — key, value (Float)
- **SignalLog** — signal data from Discord/webhook
- **SignalDelivery** — per-challenge signal delivery tracking

### Enums
```
Role: USER, ADMIN
ChallengeStatus: PENDING, IN_PROGRESS, PHASE_1, PHASE_2, PASSED, FAILED, FUNDED
OrderStatus: PENDING_PAYMENT, PAID, IN_PROGRESS, COMPLETED, REFUNDED, CANCELLED
PaymentMethod: STRIPE, PAYPAL, CRYPTO
TicketStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED
ServiceType: CHALLENGE_PASSING, ACCOUNT_MANAGEMENT, ACCOUNT_GROWTH
SplitStatus: PENDING, CONFIRMED, DISPUTED, REJECTED
```

## API Route Map

### Public (no auth)
```
GET  /api/public/plans          — Active service plans (revalidate=60)
GET  /api/public/firms          — Active prop firms (revalidate=60)
GET  /api/public/faq            — Active FAQ items (revalidate=60)
GET  /api/public/trust-stats    — Trust indicators (revalidate=60)
GET  /api/public/blog           — Published blog posts
GET  /api/public/testimonials   — Featured testimonials
POST /api/public/contact        — Contact form submission
POST /api/coupons/validate      — Validate coupon code
```

### Auth
```
POST /api/auth/[...nextauth]    — NextAuth handler
POST /api/auth/register         — User registration
POST /api/auth/verify-email     — Email verification
POST /api/auth/forgot-password  — Request password reset
POST /api/auth/reset-password   — Reset with token
```

### Dashboard (requireAuth)
```
GET      /api/dashboard/stats              — User statistics
GET|POST /api/dashboard/orders             — User orders
GET|POST /api/dashboard/challenges         — User challenges
GET      /api/dashboard/challenges/[id]    — Challenge detail
GET|POST /api/dashboard/credentials        — Trading credentials
GET|POST /api/dashboard/notifications      — Notifications
POST     /api/dashboard/notifications/mark-all-read
GET|POST /api/dashboard/tickets            — Support tickets
GET|POST /api/dashboard/tickets/[id]/reply — Ticket replies
POST     /api/dashboard/change-password
GET|POST /api/dashboard/profile
POST     /api/dashboard/payment-proof      — Upload proof to Supabase
GET|POST /api/dashboard/profit-splits
GET      /api/dashboard/referrals
POST     /api/checkout                     — Create order (validates plan from DB)
```

### Admin (requireAdmin)
```
GET      /api/admin/stats
CRUD     /api/admin/users, /api/admin/users/[id]
CRUD     /api/admin/orders, /api/admin/orders/[id]
POST     /api/admin/orders/[id]/challenge  — Create challenge from order
CRUD     /api/admin/challenges, /api/admin/challenges/[id]
POST     /api/admin/challenges/[id]/token  — Generate EA token
CRUD     /api/admin/tickets, /api/admin/tickets/[id]
POST     /api/admin/tickets/[id]/reply
CRUD     /api/admin/coupons, /api/admin/coupons/[id]
CRUD     /api/admin/plans, /api/admin/plans/[id]
CRUD     /api/admin/firms, /api/admin/firms/[id]
CRUD     /api/admin/faq, /api/admin/faq/[id]
GET|PUT  /api/admin/trust-stats            — Batch update trust stats
CRUD     /api/admin/blog, /api/admin/blog/[id]
GET|POST /api/admin/blog/categories
CRUD     /api/admin/profit-splits, /api/admin/profit-splits/[id]
GET|POST /api/admin/notifications          — Send to users
POST     /api/admin/signals
POST     /api/admin/upload
GET|POST /api/admin/credentials
DELETE   /api/admin/credentials/[id]
GET      /api/admin/logs
```

### Webhooks
```
POST /api/stripe/webhook        — Stripe payment events
POST /api/webhook/signal        — Trade signal from Discord/external
POST /api/webhook/clients       — Client update webhook
POST /api/ea/report             — MT5 EA reporting (token auth)
```

## Key Library Files (src/lib/)

| File | Exports |
|------|---------|
| `prisma.ts` | Default Prisma client singleton |
| `auth.ts` | `authOptions` (NextAuth config: Google + Credentials providers, JWT callbacks) |
| `api-helpers.ts` | `successResponse()`, `errorResponse()`, `requireAuth()`, `requireAdmin()`, `getAuthSession()`, `handleApiError()`, `parsePagination()` |
| `utils.ts` | `cn()` (clsx+twMerge), `formatCurrency()`, `formatNumber()`, `formatDate()`, `slugify()`, `getInitials()`, `getStatusColor()`, `getServiceTypeLabel()` |
| `validations.ts` | Zod schemas for all forms and API inputs |
| `email.ts` | `sendVerificationEmail()`, `sendPasswordResetEmail()`, `sendOrderConfirmation()`, `sendChallengeUpdate()` (via Resend) |
| `encrypt.ts` | `encrypt()`, `decrypt()` (AES-256-GCM for trading credentials) |
| `stripe.ts` | Stripe SDK init + checkout session creation |
| `s3.ts` | `uploadToS3()`, `deleteFromS3()` |
| `storage.ts` | `uploadProofImage()` (Supabase Storage, requires SUPABASE_SERVICE_ROLE_KEY) |
| `constants.ts` | `SITE_CONFIG`, `CRYPTO_WALLETS`, `NAV_LINKS`, `TRADING_PLATFORMS`, `LIVE_NOTIFICATIONS`, `TICKET_PRIORITIES` |

## UI Component Reference

### GlassCard
```tsx
<GlassCard variant="default|strong|subtle" padding="none|sm|md|lg" hover glow="red|gold|none">
```

### Modal
```tsx
<Modal isOpen={bool} onClose={fn} title="..." size="sm|md|lg|xl|full">
```

### Badge
```tsx
<Badge variant="default|red|green|yellow|blue|purple|gold|outline" size="sm|md" dot>
```

### Button
```tsx
<Button variant="primary|secondary|ghost|danger" size="sm|md|lg" fullWidth glow loading icon={<Icon />} iconPosition="left|right">
```

### Other UI Components
- `Input` — label, error, icon props
- `Select` — label, error, children (option elements)
- `Textarea` — label, error props
- `Tabs` — tabs[], activeTab, onChange, variant="pills|underline"
- `Table` — columns[], data[], onRowClick
- `StatCard` — title, value, change, icon, trend
- `SectionBadge` — children (text label for section headers)
- `GlowBorder` — color="red|gold", children
- `AnimatedCounter` — value, prefix, suffix
- `ScrollReveal` — wrapper for scroll-triggered animations
- `Skeleton` — loading placeholder
- `Toggle` — checked, onChange
- `Tooltip` — content, children
- `FileUpload` — accept, onChange, maxSize

## Tailwind Theme

### Colors (CSS Variables)
```
bg-primary, bg-secondary, bg-card, bg-elevated
accent-primary (#e63946), accent-hover, accent-muted, accent-gold
text-primary, text-secondary, text-tertiary
success, danger
border, glass, glass-border
```

### Custom Classes
```css
.glass-shine          /* Glass-morphism shine effect */
.glass-card           /* Pre-built glass card (bg + border + backdrop) */
.gradient-mesh-bg     /* Gradient mesh background */
.text-gradient-red    /* Red gradient text */
.section-container    /* max-w-7xl mx-auto */
.section-padding      /* Responsive horizontal padding */
.shadow-glow          /* Red glow shadow */
.shadow-glow-sm       /* Small glow */
.shadow-glow-lg       /* Large glow */
.shadow-glow-gold     /* Gold glow */
```

### Fonts
```
font-sans:    Inter (body)
font-heading: Space Grotesk (headings)
font-mono:    JetBrains Mono (code, prices)
font-display: Playfair Display (hero display text)
```

## Data Flow Patterns

### Homepage (Server-Side)
```
page.tsx (async server component)
  → prisma.servicePlan.findMany()
  → prisma.fAQItem.findMany()
  → prisma.trustStat.findMany()
  → prisma.propFirm.findMany()
  → Serialize dates to ISO strings
  → Pass as props to client components
  → export const revalidate = 60 (ISR)
```

### Dashboard Pages (Client-Side)
```
'use client' component
  → useEffect → fetch('/api/public/plans')
  → useState for data + loading
  → Render with fetched data
```

### Admin CRUD Pattern
```
Admin page → fetch('/api/admin/[resource]') for list
  → Modal with form for create/edit
  → fetch POST/PATCH/DELETE to '/api/admin/[resource]/[id]'
  → Refresh list on success
  → Toggle active/inactive inline
```

### Purchase Flow (Multi-Step Cart)
```
Step 1: Select service type (derived from plan data)
Step 2: Select plan (filtered by service type)
Step 3: Select firm + account size
Step 4: Order summary + coupon
Step 5: Crypto payment (wallet address + proof upload)
State managed by cartStore (Zustand)
```

## Environment Variables

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=            # Pooled connection
DIRECT_URL=              # Direct connection

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Required for proof uploads

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Storage
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=
S3_BUCKET=

# Security
ENCRYPTION_KEY=               # For credential encryption
CREDENTIAL_ENCRYPTION_KEY=

# Webhooks
WEBHOOK_SECRET=               # Signal hub webhook auth

# Social
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_DISCORD_INVITE=
NEXT_PUBLIC_APP_URL=
```

## Common Patterns

### API Route Template
```typescript
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(); // or requireAdmin()
    const data = await prisma.model.findMany({ where: { userId: session.user.id } });
    return successResponse(data);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### Server Component Data Fetching
```typescript
import prisma from '@/lib/prisma';
export const revalidate = 60;

export default async function Page() {
  const data = await prisma.model.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  const serialized = data.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() }));
  return <ClientComponent data={serialized} />;
}
```

### Admin Page with Modal CRUD
```typescript
'use client';
const [items, setItems] = useState([]);
const [modalOpen, setModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState(null);

// Fetch list
useEffect(() => { fetch('/api/admin/resource').then(...) }, []);

// Create/Edit
<Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="...">
  <Form onSave={async (data) => {
    await fetch(editingItem ? `/api/admin/resource/${editingItem.id}` : '/api/admin/resource', {
      method: editingItem ? 'PATCH' : 'POST', body: JSON.stringify(data)
    });
    refreshList();
  }} />
</Modal>
```

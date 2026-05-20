
## PROJECT OVERVIEW

Build a complete, production-ready, full-stack Next.js 14 (App Router) website for **"The Market Architects"** — a premium prop firm challenge passing and funded account management business. The site must feel like a high-end fintech SaaS platform: dark, luxurious, authoritative, and conversion-optimized.

---

## BRAND IDENTITY & DESIGN SYSTEM

### Logo & Assets
- The logo is a **red phoenix/eagle** with spread wings on a pure black background. Store all logo variants in `/public/assets/logos/`.
- Place the logo file `logo.png` (the phoenix icon) and `logo-full.png` (phoenix + "THE MARKET ARCHITECTS" text) in that directory. Reference them throughout the app.
- The phoenix symbolizes **rising, dominance, and rebirth** — echo this in copywriting and visual metaphors.

### Color Palette (Tailwind config + CSS variables)
```
--color-bg-primary: #000000        (pure black)
--color-bg-secondary: #0A0A0A      (near-black)
--color-bg-card: #111111            (dark card surfaces)
--color-bg-elevated: #1A1A1A        (elevated panels)
--color-accent-primary: #E63946     (brand red — matches phoenix)
--color-accent-hover: #FF1A2E       (neon red glow on hover)
--color-accent-muted: #8B0000       (dark red for subtle accents)
--color-accent-gold: #D4AF37        (gold for premium highlights, badges)
--color-text-primary: #FFFFFF       (primary text)
--color-text-secondary: #A0A0A0     (secondary/muted text)
--color-text-tertiary: #666666      (subtle labels)
--color-border: #222222             (card/section borders)
--color-success: #00C853            (profit/green indicators)
--color-danger: #FF1744             (loss/error indicators)
--color-glass: rgba(255,255,255,0.05) (glassmorphism fill)
--color-glass-border: rgba(255,255,255,0.08)
```

### Typography
- Headings: `Inter` or `Space Grotesk` (bold, uppercase for hero/section titles)
- Body: `Inter` (clean, modern, highly legible)
- Monospace accents: `JetBrains Mono` (for numbers, stats, trading data)
- Use `next/font/google` for optimal loading.

### Design Principles
1. **Glassmorphism**: Cards and panels use `backdrop-blur-xl`, semi-transparent backgrounds (`bg-white/5`), subtle white borders (`border-white/10`). No flat solid cards.
2. **Neon glow accents**: Red glow on CTAs (`shadow-[0_0_30px_rgba(230,57,70,0.4)]`), gold glow on premium badges.
3. **Smooth animations**: Use `framer-motion` for scroll reveals, stagger animations, page transitions, counter animations, hover effects. Every section should animate in on scroll.
4. **Gradient meshes**: Subtle radial gradients (dark red/black) as section backgrounds for depth.
5. **Micro-interactions**: Button hover scales, card tilt on hover (subtle 3D transform), glowing borders on focus.
6. **Mobile-first**: Every component must be fully responsive. Test at 375px, 768px, 1024px, 1440px breakpoints.

---

## TECH STACK

```
Frontend:       Next.js 14 (App Router), React 18, TypeScript
Styling:        Tailwind CSS 3.4, custom CSS variables, framer-motion
UI Components:  Build custom — NO shadcn/ui, NO MUI. Everything hand-crafted to match the dark luxury aesthetic.
State:          Zustand (global state), React Query / TanStack Query (server state)
Forms:          React Hook Form + Zod validation
Auth:           NextAuth.js v5 (credentials + Google OAuth + email magic links)
Database:       PostgreSQL via Prisma ORM
Payments:       Stripe (primary), with stubs for PayPal and crypto
Email:          Resend (transactional emails)
File Storage:   Upload credentials/proofs to S3-compatible storage (use presigned URLs)
Charts:         Recharts (dashboard analytics), TradingView widget (embeds)
Real-time:      Server-Sent Events or polling for notifications
Deployment:     Docker + docker-compose (Postgres + app), with Vercel-ready config
```

---

## FOLDER STRUCTURE

```
the-market-architects/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── assets/
│   │   ├── logos/
│   │   │   ├── logo.png                  # Phoenix icon only
│   │   │   └── logo-full.png             # Phoenix + text
│   │   ├── hero-bg.mp4                   # (placeholder reference)
│   │   └── patterns/
│   │       └── grid.svg                  # Subtle grid pattern overlay
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (fonts, theme, providers)
│   │   ├── page.tsx                      # Homepage
│   │   ├── globals.css                   # CSS variables, base styles
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (marketing)/
│   │   │   ├── about/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx              # Blog listing
│   │   │   │   └── [slug]/page.tsx       # Blog post
│   │   │   ├── faq/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── nda/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Dashboard shell (sidebar + topbar)
│   │   │   ├── page.tsx                  # Overview / home
│   │   │   ├── challenges/page.tsx       # Active challenges list
│   │   │   ├── challenges/[id]/page.tsx  # Individual challenge detail
│   │   │   ├── analytics/page.tsx        # P&L charts, performance
│   │   │   ├── services/page.tsx         # Purchased services
│   │   │   ├── purchase/page.tsx         # Buy new service (multi-step)
│   │   │   ├── payments/page.tsx         # Payment history + invoices
│   │   │   ├── credentials/page.tsx      # Submit/manage trading credentials
│   │   │   ├── notifications/page.tsx
│   │   │   ├── support/page.tsx          # Tickets
│   │   │   ├── referrals/page.tsx        # Affiliate/referral dashboard
│   │   │   ├── settings/page.tsx         # Profile, 2FA, password
│   │   │   └── tools/
│   │   │       ├── calculator/page.tsx   # Profit split calculator
│   │   │       └── widgets/page.tsx      # Live market widgets
│   │   ├── admin/
│   │   │   ├── layout.tsx                # Admin shell
│   │   │   ├── page.tsx                  # Admin overview / revenue dashboard
│   │   │   ├── users/page.tsx            # Manage users
│   │   │   ├── users/[id]/page.tsx       # User detail
│   │   │   ├── orders/page.tsx           # All orders
│   │   │   ├── challenges/page.tsx       # Track active challenges
│   │   │   ├── challenges/[id]/page.tsx  # Update progress, upload proof
│   │   │   ├── payouts/page.tsx          # Manage payouts
│   │   │   ├── blog/page.tsx             # Manage blog posts
│   │   │   ├── blog/editor/page.tsx      # Blog editor
│   │   │   ├── coupons/page.tsx          # Manage discount codes
│   │   │   ├── notifications/page.tsx    # Send notifications/emails
│   │   │   ├── logs/page.tsx             # Admin activity logs
│   │   │   └── settings/page.tsx         # Site settings
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── users/route.ts
│   │       ├── challenges/route.ts
│   │       ├── orders/route.ts
│   │       ├── payments/
│   │       │   ├── stripe/route.ts
│   │       │   └── webhook/route.ts
│   │       ├── upload/route.ts
│   │       ├── notifications/route.ts
│   │       ├── blog/route.ts
│   │       ├── coupons/route.ts
│   │       ├── referrals/route.ts
│   │       ├── support/route.ts
│   │       ├── admin/
│   │       │   ├── stats/route.ts
│   │       │   ├── logs/route.ts
│   │       │   └── users/route.ts
│   │       └── public/
│   │           ├── testimonials/route.ts
│   │           └── stats/route.ts
│   ├── components/
│   │   ├── ui/                           # Reusable primitives
│   │   │   ├── Button.tsx                # Variants: primary (red glow), secondary (outline), ghost
│   │   │   ├── GlassCard.tsx             # Glassmorphism card wrapper
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── AnimatedCounter.tsx       # Number count-up animation
│   │   │   └── GlowBorder.tsx            # Animated glowing border wrapper
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                # Main nav (transparent -> solid on scroll)
│   │   │   ├── Footer.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   ├── DashboardTopbar.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── home/                         # Homepage sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── TrustIndicators.tsx       # Stats bar (clients, payouts, challenges)
│   │   │   ├── ServicesOverview.tsx
│   │   │   ├── HowItWorks.tsx            # Animated timeline
│   │   │   ├── PayoutProof.tsx           # Gallery of payout screenshots
│   │   │   ├── Testimonials.tsx          # Carousel/grid
│   │   │   ├── PricingSection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   ├── LiveNotifications.tsx     # Toast: "Client X passed $100K challenge"
│   │   │   └── CTABanner.tsx             # Final conversion section
│   │   ├── dashboard/
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── PnLChart.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── CredentialForm.tsx
│   │   │   └── InvoiceDownload.tsx
│   │   ├── admin/
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── UserTable.tsx
│   │   │   ├── OrderTable.tsx
│   │   │   └── ChallengeManager.tsx
│   │   ├── purchase/
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── PlanSelector.tsx
│   │   │   ├── AccountDetailsForm.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   └── OrderConfirmation.tsx
│   │   ├── trading/
│   │   │   ├── TradingViewWidget.tsx
│   │   │   ├── ForexTicker.tsx
│   │   │   ├── CryptoTicker.tsx
│   │   │   └── ProfitSplitCalculator.tsx
│   │   ├── support/
│   │   │   ├── TicketForm.tsx
│   │   │   ├── TicketList.tsx
│   │   │   ├── LiveChat.tsx
│   │   │   └── WhatsAppButton.tsx
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx
│   │   │   └── BlogContent.tsx
│   │   └── effects/
│   │       ├── CandlestickBg.tsx         # Animated SVG candlestick chart background
│   │       ├── ParticleField.tsx         # Subtle floating particles
│   │       ├── GradientOrb.tsx           # Ambient glowing orb
│   │       └── ScrollReveal.tsx          # Framer-motion scroll wrapper
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── auth.ts                       # NextAuth config
│   │   ├── stripe.ts                     # Stripe instance + helpers
│   │   ├── email.ts                      # Resend email helpers
│   │   ├── upload.ts                     # S3 presigned URL helpers
│   │   ├── utils.ts                      # Utility functions
│   │   ├── constants.ts                  # Site-wide constants
│   │   └── validations.ts               # Zod schemas
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useScrollAnimation.ts
│   │   ├── useCountUp.ts
│   │   └── useMediaQuery.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── notificationStore.ts
│   ├── types/
│   │   └── index.ts                      # All TypeScript interfaces
│   └── middleware.ts                      # Auth route protection, admin guard, rate limiting
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## DATABASE SCHEMA (Prisma)

Create `prisma/schema.prisma` with the following models. Use PostgreSQL. Add proper indexes, relations, enums, and cascade deletes.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum ChallengeStatus {
  PENDING
  IN_PROGRESS
  PHASE_1
  PHASE_2
  PASSED
  FAILED
  FUNDED
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  IN_PROGRESS
  COMPLETED
  REFUNDED
  CANCELLED
}

enum PaymentMethod {
  STRIPE
  PAYPAL
  CRYPTO
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum ServiceType {
  CHALLENGE_PASSING
  ACCOUNT_MANAGEMENT
  ACCOUNT_GROWTH
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  passwordHash      String?
  avatar            String?
  role              Role      @default(USER)
  emailVerified     DateTime?
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?
  referralCode      String    @unique @default(cuid())
  referredBy        String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  accounts          Account[]
  sessions          Session[]
  orders            Order[]
  challenges        Challenge[]
  tickets           SupportTicket[]
  notifications     Notification[]
  referrals         Referral[]       @relation("referrer")
  payments          Payment[]
  adminLogs         AdminLog[]

  @@index([email])
  @@index([referralCode])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Order {
  id              String        @id @default(cuid())
  userId          String
  serviceType     ServiceType
  planName        String
  planDetails     Json          // Store selected plan config
  accountSize     String?       // e.g., "$50K", "$100K", "$200K"
  firmName        String?       // Which prop firm
  status          OrderStatus   @default(PENDING_PAYMENT)
  totalAmount     Float
  discountAmount  Float         @default(0)
  couponCode      String?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id])
  challenge       Challenge?
  payments        Payment[]
  credentials     Credential[]

  @@index([userId])
  @@index([status])
}

model Challenge {
  id              String           @id @default(cuid())
  orderId         String           @unique
  userId          String
  firmName        String
  accountSize     String
  status          ChallengeStatus  @default(PENDING)
  currentPhase    Int              @default(1)
  startDate       DateTime?
  endDate         DateTime?
  targetProfit    Float?
  currentProfit   Float            @default(0)
  maxDrawdown     Float?
  currentDrawdown Float            @default(0)
  daysTraded      Int              @default(0)
  winRate         Float            @default(0)
  proofImages     String[]         // URLs to proof screenshots
  adminNotes      String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  order           Order            @relation(fields: [orderId], references: [id])
  user            User             @relation(fields: [userId], references: [id])
  dailyStats      DailyStat[]

  @@index([userId])
  @@index([status])
}

model DailyStat {
  id            String    @id @default(cuid())
  challengeId   String
  date          DateTime
  profit        Float
  loss          Float
  tradesCount   Int
  winCount      Int
  lossCount     Int
  notes         String?

  challenge     Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)

  @@index([challengeId])
}

model Payment {
  id              String        @id @default(cuid())
  orderId         String
  userId          String
  amount          Float
  currency        String        @default("USD")
  method          PaymentMethod
  stripePaymentId String?
  status          String        // succeeded, pending, failed
  invoiceUrl      String?
  createdAt       DateTime      @default(now())

  order           Order         @relation(fields: [orderId], references: [id])
  user            User          @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([orderId])
}

model Credential {
  id            String   @id @default(cuid())
  orderId       String
  platform      String   // MT4, MT5, cTrader, etc.
  server        String?
  loginId       String   // Encrypted
  password      String   // Encrypted
  notes         String?
  submittedAt   DateTime @default(now())

  order         Order    @relation(fields: [orderId], references: [id])

  @@index([orderId])
}

model Coupon {
  id              String    @id @default(cuid())
  code            String    @unique
  discountPercent Float?
  discountAmount  Float?
  maxUses         Int?
  usedCount       Int       @default(0)
  validFrom       DateTime  @default(now())
  validUntil      DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
}

model SupportTicket {
  id          String       @id @default(cuid())
  userId      String
  subject     String
  message     String
  status      TicketStatus @default(OPEN)
  priority    String       @default("medium")
  responses   Json[]       // Array of {sender, message, timestamp}
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user        User         @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String
  type      String   // info, success, warning, payment, challenge
  read      Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, read])
}

model BlogPost {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  excerpt     String
  content     String   // Markdown or HTML
  coverImage  String?
  author      String
  tags        String[]
  published   Boolean  @default(false)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([published])
}

model Testimonial {
  id        String   @id @default(cuid())
  name      String
  avatar    String?
  title     String   // e.g., "Passed $200K FTMO Challenge"
  content   String
  rating    Int      @default(5)
  verified  Boolean  @default(false)
  featured  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Referral {
  id            String   @id @default(cuid())
  referrerId    String
  referredEmail String
  orderId       String?
  commission    Float    @default(0)
  paid          Boolean  @default(false)
  createdAt     DateTime @default(now())

  referrer      User     @relation("referrer", fields: [referrerId], references: [id])

  @@index([referrerId])
}

model AdminLog {
  id        String   @id @default(cuid())
  adminId   String
  action    String
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())

  admin     User     @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([createdAt])
}

model SiteStats {
  id                String @id @default("global")
  totalClients      Int    @default(0)
  totalPayouts      Float  @default(0)
  challengesPassed  Int    @default(0)
  successRate       Float  @default(0)
  totalFundedAmount Float  @default(0)
}
```

---

## HOMEPAGE — SECTION-BY-SECTION BUILD INSTRUCTIONS

### 1. Navbar (`Navbar.tsx`)
- Fixed top, transparent background that transitions to `bg-black/80 backdrop-blur-xl` on scroll.
- Left: Phoenix logo (Image component, `/assets/logos/logo.png`) + "THE MARKET ARCHITECTS" text.
- Center: Nav links — Home, Services, Pricing, About, Blog, Contact.
- Right: "Login" (ghost button) + "Get Started" (red glow CTA button).
- Mobile: Hamburger menu that opens a full-screen overlay nav with stagger animations.
- Active link indicator: red underline with glow.

### 2. Hero Section (`HeroSection.tsx`)
- Full viewport height (`min-h-screen`).
- **Background layers** (bottom to top):
  1. Pure black base.
  2. `CandlestickBg.tsx` — animated SVG candlestick chart pattern that slowly scrolls/moves. Green and red candles, low opacity (0.08). Use `requestAnimationFrame` for smooth animation.
  3. `GradientOrb.tsx` — large radial gradient orb (dark red, `rgba(230,57,70,0.15)`) positioned top-right, gently pulsing.
  4. Subtle grid pattern overlay (`/assets/patterns/grid.svg` at 3% opacity).
- **Content** (centered, stagger-animated with framer-motion):
  - Small badge above headline: "🏆 #1 Prop Firm Challenge Passing Service" with gold border.
  - Main headline: `"We Pass Your Prop Firm Challenges."` — large (text-5xl md:text-7xl), bold, white. The word "Pass" should have a red gradient text effect.
  - Subheadline: `"Professional traders. Guaranteed results. Get funded without the stress."` — text-lg, text-secondary.
  - Two CTA buttons side by side:
    - "Start Your Challenge" → red glow button, links to `/dashboard/purchase`
    - "View Our Results" → outline/ghost button, scrolls to proof section
  - Below buttons: Trust micro-indicators row — "✓ 2,500+ Challenges Passed · ✓ $12M+ in Payouts · ✓ 94% Success Rate" — small text, text-secondary, with AnimatedCounter for numbers.
- **Floating elements**: Subtle TradingView-style mini charts floating in the background (pure decoration).

### 3. Trust Indicators Bar (`TrustIndicators.tsx`)
- Horizontal bar below hero, dark glass card spanning full width.
- 4 stat columns with AnimatedCounter (counts up on scroll-in):
  - "2,500+" Challenges Passed
  - "$12M+" Total Payouts
  - "94%" Success Rate
  - "500+" Active Clients
- Each stat has a small red icon above it (use Lucide icons: Trophy, DollarSign, TrendingUp, Users).
- Separator lines between stats. On mobile, 2x2 grid.

### 4. Services Overview (`ServicesOverview.tsx`)
- Section title: "Our Services" with red accent line below.
- 3 GlassCards in a row (stagger reveal):
  1. **Challenge Passing** — Icon: Target. Description of the service. "From $299" price tag. CTA button.
  2. **Account Management** — Icon: BarChart. Description. "From $499/mo". CTA button.
  3. **Account Growth** — Icon: TrendingUp. Description. "Custom pricing". CTA button.
- Cards have a subtle red border glow on hover.

### 5. How It Works (`HowItWorks.tsx`)
- Vertical animated timeline with 4 steps:
  1. "Choose Your Plan" — Select your prop firm and account size.
  2. "Submit Credentials" — Securely share your trading account details.
  3. "We Trade & Pass" — Our professional traders handle everything.
  4. "Get Funded" — Receive your funded account and start earning.
- Each step has a numbered circle (1–4) with a connecting vertical line.
- Line animates/fills red as user scrolls through the section.
- Each step reveals with a slide-in animation from alternating sides.

### 6. Payout Proof Showcase (`PayoutProof.tsx`)
- Section title: "Verified Results" with a "PROOF" badge.
- Masonry or grid gallery of payout screenshot cards.
- Each card: Glass card with image, firm name, amount, date.
- "View All Proof" button at bottom.
- Subtle auto-scrolling/marquee row of proof thumbnails at top of section.

### 7. Pricing Section (`PricingSection.tsx`)
- 3 pricing tiers in GlassCards:
  - **Starter** ($299): $25K–$50K challenges, basic features.
  - **Professional** ($599): $100K–$200K challenges, priority support, progress updates. Mark as "MOST POPULAR" with a gold badge.
  - **Elite** ($999): $200K+ challenges, VIP support, guaranteed pass or refund.
- Toggle for "Challenge Passing" vs "Account Management" pricing.
- Each card lists features with red checkmarks.
- CTA button on each card with red glow.
- "Custom plans available" note below.

### 8. Testimonials (`Testimonials.tsx`)
- Auto-playing carousel (or swipeable on mobile) of testimonial cards.
- Each card: Avatar, name, title ("Passed $100K FTMO Challenge"), star rating, quote.
- "Verified ✓" green badge on each.
- Infinite scroll/loop animation.

### 9. Live Notifications (`LiveNotifications.tsx`)
- Fixed bottom-left toast that periodically shows: "🎉 John D. just passed a $200K challenge!" 
- Cycles through fake/seeded notifications every 5–8 seconds.
- Slide-in animation, auto-dismiss after 4 seconds.
- Glass card style with green accent.

### 10. FAQ Section (`FAQSection.tsx`)
- Accordion-style FAQ.
- 8–10 common questions about prop firm challenge passing, security, guarantees, refunds.
- Smooth expand/collapse animation.
- Red accent on active/expanded item.

### 11. CTA Banner (`CTABanner.tsx`)
- Full-width section with gradient red-to-black background.
- Phoenix logo faintly in the background.
- Bold headline: "Ready to Get Funded?"
- Subtext + two CTA buttons.
- Animated particles or subtle glow effects.

### 12. Footer (`Footer.tsx`)
- Dark footer, 4 columns:
  - Column 1: Logo + brief description.
  - Column 2: Quick Links (Services, Pricing, About, Blog).
  - Column 3: Legal (Privacy, Terms, NDA, Refund Policy).
  - Column 4: Connect (WhatsApp, Discord, Telegram, Instagram, Twitter/X icons).
- Bottom bar: Copyright, "Built by The Market Architects".
- Social media icons with red hover glow.

---

## AUTHENTICATION PAGES

### Login (`/login`)
- Centered glass card on dark background with subtle candlestick pattern.
- Phoenix logo at top of card.
- Email + password fields with custom styled inputs.
- "Sign in with Google" button (styled dark with Google icon).
- "Forgot password?" link.
- "Don't have an account? Sign Up" link.
- Error/success toast notifications.

### Register (`/register`)
- Similar layout to login.
- Fields: Full name, email, password, confirm password.
- Google signup option.
- Referral code field (optional, pre-filled from URL param).
- Terms & conditions checkbox.
- Email verification flow after signup.

### Verify Email (`/verify-email`)
- Simple centered card: "Check your email" message with email icon animation.
- "Resend verification" button.

### Forgot/Reset Password
- Standard flow: Enter email → receive link → set new password.
- Clean, minimal glass card UI.

---

## CLIENT DASHBOARD

### Dashboard Layout (`dashboard/layout.tsx`)
- **Sidebar** (collapsible on mobile):
  - Phoenix logo at top.
  - Nav items with Lucide icons: Overview, My Challenges, Analytics, Purchase, Services, Payments, Credentials, Support, Referrals, Tools, Settings.
  - Active item: red background highlight.
  - Bottom: user avatar + name + logout.
- **Topbar**: 
  - Breadcrumb path.
  - Notification bell with unread count badge.
  - User avatar dropdown.
- **Content area**: Scrollable, with consistent padding.

### Dashboard Overview (`dashboard/page.tsx`)
- Welcome greeting with user name.
- 4 StatCards at top: Active Challenges, Total Profit, Success Rate, Referral Earnings.
- Active Challenges section: List of ChallengeCards with status, progress bar, firm name, account size.
- Recent Activity feed.
- Quick action buttons: "Buy New Service", "Submit Credentials", "Contact Support".

### Challenge Detail (`dashboard/challenges/[id]`)
- Full challenge info in glass card.
- Progress bar (visual phases: Phase 1 → Phase 2 → Funded).
- Daily P&L chart (Recharts area chart, green/red).
- Key metrics: Current profit, drawdown, win rate, days traded.
- Proof images gallery (uploaded by admin).
- Status timeline showing progression.

### Analytics Page (`dashboard/analytics`)
- Aggregate performance across all challenges.
- Charts: cumulative P&L, win rate over time, profit by month.
- Summary stats.

### Purchase Flow (`dashboard/purchase`)
- Multi-step form (4 steps with StepIndicator):
  1. **Select Service**: Challenge Passing / Account Management / Growth.
  2. **Choose Plan**: Card selection for tier + account size dropdown + firm name.
  3. **Account Details**: Form for firm credentials or details (encrypted).
  4. **Checkout**: Order summary + coupon code input + payment method selection → Stripe checkout.
- Each step is a separate panel with smooth slide transition.
- Form validation with Zod + React Hook Form.

### Payments Page (`dashboard/payments`)
- Table of all payments: Date, Order, Amount, Method, Status, Invoice.
- "Download Invoice" button on each row (generates PDF).
- Payment status badges (color-coded).

### Credentials Page (`dashboard/credentials`)
- Secure form to submit/update trading platform credentials.
- Fields: Platform (MT4/MT5/cTrader dropdown), Server, Login ID, Password.
- All credential fields encrypted before storage.
- Warning banner: "Your credentials are encrypted and stored securely."
- List of previously submitted credentials with edit/delete.

### Settings Page (`dashboard/settings`)
- Profile section: Name, email, avatar upload.
- Security section: Change password, enable/disable 2FA (TOTP).
- Notification preferences: Email, push, in-app toggles.

### Referral Page (`dashboard/referrals`)
- Unique referral link with copy button.
- Stats: Total referrals, earned commission, pending payouts.
- Table of referred users.
- "Share" buttons for WhatsApp, Twitter, email.

---

## ADMIN PANEL

### Admin Layout
- Separate sidebar with admin navigation.
- Role-guarded: Only `ADMIN` role users can access.

### Admin Dashboard (`admin/page.tsx`)
- Revenue metrics: Today, this week, this month, all time.
- Revenue chart (Recharts line chart, red line).
- Recent orders feed.
- Active challenges count by status.
- Quick stats: New users today, pending orders, open tickets.

### User Management (`admin/users`)
- Searchable, sortable table of all users.
- Columns: Name, email, role, orders count, total spent, joined date.
- Click into user detail: See all their orders, challenges, payments.
- Actions: Change role, disable account, send notification.

### Order Management (`admin/orders`)
- Table of all orders with filters (status, service type, date range).
- Click into order: Full details, change status, add notes.

### Challenge Management (`admin/challenges`)
- Table of active challenges.
- Click into challenge:
  - Update status (dropdown).
  - Update current profit, drawdown, win rate, days traded.
  - Add daily stats.
  - Upload proof images.
  - Add admin notes.
- Bulk update capabilities.

### Payout Management (`admin/payouts`)
- Track commissions owed to clients and referrers.
- Mark as paid, export CSV.

### Blog Management (`admin/blog`)
- List all posts, create new, edit existing.
- Markdown editor for content.
- Upload cover images.
- Publish/unpublish toggle.

### Coupon Management (`admin/coupons`)
- Create, edit, deactivate discount codes.
- Fields: Code, percentage/fixed discount, max uses, validity dates.

### Admin Logs (`admin/logs`)
- Chronological feed of all admin actions.
- Filterable by admin user, action type, date.

---

## API ARCHITECTURE

All API routes go in `src/app/api/`. Use Next.js Route Handlers. Apply these patterns:

1. **Authentication middleware**: Verify JWT/session on every protected route. Use `getServerSession()` from NextAuth.
2. **Admin middleware**: Additional role check for admin routes.
3. **Rate limiting**: Use `@upstash/ratelimit` or in-memory rate limiter on sensitive endpoints (login, register, payment).
4. **Input validation**: Zod schemas on every POST/PUT body.
5. **Error handling**: Consistent error response format: `{ error: string, code: string }`.
6. **Pagination**: All list endpoints support `?page=1&limit=20&sort=createdAt&order=desc`.

### Key API Endpoints

```
POST   /api/auth/register          — Register new user
POST   /api/auth/verify-email      — Verify email token
POST   /api/auth/forgot-password   — Send reset email
POST   /api/auth/reset-password    — Reset with token
POST   /api/auth/2fa/setup         — Generate TOTP secret
POST   /api/auth/2fa/verify        — Verify TOTP code

GET    /api/users/me               — Get current user profile
PATCH  /api/users/me               — Update profile
GET    /api/users/me/notifications  — Get notifications
PATCH  /api/users/me/notifications/:id — Mark as read

GET    /api/orders                  — List user's orders
POST   /api/orders                  — Create new order
GET    /api/orders/:id              — Order detail

GET    /api/challenges              — List user's challenges
GET    /api/challenges/:id          — Challenge detail + daily stats

POST   /api/payments/stripe         — Create Stripe checkout session
POST   /api/payments/webhook        — Stripe webhook handler

POST   /api/upload                  — Get presigned upload URL
POST   /api/credentials             — Submit encrypted credentials

GET    /api/coupons/validate?code=X — Validate coupon code

POST   /api/support                 — Create support ticket
GET    /api/support                 — List user's tickets
POST   /api/support/:id/reply       — Reply to ticket

GET    /api/referrals               — Get referral stats + list
GET    /api/referrals/link          — Get referral link

GET    /api/blog                    — List published posts
GET    /api/blog/:slug              — Single post

GET    /api/public/testimonials     — Get approved testimonials
GET    /api/public/stats            — Get site stats (for homepage)

# Admin endpoints (all prefixed /api/admin, require admin role)
GET    /api/admin/stats             — Revenue + user analytics
GET    /api/admin/users             — List all users
PATCH  /api/admin/users/:id         — Update user (role, status)
GET    /api/admin/orders            — List all orders
PATCH  /api/admin/orders/:id        — Update order status
GET    /api/admin/challenges        — List all challenges
PATCH  /api/admin/challenges/:id    — Update challenge progress
POST   /api/admin/challenges/:id/daily-stat — Add daily stat
POST   /api/admin/challenges/:id/proof — Upload proof image
GET    /api/admin/payouts           — List payouts
PATCH  /api/admin/payouts/:id       — Mark payout as paid
POST   /api/admin/blog              — Create blog post
PATCH  /api/admin/blog/:id          — Update blog post
POST   /api/admin/coupons           — Create coupon
PATCH  /api/admin/coupons/:id       — Update coupon
POST   /api/admin/notifications/send — Send notification to user(s)
GET    /api/admin/logs              — Activity logs
```

---

## TRADING WIDGETS & FEATURES

### TradingView Widget (`TradingViewWidget.tsx`)
- Embed TradingView advanced chart widget using their embed script.
- Dark theme, symbols: EURUSD, BTCUSD, XAUUSD.
- Used on dashboard tools page and as decorative element.

### Forex/Crypto Ticker (`ForexTicker.tsx`, `CryptoTicker.tsx`)
- Horizontal scrolling ticker bar showing live prices.
- Use TradingView ticker widget or a free API.
- Displayed at the top of the homepage (below navbar) or in dashboard.

### Profit Split Calculator (`ProfitSplitCalculator.tsx`)
- Interactive calculator tool:
  - Inputs: Account size, profit percentage, profit split ratio.
  - Output: Your earnings, firm's share, displayed with animated counters.
- Styled as a glass card with red accents.
- Slider inputs for a premium feel.

---

## COMMUNITY & SUPPORT

### WhatsApp Button (`WhatsAppButton.tsx`)
- Fixed bottom-right floating button (green WhatsApp icon).
- Opens WhatsApp chat link on click.
- Pulse animation to draw attention.

### Discord Integration
- Link to Discord server in footer and dashboard.
- Show member count badge if possible.

### Live Chat (`LiveChat.tsx`)
- Integration point for Tawk.to or Crisp chat widget.
- Load script in layout.

### Support Ticket System
- Dashboard page to submit and track tickets.
- Form: Subject, message, priority dropdown, file attachment.
- Thread-style conversation view for responses.

---

## MARKETING FEATURES

### Blog (`/blog`)
- Grid of blog cards with cover images, titles, excerpts.
- Category/tag filtering.
- Individual post pages with SEO meta tags.
- Share buttons.

### SEO
- Proper `metadata` exports on every page.
- OpenGraph and Twitter card meta tags.
- Structured data (JSON-LD) for organization schema.
- Sitemap generation.
- robots.txt.

### Live Social Proof Notifications
- As described in homepage section — cycles through recent achievements.

### Affiliate/Referral System
- Each user gets unique referral link.
- Referred user gets discount (coupon auto-applied).
- Referrer gets commission on successful purchase.
- Dashboard page to track earnings.

---

## SECURITY IMPLEMENTATION

1. **Authentication**: NextAuth.js with JWT strategy, HTTP-only cookies, CSRF protection.
2. **Credential encryption**: Use `crypto` module to AES-256-GCM encrypt trading credentials before storing in DB. Decrypt only when admin views.
3. **Rate limiting**: Apply to `/api/auth/*` endpoints (5 attempts/15 min), API endpoints (100 req/min).
4. **Input sanitization**: Zod validation on all inputs. Sanitize HTML in blog content.
5. **Admin logging**: Log every admin action to AdminLog table.
6. **CORS**: Restrict API to same-origin.
7. **Middleware** (`middleware.ts`):
   - Protect `/dashboard/*` routes — redirect to login if unauthenticated.
   - Protect `/admin/*` routes — redirect if not admin role.
   - Apply rate limiting headers.

---

## ENVIRONMENT VARIABLES

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/market_architects"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Resend (Email)
RESEND_API_KEY=""
EMAIL_FROM="noreply@themarketarchitects.com"

# S3 (File Upload)
S3_ENDPOINT=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET=""
S3_REGION=""

# Encryption
CREDENTIAL_ENCRYPTION_KEY="32-byte-hex-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="+1234567890"
NEXT_PUBLIC_DISCORD_INVITE="https://discord.gg/your-invite"
```

---

## DEPLOYMENT

### Docker Setup

`Dockerfile`:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/public ./public
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tma_user
      POSTGRES_PASSWORD: tma_secure_password
      POSTGRES_DB: market_architects
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
    env_file:
      - .env
    environment:
      DATABASE_URL: "postgresql://tma_user:tma_secure_password@db:5432/market_architects"

volumes:
  postgres_data:
```

### Deployment Commands
```bash
# Development
npm install
npx prisma migrate dev
npm run dev

# Production
docker-compose up -d --build

# Seed sample data
npx prisma db seed
```

---

## SEED DATA

Create `prisma/seed.ts` with:
- 1 admin user (admin@themarketarchitects.com)
- 5 sample client users
- 10 sample orders across different statuses
- 5 active challenges with daily stats
- 8 testimonials
- 5 blog posts
- 3 coupon codes
- Site stats populated
- Sample notifications

---

## CRITICAL IMPLEMENTATION NOTES

1. **Build ALL files completely** — no placeholders, no "TODO" comments, no "implement this later". Every component must be fully functional with real UI.
2. **The design must be stunning** — this is the #1 priority. Every pixel should feel premium, dark, and luxurious. Reference Binance, FTX (old), ByBit, TopStep dashboards for inspiration but make it unique.
3. **Animations everywhere** — scroll reveals, hover effects, page transitions, loading skeletons. Use framer-motion consistently.
4. **Glassmorphism on every card** — no flat solid backgrounds. Always use `backdrop-blur`, transparency, and subtle borders.
5. **Red is the accent, not the base** — black/dark gray dominates, red is used for CTAs, highlights, active states, and accents. Gold for premium badges.
6. **Typography hierarchy** — clear visual hierarchy. Section titles large and bold, subtitles muted, body text readable.
7. **The phoenix logo** must appear in the navbar, auth pages, dashboard sidebar, footer, and as a watermark in the hero/CTA sections.
8. **Mobile responsiveness** is non-negotiable — every page must look great on phone screens.
9. **Real interactivity** — forms must validate, buttons must navigate, modals must open/close, sidebars must collapse.
10. **Use TypeScript strictly** — no `any` types. Define proper interfaces for all data.

---

## EXECUTION ORDER

Build in this order:
1. Project setup (Next.js, Tailwind, Prisma, folder structure, env, fonts)
2. Design system (CSS variables, UI primitives: Button, GlassCard, Input, Badge, etc.)
3. Layout components (Navbar, Footer, DashboardSidebar, AdminSidebar)
4. Homepage (all sections, top to bottom)
5. Auth pages (login, register, verify, reset)
6. Prisma schema + migrations + seed
7. API routes (auth, then CRUD endpoints)
8. Client dashboard (all pages)
9. Purchase flow
10. Admin panel (all pages)
11. Trading widgets
12. Blog
13. Support system
14. Referral system
15. Final polish: animations, loading states, error boundaries, SEO meta
16. Docker + deployment config

Build every single file. Ship production-ready code.

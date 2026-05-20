# PROJECT INSTRUCTIONS — The Market Architects

You are building a full-stack Next.js 14 website for **"The Market Architects"** — a premium prop firm challenge passing and funded account management business. This is a modular build split across many conversations. Follow these rules in EVERY conversation.

---

## TECH STACK (locked — do not deviate)

- **Framework:** Next.js 14 (App Router), React 18, TypeScript (strict, no `any`)
- **Styling:** Tailwind CSS 3.4 + custom CSS variables + framer-motion
- **UI:** All components hand-crafted. NO shadcn/ui, NO MUI, NO Radix, NO Headless UI.
- **State:** Zustand (client), TanStack Query (server)
- **Forms:** React Hook Form + Zod
- **Auth:** NextAuth.js v5 (credentials + Google OAuth + magic links)
- **DB:** PostgreSQL + Prisma ORM
- **Payments:** Stripe (primary), stubs for PayPal/crypto
- **Email:** Resend
- **Charts:** Recharts
- **Icons:** Lucide React (import from `lucide-react`)
- **Fonts:** Inter (body), Space Grotesk (headings), JetBrains Mono (numbers/stats) — via `next/font/google`

---

## DESIGN SYSTEM (apply everywhere)

### Colors (CSS variables defined in globals.css)
```
Background:    #000000 (primary), #0A0A0A (secondary), #111111 (cards), #1A1A1A (elevated)
Accent Red:    #E63946 (primary), #FF1A2E (hover glow), #8B0000 (muted)
Gold:          #D4AF37 (premium badges, highlights)
Text:          #FFFFFF (primary), #A0A0A0 (secondary), #666666 (tertiary)
Borders:       #222222 (cards), rgba(255,255,255,0.08) (glass)
Status:        #00C853 (success/profit), #FF1744 (danger/loss)
Glass:         rgba(255,255,255,0.05) fill, rgba(255,255,255,0.08) border
```

### Design Rules
1. **Every card/panel uses glassmorphism**: `backdrop-blur-xl bg-white/5 border border-white/10`. Never flat solid backgrounds on cards.
2. **Red is accent only**: Black/dark dominates. Red for CTAs, active states, highlights, glow effects. Gold for premium badges.
3. **Neon glow on CTAs**: Primary buttons get `shadow-[0_0_30px_rgba(230,57,70,0.3)]` on hover.
4. **Framer-motion on everything**: Scroll reveals, hover effects, page transitions, stagger children, counter animations. Import from `framer-motion`.
5. **Typography hierarchy**: Section titles — large, bold, uppercase (`Space Grotesk`). Body — clean `Inter`. Stats/numbers — `JetBrains Mono` monospace.
6. **Mobile-first responsive**: Every component must work at 375px. Use Tailwind responsive prefixes (`md:`, `lg:`, `xl:`).
7. **No flat borders**: Prefer `border-white/10` or `border-[var(--color-border)]` with subtle opacity.

### Logo References
- Icon only: `/assets/logos/logo.png` or `/assets/logos/logo-icon.png`
- Full logo with text: `/assets/logos/logo-full.png`
- Always use `next/image` with proper width/height/alt.

---

## CODE STANDARDS

### File Conventions
- All components: functional, arrow function, default export.
- Use `"use client"` directive only when the component needs interactivity (hooks, events, framer-motion). Server components by default.
- File names: PascalCase for components (`GlassCard.tsx`), camelCase for utilities (`utils.ts`).
- Import paths: Use `@/` alias (configured in tsconfig) — e.g., `import { Button } from '@/components/ui/Button'`.

### TypeScript
- Strict mode. No `any`. Define interfaces for all props, API responses, and data shapes.
- All interfaces live in `@/types/index.ts` and are imported from there.
- Use `interface` for object shapes, `type` for unions/intersections.

### Component Structure
```tsx
"use client"; // only if needed

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ComponentProps } from "@/types";

interface MyComponentProps {
  // typed props
}

const MyComponent = ({ ...props }: MyComponentProps) => {
  return (
    // JSX
  );
};

export default MyComponent;
```

### API Route Structure
```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { someSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // ... logic
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Animation Patterns
- Scroll reveal wrapper: Use the `ScrollReveal` component from `@/components/effects/ScrollReveal`.
- Stagger children: `variants={{ container: { show: { transition: { staggerChildren: 0.1 } } }, item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } } }}`
- Page entry: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}`
- Hover scale on cards: `whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}`
- Button hover: `whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}`

---

## FOLDER MAP (for imports)

```
@/components/ui/          — Reusable primitives (Button, GlassCard, Input, Modal, etc.)
@/components/layout/      — Navbar, Footer, DashboardSidebar, AdminSidebar, Topbars
@/components/home/        — Homepage sections (HeroSection, Pricing, FAQ, etc.)
@/components/dashboard/   — Dashboard-specific components (ChallengeCard, PnLChart, etc.)
@/components/admin/       — Admin-specific components (UserTable, RevenueChart, etc.)
@/components/purchase/    — Purchase flow steps
@/components/trading/     — TradingView, tickers, calculator
@/components/support/     — Ticket system, chat, WhatsApp
@/components/blog/        — Blog card and content renderer
@/components/effects/     — Visual effects (CandlestickBg, ParticleField, GradientOrb, ScrollReveal)
@/components/providers/   — React context providers
@/lib/                    — Utilities, configs, helpers
@/hooks/                  — Custom React hooks
@/store/                  — Zustand stores
@/types/                  — TypeScript interfaces
```

---

## CONVERSATION WORKFLOW

Each conversation builds a specific Part (see BUILD PLAN). When the user says "Build Part X", follow this:

1. **Read the build plan** to know exactly which files are in that part.
2. **Write every file completely** — no TODO comments, no placeholders, no "implement later". Every component must have full JSX, full styling, full logic.
3. **Respect dependencies** — import from files built in earlier parts. If a dependency hasn't been built yet, note it and use a reasonable stub that matches the expected interface.
4. **Match the design system exactly** — glassmorphism cards, red accents, framer-motion animations, proper typography hierarchy.
5. **Deliver all files** in full, ready to paste into the project.

---

## KEY DATA (for consistent copy/content)

### Service Plans
| Plan | Price | Account Sizes | Features |
|------|-------|---------------|----------|
| Starter | $299 | $25K – $50K | Basic support, email updates, 14-day delivery |
| Professional | $599 | $100K – $200K | Priority support, daily updates, 10-day delivery, progress dashboard |
| Elite | $999 | $200K+ | VIP support, real-time updates, 7-day delivery, guaranteed pass or refund |

### Supported Firms
FTMO, MyForexFunds, The Funded Trader, True Forex Funds, TopStep, Apex Trader Funding, E8 Funding, FundedNext, Surge Trading, City Traders Imperium

### Homepage Stats (seed data)
- 2,500+ Challenges Passed
- $12M+ Total Payouts
- 94% Success Rate
- 500+ Active Clients

### Brand Voice
- Authoritative, confident, professional
- "We" language (team of experts)
- Emphasis on: trust, security, proven results, guaranteed outcomes
- Phoenix metaphor: rising, dominance, rebirth, transformation

---

## WHAT NOT TO DO

- ❌ Do NOT use shadcn/ui, Radix, Headless UI, or any component library
- ❌ Do NOT use `any` type in TypeScript
- ❌ Do NOT leave TODO/placeholder comments
- ❌ Do NOT use flat/solid card backgrounds — always glassmorphism
- ❌ Do NOT skip framer-motion animations on sections/cards
- ❌ Do NOT forget mobile responsiveness
- ❌ Do NOT use `pages/` router — App Router only
- ❌ Do NOT hardcode colors — use CSS variables or Tailwind config values
- ❌ Do NOT skip error states, loading states, or empty states
- ❌ Do NOT import from paths that don't exist yet — use the folder map above

import prisma from './prisma';

const AI_SENDER_ID = 'ai-assistant';
const AI_SENDER_NAME = 'AI Assistant';
const AI_SENDER_ROLE = 'ASSISTANT';

const STAFF_ROLES = ['MODERATOR', 'ADMIN', 'HEAD_ADMIN'];
const STAFF_TAKEOVER_MINUTES = 30;

const CONTACT_EMAIL = 'support@themarketarchitects.com';

interface KnowledgeBase {
  faqs: { question: string; answer: string }[];
  plans: { name: string; serviceType: string; description: string; price: number | null; features: string[] }[];
  firms: { name: string }[];
}

let cachedKB: KnowledgeBase | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60_000;

async function loadKnowledge(): Promise<KnowledgeBase> {
  if (cachedKB && Date.now() - cacheTime < CACHE_TTL) return cachedKB;
  const [faqs, plans, firms] = await Promise.all([
    prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.servicePlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.propFirm.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);
  cachedKB = { faqs, plans, firms };
  cacheTime = Date.now();
  return cachedKB;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some(k => n.includes(k));
}

function containsPhrase(text: string, phrases: string[]): boolean {
  const n = normalize(text);
  return phrases.some(p => n.includes(p));
}

function wordSetOverlap(msg: string, target: string): number {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'has', 'have', 'had', 'be', 'been', 'being', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'it', 'its', 'this', 'that', 'and', 'or', 'but', 'not', 'so', 'if', 'then', 'what', 'how', 'who', 'when', 'where', 'why', 'which', 'all', 'each', 'any', 'my', 'your', 'our', 'you', 'we', 'me', 'i']);
  const wordsA = new Set(normalize(msg).split(' ').filter(w => w.length > 1 && !stopWords.has(w)));
  const wordsB = new Set(normalize(target).split(' ').filter(w => w.length > 1 && !stopWords.has(w)));
  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) matches++;
    else {
      for (const wb of wordsB) {
        if ((w.length >= 4 && wb.startsWith(w.slice(0, -1))) || (wb.length >= 4 && w.startsWith(wb.slice(0, -1)))) {
          matches += 0.7;
          break;
        }
      }
    }
  }
  const maxSize = Math.max(wordsA.size, wordsB.size);
  if (maxSize === 0) return 0;
  return matches / maxSize;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type IntentResult = { intent: string; response: string; confidence: number };

// ── Intent detectors ────────────────────────────────────────────────────

function detectGreeting(msg: string): IntentResult | null {
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'whats up', 'sup', 'howdy', 'greetings', 'yo', 'hola', 'hii', 'hiii', 'heya', 'heyo', 'ello', 'helo', 'helloo', 'anyone there', 'is anyone there', 'anyone here', 'is anyone here', 'anybody there'];
  if (containsAny(msg, greetings) && normalize(msg).split(' ').length <= 6) {
    return {
      intent: 'greeting',
      response: pick([
        "Hi there! 👋 Welcome to The Market Architects. I can help you with questions about our services, pricing, prop firms, and more. What would you like to know?",
        "Hey! 👋 Thanks for reaching out to The Market Architects. I'm here to help — ask me about our services, plans, or how it all works!",
        "Hello! Welcome to The Market Architects. 👋 I can answer questions about our challenge passing, account management, pricing, and more. How can I help you today?",
      ]),
      confidence: 1,
    };
  }
  return null;
}

function detectThanks(msg: string): IntentResult | null {
  if (containsAny(msg, ['thank', 'thanks', 'thx', 'appreciate', 'ty', 'tysm', 'thank you'])) {
    return {
      intent: 'thanks',
      response: pick([
        "You're welcome! If you have any other questions, feel free to ask. We're here to help! 😊",
        "Happy to help! Let me know if there's anything else you'd like to know. 😊",
        "Glad I could help! Don't hesitate to reach out if you need anything else.",
      ]),
      confidence: 1,
    };
  }
  return null;
}

function detectGoodbye(msg: string): IntentResult | null {
  const words = normalize(msg).split(' ');
  if (containsAny(msg, ['bye', 'goodbye', 'see you', 'take care', 'gotta go', 'cya', 'goodnight', 'good night']) && words.length <= 6) {
    return {
      intent: 'goodbye',
      response: pick([
        "Thanks for chatting with us! If you need anything else in the future, don't hesitate to reach out. Have a great day! 🙌",
        "Take care! We're here whenever you need us. Have an awesome day! 👋",
        "Goodbye! Feel free to come back anytime you have questions. Have a great one! 🙌",
      ]),
      confidence: 1,
    };
  }
  return null;
}

function detectAffirmative(msg: string, lastAiIntent: string | null): IntentResult | null {
  const affirmatives = ['yes', 'yeah', 'yep', 'yea', 'sure', 'ok', 'okay', 'tell me more', 'more info', 'go on', 'continue', 'interested', 'yes please', 'sounds good', 'im interested', 'i am interested', 'absolutely', 'definitely'];
  if (!containsAny(msg, affirmatives) || normalize(msg).split(' ').length > 8) return null;

  const followUps: Record<string, string> = {
    service_challenge: "For Challenge Passing, you simply choose your prop firm, select your account size, and we handle the rest. Our traders follow the firm's rules carefully and aim to pass within 1-4 weeks. Check out our pricing page for the exact plan that fits your needs, or ask me about pricing!",
    service_management: "With Account Management, once your account is funded, our team trades it for you — following strict risk management rules. You keep most of the profits while we do the work. Ask me about pricing or how to get started!",
    service_growth: "Our Account Growth service is designed to steadily scale your funded account. We use proven strategies to grow your balance over time while staying within all risk limits. Want to know about pricing or how to begin?",
    services_general: "We offer three main services:\n\n• **Challenge Passing** — We pass your prop firm challenge for you\n• **Account Management** — We trade your funded account professionally\n• **Account Growth** — We scale your account balance over time\n\nWhich one interests you most?",
    pricing: "Would you like me to break down a specific plan, or would you prefer to chat with a team member who can recommend the best option for your situation?",
    prop_firms: "If you let me know which prop firm you're with, I can give you more specific information about what we can do for you!",
    how_it_works: "Ready to get started? Head to our pricing page to pick a plan, or ask me about anything specific — pricing, timeframes, prop firms, or security!",
    safety: "You can also check out client testimonials on our website to see real results from traders we've helped. Want to know more about our process or pricing?",
    timeframe: "The exact duration depends on your firm's rules (minimum trading days, profit targets, etc.). Our team works as efficiently as possible while staying within all rules. Want to know about a specific prop firm's requirements?",
    profit_split: "The profit split varies by plan — it's always clearly stated before you sign up, so no surprises. Would you like to see our current plans and their split details?",
  };

  if (lastAiIntent && followUps[lastAiIntent]) {
    return {
      intent: lastAiIntent + '_followup',
      response: followUps[lastAiIntent],
      confidence: 0.75,
    };
  }

  return {
    intent: 'affirm_generic',
    response: "Great! What would you like to know more about? I can help with:\n\n• Our services (Challenge Passing, Account Management, Account Growth)\n• Pricing and plans\n• Supported prop firms\n• How the process works\n• Payment methods\n\nJust let me know!",
    confidence: 0.6,
  };
}

function detectNegative(msg: string): IntentResult | null {
  const negatives = ['no', 'nope', 'nah', 'not really', 'no thanks', 'im good', 'im fine', 'all good', 'nothing else', 'thats all', 'thats it'];
  if (containsAny(msg, negatives) && normalize(msg).split(' ').length <= 6) {
    return {
      intent: 'negative',
      response: pick([
        "No worries! If you ever need help in the future, we're just a message away. Have a great day! 😊",
        "Alright! Feel free to come back anytime you have questions. We're always here to help! 👋",
      ]),
      confidence: 0.7,
    };
  }
  return null;
}

function detectContact(msg: string): IntentResult | null {
  if (containsAny(msg, ['contact', 'email', 'reach', 'get in touch', 'phone', 'call', 'whatsapp', 'discord', 'social media', 'instagram', 'telegram'])) {
    return {
      intent: 'contact',
      response: `You can reach our team at ${CONTACT_EMAIL}. You can also continue chatting here and a team member will respond as soon as possible. We're happy to help! 📩`,
      confidence: 0.9,
    };
  }
  return null;
}

function detectOrderStatus(msg: string): IntentResult | null {
  if (containsPhrase(msg, ['order status', 'my order', 'order update', 'track order', 'where is my order', 'order progress', 'check my order', 'update on my order', 'status of my order', 'wheres my order'])) {
    return {
      intent: 'order_status',
      response: pick([
        `For order-specific inquiries, a team member can help you best. They'll be with you shortly! You can also check your dashboard for the latest updates or reach us at ${CONTACT_EMAIL}.`,
        `I'd love to help with that! Order status details are best handled by our team — someone will be with you shortly. In the meantime, check your dashboard at /dashboard for live updates!`,
      ]),
      confidence: 0.85,
    };
  }
  return null;
}

function detectCredentials(msg: string): IntentResult | null {
  if (containsAny(msg, ['credentials', 'login details', 'password', 'account access', 'mt4', 'mt5', 'metatrader', 'platform access', 'trading account', 'how to connect', 'connect my account'])) {
    return {
      intent: 'credentials',
      response: "For account credentials and trading platform access, a team member will assist you shortly for security reasons. You can also check your dashboard — if credentials have been assigned, they'll appear there securely. 🔐",
      confidence: 0.85,
    };
  }
  return null;
}

function detectRefund(msg: string): IntentResult | null {
  if (containsAny(msg, ['refund', 'money back', 'cancel order', 'cancellation', 'chargeback', 'get my money back', 'cancel my'])) {
    return {
      intent: 'refund',
      response: `For refund and cancellation requests, a team member will assist you shortly with your specific case. You can also email us directly at ${CONTACT_EMAIL} for a faster response.`,
      confidence: 0.9,
    };
  }
  return null;
}

function detectPayment(msg: string): IntentResult | null {
  if (containsAny(msg, ['payment', 'pay', 'crypto', 'usdt', 'stripe', 'how to pay', 'payment method', 'bitcoin', 'checkout', 'credit card', 'debit card', 'bank transfer', 'wire', 'paypal', 'binance', 'trc20', 'bep20', 'erc20', 'tether'])) {
    return {
      intent: 'payment',
      response: pick([
        "We accept payments via **Stripe** (credit/debit cards) and **cryptocurrency** (USDT on BEP-20, TRC-20, and ERC-20 networks). You can select your preferred method during checkout. Need help with a specific payment?",
        "We support two payment methods:\n\n💳 **Stripe** — Credit and debit cards\n💰 **Crypto** — USDT on BEP-20, TRC-20, and ERC-20 networks\n\nYou can choose your preferred method when placing your order. Let me know if you have questions about either option!",
      ]),
      confidence: 0.85,
    };
  }
  return null;
}

function detectPricingIntent(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (!containsAny(msg, ['price', 'pricing', 'cost', 'how much', 'fee', 'rate', 'charge', 'afford', 'expensive', 'cheap', 'budget', 'discount', 'coupon', 'promo', 'deal', 'offer', 'what does it cost', 'total cost', 'money'])) {
    return null;
  }

  if (containsAny(msg, ['discount', 'coupon', 'promo', 'deal', 'offer', 'code'])) {
    return {
      intent: 'discount',
      response: "We occasionally run promotions and discount codes! If you have a coupon code, you can apply it during checkout. For current deals, check our website or ask a team member — they can let you know about any active offers. 🏷️",
      confidence: 0.85,
    };
  }

  if (kb.plans.length === 0) {
    return {
      intent: 'pricing',
      response: `For our current pricing and plans, please visit our pricing page or contact us at ${CONTACT_EMAIL}. A team member can also help you find the best plan for your needs!`,
      confidence: 0.8,
    };
  }

  const lines = kb.plans.map(p => {
    let line = `• **${p.name}** (${p.serviceType})`;
    if (p.price) line += ` — $${p.price}`;
    if (p.description) line += `\n  ${p.description}`;
    return line;
  });

  return {
    intent: 'pricing',
    response: `Here's an overview of our plans:\n\n${lines.join('\n\n')}\n\nVisit our pricing page for full details, or ask me about a specific plan!`,
    confidence: 0.9,
  };
}

function detectServiceIntent(msg: string, kb: KnowledgeBase): IntentResult | null {
  const serviceKeywords = ['service', 'what do you', 'what you offer', 'offer', 'provide', 'do you do', 'challenge passing', 'account management', 'account growth', 'funded', 'prop firm', 'what is this', 'what are you', 'about your', 'tell me about', 'help me with', 'can you help', 'what can you do'];
  if (!containsAny(msg, serviceKeywords)) return null;

  if (containsAny(msg, ['challenge pass', 'pass challenge', 'pass my challenge', 'challenge for me', 'pass the challenge', 'take my challenge', 'do my challenge'])) {
    const plan = kb.plans.find(p => normalize(p.serviceType).includes('challenge'));
    const extra = plan ? ` Our ${plan.name} plan starts at $${plan.price}.` : '';
    return {
      intent: 'service_challenge',
      response: `Our **Challenge Passing** service is one of our most popular! Our expert traders take on your prop firm challenge and pass it for you — so you can get funded without the stress.${extra}\n\nWe handle all the trading, follow the firm's rules carefully, and keep you updated through your dashboard. Want to know more?`,
      confidence: 0.9,
    };
  }

  if (containsAny(msg, ['account management', 'manage my account', 'manage account', 'managed account', 'trade for me', 'trade my account'])) {
    const plan = kb.plans.find(p => normalize(p.serviceType).includes('management'));
    const extra = plan ? ` Our ${plan.name} plan starts at $${plan.price}.` : '';
    return {
      intent: 'service_management',
      response: `With our **Account Management** service, our professional traders manage your funded account to maximize profits while keeping within drawdown limits.${extra}\n\nYou keep the majority of profits while we handle all the trading. Would you like more details?`,
      confidence: 0.9,
    };
  }

  if (containsAny(msg, ['account growth', 'grow account', 'grow my account', 'scaling', 'scale my account', 'grow my balance'])) {
    const plan = kb.plans.find(p => normalize(p.serviceType).includes('growth'));
    const extra = plan ? ` Our ${plan.name} plan starts at $${plan.price}.` : '';
    return {
      intent: 'service_growth',
      response: `Our **Account Growth** service helps scale your funded account steadily and safely, growing your balance over time with professional trading strategies.${extra}\n\nWe focus on consistent, sustainable growth while staying within all risk limits. Want to learn more?`,
      confidence: 0.9,
    };
  }

  if (kb.plans.length > 0) {
    const planSummary = kb.plans.map(p => {
      let line = `• **${p.name}** (${p.serviceType})`;
      if (p.price) line += ` — $${p.price}`;
      return line;
    }).join('\n');

    return {
      intent: 'services_general',
      response: `The Market Architects offers professional prop firm services:\n\n${planSummary}\n\nWould you like to know more about any specific service?`,
      confidence: 0.85,
    };
  }

  return {
    intent: 'services_general',
    response: "The Market Architects specializes in:\n\n• **Challenge Passing** — We pass your prop firm challenge for you\n• **Account Management** — We trade your funded account professionally\n• **Account Growth** — We scale your account balance over time\n\nWe help traders get funded and stay funded! Which service interests you?",
    confidence: 0.8,
  };
}

function detectPropFirmIntent(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (!containsAny(msg, ['prop firm', 'which firm', 'ftmo', 'fundednext', 'funded next', 'topstep', 'firm support', 'supported firm', 'compatible', 'mff', 'my forex funds', 'the5ers', 'the 5ers', 'true forex', 'trueforex', 'firms do you', 'firms you support', 'firms you work', 'evaluation', 'eval'])) {
    return null;
  }

  if (kb.firms.length > 0) {
    const firmList = kb.firms.map(f => `• ${f.name}`).join('\n');
    return {
      intent: 'prop_firms',
      response: `We work with these prop firms:\n\n${firmList}\n\nIf you don't see yours listed, reach out — we may still be able to help! Which firm are you interested in?`,
      confidence: 0.9,
    };
  }

  return {
    intent: 'prop_firms',
    response: "We support all major prop firms including FTMO, FundedNext, and many more. Let us know which firm you're with and we'll confirm we can help!",
    confidence: 0.8,
  };
}

function detectHowItWorks(msg: string): IntentResult | null {
  if (containsAny(msg, ['how does it work', 'how it works', 'process', 'steps', 'get started', 'how to order', 'how do i', 'how do you', 'walk me through', 'explain the process', 'what are the steps', 'how to begin', 'how to start', 'what happens after', 'next steps'])) {
    return {
      intent: 'how_it_works',
      response: "Here's how it works:\n\n1️⃣ **Choose your service** — Challenge Passing, Account Management, or Account Growth\n2️⃣ **Select your plan** — Pick your prop firm and account size\n3️⃣ **Complete payment** — Pay via Stripe or crypto (USDT)\n4️⃣ **Share credentials** — Securely provide your trading account access\n5️⃣ **Track progress** — Monitor everything from your dashboard in real time\n\nIt's that simple! Ready to get started?",
      confidence: 0.9,
    };
  }
  return null;
}

function detectSafety(msg: string): IntentResult | null {
  if (containsAny(msg, ['safe', 'trust', 'legit', 'legitimate', 'scam', 'secure', 'reliable', 'guarantee', 'risky', 'is this real', 'can i trust', 'trustworthy', 'verified', 'fraud', 'stolen', 'hack', 'security'])) {
    return {
      intent: 'safety',
      response: pick([
        "Great question! Your security is our top priority:\n\n🔒 **AES-256 encryption** for all trading credentials\n✅ **Proven track record** with hundreds of successful challenges\n👥 **Professional traders** with years of experience\n📊 **Real-time dashboard** so you can monitor progress\n\nCheck out our client testimonials for real results!",
        "We take security very seriously:\n\n• All credentials are encrypted with **military-grade AES-256 encryption**\n• Our team consists of **experienced, vetted professional traders**\n• We have a **proven track record** — check our testimonials!\n• You get **full visibility** through your real-time dashboard\n\nFeel free to ask anything else about our security measures!",
      ]),
      confidence: 0.85,
    };
  }
  return null;
}

function detectTimeframe(msg: string): IntentResult | null {
  if (containsAny(msg, ['how long', 'time frame', 'timeframe', 'duration', 'how many days', 'how many weeks', 'fast', 'quick', 'speed', 'turnaround', 'when will', 'estimated time', 'eta', 'how quickly'])) {
    return {
      intent: 'timeframe',
      response: "The timeframe depends on the challenge type and prop firm rules:\n\n⏱️ Most challenges are completed within **1-4 weeks**\n📋 It varies based on the firm's minimum trading days, profit targets, and market conditions\n🎯 We prioritize both speed and safety to pass your challenge successfully\n\nA team member can give you a more specific estimate for your situation! What prop firm are you with?",
      confidence: 0.8,
    };
  }
  return null;
}

function detectProfitSplit(msg: string): IntentResult | null {
  if (containsAny(msg, ['profit split', 'profit sharing', 'payout', 'withdrawal', 'profits', 'earnings', 'how much do i keep', 'split', 'revenue share', 'my share', 'your cut', 'take home'])) {
    return {
      intent: 'profit_split',
      response: "Profit splits depend on the specific service and plan you choose:\n\n💰 The split is **clearly defined upfront** — no hidden fees or surprises\n📊 You can view exact terms in your dashboard once set up\n📋 For managed accounts, you keep the majority of the profits\n\nWant to know the split for a specific plan? Ask me about pricing or a specific service!",
      confidence: 0.85,
    };
  }
  return null;
}

function detectReferral(msg: string): IntentResult | null {
  if (containsAny(msg, ['referral', 'refer a friend', 'referral program', 'affiliate', 'earn commission', 'refer someone', 'referral code', 'referral link', 'invite friends'])) {
    return {
      intent: 'referral',
      response: "Yes, we have a referral program! 🎉\n\nYou can earn commissions by referring friends to The Market Architects. Share your unique referral link from your dashboard, and when someone signs up and makes a purchase, you earn a reward.\n\nCheck your dashboard under the Referrals section for your link and earnings!",
      confidence: 0.9,
    };
  }
  return null;
}

function detectDashboard(msg: string): IntentResult | null {
  if (containsAny(msg, ['dashboard', 'my account', 'my profile', 'account settings', 'change password', 'update email', 'where can i see', 'how do i check', 'monitor', 'track my', 'view my', 'check my progress'])) {
    return {
      intent: 'dashboard',
      response: "You can manage everything from your dashboard! Here's what you'll find:\n\n📊 **Overview** — Your orders, challenges, and account status\n📈 **Challenges** — Real-time progress tracking\n💰 **Profit Splits** — Your earnings and payouts\n🎫 **Support Tickets** — Get help from our team\n⚙️ **Settings** — Update your profile, password, and 2FA\n\nJust head to /dashboard to get started!",
      confidence: 0.85,
    };
  }
  return null;
}

function detectResults(msg: string): IntentResult | null {
  if (containsAny(msg, ['track record', 'results', 'success rate', 'win rate', 'performance', 'proof', 'proof of results', 'testimonials', 'reviews', 'case study', 'portfolio', 'past results', 'show me results'])) {
    return {
      intent: 'results',
      response: "We have a strong track record of success! 📈\n\n• Check out the **payout proofs** and **client testimonials** on our homepage\n• Our professional traders have passed hundreds of challenges across all major prop firms\n• Real-time progress tracking keeps you in the loop at every step\n\nVisit our website to see what our clients are saying!",
      confidence: 0.85,
    };
  }
  return null;
}

function detectRisk(msg: string): IntentResult | null {
  if (containsAny(msg, ['drawdown', 'risk management', 'blow account', 'lose money', 'what if you fail', 'what if i fail', 'fail the challenge', 'max drawdown', 'daily drawdown', 'loss limit'])) {
    return {
      intent: 'risk',
      response: "We take risk management very seriously:\n\n🛡️ **Strict risk controls** — We follow every prop firm's rules precisely\n📉 **Drawdown monitoring** — Real-time tracking of daily and total drawdown limits\n⚙️ **Conservative approach** — We prioritize account safety over aggressive gains\n📊 **Full transparency** — Track everything live on your dashboard\n\nOur goal is to pass your challenge safely, not take unnecessary risks. Any other questions?",
      confidence: 0.9,
    };
  }
  return null;
}

function detectAccountSize(msg: string): IntentResult | null {
  if (containsAny(msg, ['account size', 'what size', 'minimum size', 'minimum account', '10k', '25k', '50k', '100k', '200k', 'account sizes', 'which sizes'])) {
    return {
      intent: 'account_size',
      response: "We support a range of account sizes depending on the prop firm! Common sizes include $10K, $25K, $50K, $100K, and $200K.\n\nThe price varies based on the size and firm. Check our pricing page for exact costs per size, or tell me your preferred firm and size and I'll help you find the right plan!",
      confidence: 0.85,
    };
  }
  return null;
}

function detectHumanAgent(msg: string): IntentResult | null {
  if (containsAny(msg, ['speak to a human', 'real person', 'talk to someone', 'human agent', 'live agent', 'speak to someone', 'need a person', 'real agent', 'talk to a person', 'staff', 'representative', 'support agent', 'live chat'])) {
    return {
      intent: 'human_agent',
      response: `Of course! A team member will be with you shortly. 👤\n\nIn the meantime, feel free to ask me any questions — I might be able to help right away! You can also reach us directly at ${CONTACT_EMAIL}.`,
      confidence: 0.95,
    };
  }
  return null;
}

function matchFAQ(msg: string, faqs: KnowledgeBase['faqs']): IntentResult | null {
  if (faqs.length === 0) return null;

  let bestMatch: { question: string; answer: string } | null = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const overlapScore = wordSetOverlap(msg, faq.question);

    const normalizedQ = normalize(faq.question);
    const normalizedMsg = normalize(msg);

    let containsScore = 0;
    if (normalizedMsg.length >= 8 && normalizedQ.includes(normalizedMsg)) {
      containsScore = 0.85;
    } else if (normalizedQ.length >= 8 && normalizedMsg.includes(normalizedQ)) {
      containsScore = 0.85;
    }

    const score = Math.max(overlapScore, containsScore);
    if (score > bestScore && score >= 0.35) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch) {
    return {
      intent: 'faq',
      response: bestMatch.answer,
      confidence: Math.min(bestScore + 0.1, 0.95),
    };
  }
  return null;
}

// ── Response generation ─────────────────────────────────────────────────

function generateResponse(userMessage: string, kb: KnowledgeBase, lastAiIntent: string | null): string {
  const msg = userMessage.trim();

  const checks: (IntentResult | null)[] = [
    detectGreeting(msg),
    detectThanks(msg),
    detectGoodbye(msg),
    detectHumanAgent(msg),
    detectContact(msg),
    detectRefund(msg),
    detectCredentials(msg),
    detectOrderStatus(msg),
    detectPayment(msg),
    detectRisk(msg),
    detectHowItWorks(msg),
    detectSafety(msg),
    detectTimeframe(msg),
    detectProfitSplit(msg),
    detectReferral(msg),
    detectDashboard(msg),
    detectResults(msg),
    detectAccountSize(msg),
    detectPricingIntent(msg, kb),
    detectServiceIntent(msg, kb),
    detectPropFirmIntent(msg, kb),
    matchFAQ(msg, kb.faqs),
    detectAffirmative(msg, lastAiIntent),
    detectNegative(msg),
  ];

  let best: IntentResult | null = null;
  for (const result of checks) {
    if (result && (!best || result.confidence > best.confidence)) {
      best = result;
    }
  }

  if (best && best.confidence >= 0.3) {
    return best.response;
  }

  return pick([
    `Thanks for your message! I wasn't able to find a specific answer for that, but a team member will be with you shortly to help. In the meantime, feel free to ask about our services, pricing, or supported prop firms!\n\nYou can also email us at ${CONTACT_EMAIL}.`,
    `I appreciate your message! Let me get a team member to help you with that — they'll be with you shortly. Meanwhile, I can answer questions about our services, pricing, how it works, or supported prop firms!\n\nOr email us at ${CONTACT_EMAIL}.`,
    `Good question! That's something our team can best help you with — someone will be with you soon. While you wait, feel free to ask me about our services, plans, or anything else!\n\nYou can also reach us at ${CONTACT_EMAIL}.`,
  ]);
}

// ── Staff takeover ──────────────────────────────────────────────────────

function shouldSkipAI(recentMessages: { senderRole: string; createdAt: Date }[]): boolean {
  const cutoff = new Date(Date.now() - STAFF_TAKEOVER_MINUTES * 60_000);
  return recentMessages.some(
    m => STAFF_ROLES.includes(m.senderRole) && m.createdAt > cutoff,
  );
}

function getLastAiIntent(recentMessages: { senderRole: string; body: string }[]): string | null {
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const m = recentMessages[i];
    if (m.senderRole !== AI_SENDER_ROLE) continue;

    const body = m.body;
    if (body.includes('Challenge Passing') && body.includes('pass') && !body.includes('Account Management')) return 'service_challenge';
    if (body.includes('Account Management') && !body.includes('Challenge Passing')) return 'service_management';
    if (body.includes('Account Growth') && !body.includes('Challenge Passing')) return 'service_growth';
    if (body.includes('three main services') || body.includes('professional prop firm services')) return 'services_general';
    if (body.includes('overview of our plans') || body.includes('pricing page')) return 'pricing';
    if (body.includes('work with these prop firms') || body.includes('major prop firms')) return 'prop_firms';
    if (body.includes('how it works') || body.includes('Choose your service')) return 'how_it_works';
    if (body.includes('AES-256') || body.includes('security is our top priority')) return 'safety';
    if (body.includes('1-4 weeks') || body.includes('timeframe')) return 'timeframe';
    if (body.includes('Profit splits') || body.includes('profit split')) return 'profit_split';
    return null;
  }
  return null;
}

// ── Main export ─────────────────────────────────────────────────────────

export async function generateAIResponse(
  conversationId: string,
  userMessage: string,
): Promise<void> {
  try {
    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    if (shouldSkipAI(recentMessages)) return;

    const lastAiIntent = getLastAiIntent(recentMessages);
    const kb = await loadKnowledge();
    const aiText = generateResponse(userMessage, kb, lastAiIntent);

    await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: AI_SENDER_ID,
        senderRole: AI_SENDER_ROLE,
        senderName: AI_SENDER_NAME,
        body: aiText,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: aiText.slice(0, 200),
        lastAt: new Date(),
        userUnread: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
  }
}

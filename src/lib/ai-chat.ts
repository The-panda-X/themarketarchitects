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
  if (containsAny(msg, ['thank', 'thanks', 'thx', 'appreciate', 'ty', 'tysm', 'thank you']) && normalize(msg).split(' ').length <= 10) {
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
    refund_policy: "The Elite Plan includes a 100% money-back guarantee. For Starter and Pro, you get a free retry instead. Want to compare all the plans side by side?",
    free_retry: "With the free retry, the only cost from our side is the initial service fee — no repeat charges. You would only need to pay the prop firm's evaluation fee again. Want to know which plan is best for your situation?",
    trader_types: "Senior traders are reserved for Elite plan clients and have our highest success rates. Would you like to see the full plan comparison or get started with Elite?",
    hidden_fees: "Just the plan price from us, and the prop firm's own evaluation fee. No hidden costs at all! Ready to pick a plan?",
    best_firms: "A team member can recommend the best firm based on your goals — fastest payout, easiest rules, or largest accounts. Want me to connect you with someone?",
    disqualification: "For detailed compliance information about a specific prop firm, a team member can walk you through their policies. Want to chat with someone about this?",
    public_reviews: "Check out our homepage for client testimonials and payout proofs! Want to know anything else about our services?",
    plan_comparison: "Would you like detailed pricing for a specific plan, or help choosing between them? A team member can also give personalized recommendations!",
    approval_time: "Most orders are reviewed within 24-48 hours, then trading starts right away. The challenge duration depends on the prop firm's rules. Which firm are you considering?",
    location: "Yes, we're based in New York, USA and serve clients worldwide! Want to know about our services, or is there something specific I can help with?",
    staff_identity: "Our team includes experienced traders, risk managers, and client support specialists — all based in New York. Want to know about our services or plans?",
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

function detectRefundPolicy(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (containsAny(msg, ['refund policy', 'money back guarantee', 'guarantee policy', 'refund work', 'how does refund', 'what is the refund', 'whats the refund', 'can i get refund', 'do you offer refund', 'is there a guarantee', 'money back if', 'refund if not passed', 'refund if challenge', 'guarantee if'])) {
    const planNames = kb.plans.map(p => p.name).join(', ') || 'Starter, Pro, and Elite';
    return {
      intent: 'refund_policy',
      response: `Great question about our refund policy! Here's how it works:\n\n🛡️ **Elite Plan** — Includes a **100% money-back guarantee** if the challenge is not passed within the given timeframe\n📋 **Pro & Starter Plans** — These plans include a **free retry** if the challenge is failed, but do not include a money-back guarantee\n\n💡 The guarantee means: if our team cannot pass your challenge within the agreed timeframe on the Elite plan, you receive a full refund of the service fee. For other plans, we retry at no extra cost.\n\nFor specific refund questions about your order, a team member can help with the details!`,
      confidence: 0.95,
    };
  }

  if (containsAny(msg, ['refund', 'money back', 'cancel order', 'cancellation', 'chargeback', 'get my money back', 'cancel my'])) {
    return {
      intent: 'refund',
      response: `For refund and cancellation requests, a team member will assist you shortly with your specific case. You can also email us directly at ${CONTACT_EMAIL} for a faster response.`,
      confidence: 0.9,
    };
  }
  return null;
}

function detectFreeRetry(msg: string): IntentResult | null {
  if (containsAny(msg, ['free retry', 'retry if fail', 'what if fail', 'challenge fail', 'if i fail', 'if it fails', 'failed challenge', 'do i repay', 'repay the', 'pay again', 'try again', 'second attempt', 'another attempt', 'what happens if fail', 'need to repay', 'risk is the challenge', 'only money', 'only risking', 'money im risking', 'money i risk', 'what do i risk', 'what am i risking'])) {
    return {
      intent: 'free_retry',
      response: "Great question about our retry policy! Here's how it works:\n\n🔄 **Free Retry** — If the challenge is failed, we retry it at **no additional cost from us**. You don't pay The Market Architects again.\n💰 **Prop Firm Cost** — You would only need to repurchase the challenge from the prop firm itself (their evaluation fee). We have no control over that cost.\n✅ **Your risk** — The only money you're risking is the prop firm's challenge fee + our one-time service fee. If we fail, you get a free retry from us.\n\n📌 **Elite Plan** also includes a 100% money-back guarantee on our service fee if the challenge isn't passed within the timeframe.\n\nWant to know more about a specific plan?",
      confidence: 0.92,
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
  if (!containsAny(msg, ['profit split', 'profit sharing', 'payout', 'withdrawal', 'profits', 'earnings', 'how much do i keep', 'split', 'revenue share', 'my share', 'your cut', 'take home', '80/20', '70/30', '60/40', '50/50'])) {
    return null;
  }

  if (containsAny(msg, ['80/20', '8020', 'eighty twenty'])) {
    return {
      intent: 'profit_split_elite',
      response: "The profit split varies by plan and is always clearly stated upfront:\n\n📊 **Elite Plan** — The profit split details (such as 80/20) are defined in your plan terms. The exact split depends on the prop firm and account type.\n📋 Each plan has its own split structure — you'll see the exact terms before you commit.\n💰 There are **no hidden fees** — what you see is what you get.\n\nFor the exact split on your specific plan, check the plan details on our pricing page or ask a team member for a personalized breakdown!",
      confidence: 0.9,
    };
  }

  return {
    intent: 'profit_split',
    response: "Profit splits depend on the specific service and plan you choose:\n\n💰 The split is **clearly defined upfront** — no hidden fees or surprises\n📊 You can view exact terms in your dashboard once set up\n📋 For managed accounts, you keep the majority of the profits\n\nOur plans (Starter, Pro, Elite) each have different split structures. Want to know the split for a specific plan?",
    confidence: 0.85,
  };
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

function detectTraderTypes(msg: string): IntentResult | null {
  if (containsAny(msg, ['senior trader', 'dedicated trader', 'what is a senior', 'what is a dedicated', 'difference between senior', 'difference between dedicated', 'senior vs dedicated', 'dedicated vs senior', 'type of trader', 'who trades', 'who will trade', 'trader assigned', 'which trader'])) {
    return {
      intent: 'trader_types',
      response: "Great question! Here's the difference between our trader tiers:\n\n👤 **Dedicated Trader** (Pro Plan) — A skilled, experienced trader is assigned to your account. They follow all prop firm rules and work to pass your challenge efficiently.\n\n⭐ **Senior Trader** (Elite Plan) — Our most experienced and top-performing traders. They have the highest success rates, handle the most complex challenges, and are prioritized for your account. Senior traders typically have years of professional trading experience.\n\n💡 **Key difference**: Senior traders have a proven track record of higher pass rates and faster completions. The Elite Plan's premium pricing reflects this higher expertise level.\n\nWant to compare the full plan features?",
      confidence: 0.93,
    };
  }
  return null;
}

function detectHiddenFees(msg: string): IntentResult | null {
  if (containsAny(msg, ['hidden fee', 'setup fee', 'management fee', 'service fee', 'additional cost', 'extra cost', 'extra fee', 'any other fee', 'other charges', 'initial fee', 'only cost', 'only pay', 'anything else to pay', 'additional charge', 'setup cost', 'management setup'])) {
    return {
      intent: 'hidden_fees',
      response: "No hidden fees! Here's what you pay:\n\n💰 **One-time service fee** — The plan price listed on our website (e.g., $380 for Elite). That's it from our side.\n🏢 **Prop firm challenge fee** — This is paid separately to the prop firm when you purchase/start the evaluation. This is not charged by us.\n\n✅ **No setup fees**\n✅ **No management fees**\n✅ **No monthly charges**\n✅ **No hidden costs**\n\nThe price you see on our pricing page is the total cost for our service. The only other cost is the prop firm's own evaluation fee. Any questions about a specific plan?",
      confidence: 0.93,
    };
  }
  return null;
}

function detectBestFirms(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (containsAny(msg, ['most success', 'best prop firm', 'which firm is best', 'recommended firm', 'recommend a firm', 'top firm', 'top 2', 'top 3', 'top firms', 'best firm to use', 'quickest payout', 'fastest payout', 'best payout', 'which firm do you recommend', 'highest success', 'best results'])) {
    const firmList = kb.firms.length > 0
      ? `\n\nWe currently work with: ${kb.firms.map(f => f.name).join(', ')}.`
      : '';

    return {
      intent: 'best_firms',
      response: `Great question! Our success rates and payout speed vary by prop firm. Here's what we can share:\n\n🏆 We have strong results across all our supported firms, but specific success rates and payout timelines depend on each firm's rules, minimum trading days, and payout processing times.\n\n⚡ For the **quickest payouts**, it depends on the firm — some process within days, others take 1-2 weeks after passing.\n\n💡 A team member can recommend the **best firm for your specific goals** — whether that's fastest payout, easiest rules, or largest account sizes.${firmList}\n\nWant to chat with a team member about which firm is best for you?`,
      confidence: 0.92,
    };
  }
  return null;
}

function detectDisqualification(msg: string): IntentResult | null {
  if (containsAny(msg, ['disqualif', 'disqualified', 'risk of disqualif', 'get disqualified', 'banned', 'account banned', 'violate rules', 'break rules', 'against rules', 'terms of service', 'tos violation', 'is it allowed', 'allowed to trade', 'trade on behalf', 'trade for clients', 'trade for me legal', 'permission to trade', 'legal to trade', 'regulation', 'agreement', 'proof of permission', 'compliance'])) {
    return {
      intent: 'disqualification',
      response: "This is an important question and we appreciate your diligence! Here's what you should know:\n\n📋 **Prop firm policies vary** — Each firm has its own terms of service regarding third-party trading. Some firms explicitly allow it, others have specific guidelines.\n\n🔒 **Our approach**:\n• We follow each prop firm's rules precisely\n• Our traders operate within all firm guidelines\n• We use professional risk management to avoid rule violations\n• We keep your credentials encrypted and secure\n\n⚠️ **Important**: For specific questions about a prop firm's policy on third-party trading, applicable regulations, or legal agreements, we recommend reviewing the firm's terms directly. A team member can walk you through the specifics for your chosen firm.\n\nThis is a detailed topic best handled by our team — someone will be with you shortly to address your compliance concerns!",
      confidence: 0.92,
    };
  }
  return null;
}

function detectPublicReviews(msg: string): IntentResult | null {
  if (containsAny(msg, ['public review', 'client review', 'customer review', 'where are the review', 'where can i see review', 'see reviews', 'read reviews', 'user review', 'buyer review', 'people who bought', 'bought the service', 'real review', 'honest review', 'verified review', 'trustpilot', 'google review'])) {
    return {
      intent: 'public_reviews',
      response: "You can find reviews and proof of our work in several places:\n\n⭐ **Website testimonials** — Real client testimonials are featured on our homepage\n💰 **Payout proofs** — Verified payout screenshots from clients on our website\n📊 **Dashboard results** — Once you're a client, you can see real-time challenge progress\n\n🔗 Check our website's homepage to see client testimonials and payout proofs. We're proud of our track record and happy to share results!\n\nWant to see specific examples? A team member can share more detailed case studies with you.",
      confidence: 0.92,
    };
  }
  return null;
}

function detectPlanComparison(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (containsAny(msg, ['compare plan', 'plan comparison', 'difference between plan', 'starter vs pro', 'pro vs elite', 'starter vs elite', 'which plan', 'best plan', 'plan difference', 'what about pro', 'what about starter', 'what about elite', 'elite plan', 'pro plan', 'starter plan', 'elite vs', 'vs pro', 'vs starter'])) {
    if (kb.plans.length > 0) {
      const planDetails = kb.plans.map(p => {
        let line = `**${p.name}** (${p.serviceType})`;
        if (p.price) line += ` — $${p.price}`;
        if (p.features && p.features.length > 0) {
          line += '\n' + p.features.slice(0, 5).map(f => `  ✓ ${f}`).join('\n');
        }
        return `• ${line}`;
      }).join('\n\n');

      return {
        intent: 'plan_comparison',
        response: `Here's a comparison of our plans:\n\n${planDetails}\n\n💡 **Key differences**: Higher-tier plans include more experienced traders, faster completion times, and additional guarantees (like the Elite Plan's money-back guarantee).\n\nWant to know more about a specific plan?`,
        confidence: 0.9,
      };
    }

    return {
      intent: 'plan_comparison',
      response: "We offer three main plans — **Starter**, **Pro**, and **Elite** — each with different features, trader levels, and guarantees:\n\n• **Starter** — Great entry point with a dedicated trader and free retry\n• **Pro** — Enhanced service with a dedicated trader and priority support\n• **Elite** — Premium service with a senior trader, 100% money-back guarantee, and fastest completion times\n\nVisit our pricing page for full details, or ask about a specific plan!",
      confidence: 0.88,
    };
  }
  return null;
}

function detectApprovalTime(msg: string): IntentResult | null {
  if (containsAny(msg, ['time to be approved', 'approval time', 'how long to get approved', 'how long for approval', 'when do i get approved', 'how fast approved', 'approved for the', 'start after payment', 'after i pay', 'when do you start', 'how soon', 'when does trading start', 'onboarding time'])) {
    return {
      intent: 'approval_time',
      response: "After you place your order and submit payment, here's what to expect:\n\n⏱️ **Order review** — Our team reviews your order typically within **24-48 hours**\n🔑 **Credentials setup** — Once approved, you'll provide your trading account credentials securely\n📈 **Trading begins** — Our trader starts working on your challenge right away\n\n📋 **Timeframes vary by prop firm** — Each firm has different minimum trading days:\n• Some require 5+ trading days minimum\n• Others require 10+ or 30+ days\n• Profit targets and drawdown limits also affect the timeline\n\nA team member can give you an exact estimate for your specific prop firm and account size!",
      confidence: 0.9,
    };
  }
  return null;
}

function detectLocation(msg: string): IntentResult | null {
  if (containsAny(msg, ['where are you located', 'where are you based', 'where is your office', 'your location', 'your address', 'office address', 'based in', 'located in', 'what country', 'which country', 'which city', 'what city', 'where do you operate', 'headquarters', 'head office', 'physical office', 'come to your office', 'visit your office', 'where is your company', 'where you from', 'where are you from'])) {
    return {
      intent: 'location',
      response: "The Market Architects is based in **New York, USA** 🇺🇸\n\nWe operate from New York and serve clients globally. However, for security reasons, our exact office location is not disclosed publicly.\n\nIf you need to reach us, the best way is through:\n• This live chat\n• Email: support@themarketarchitects.com\n\nHow can we help you today?",
      confidence: 0.95,
    };
  }
  return null;
}

function detectStaffIdentity(msg: string): IntentResult | null {
  if (containsAny(msg, ['who are you', 'who runs this', 'who owns this', 'who is the founder', 'who is the owner', 'who is the ceo', 'who is behind', 'your name', 'staff names', 'team members', 'who works here', 'who are the traders', 'your team name', 'who founded', 'founder name', 'owner name', 'ceo name', 'whos the owner', 'whos the founder', 'who manages', 'real name', 'your real name', 'who am i talking to', 'are you a bot', 'are you ai', 'are you human', 'are you real', 'who is this', 'can i know your name', 'identity'])) {
    if (containsAny(msg, ['are you a bot', 'are you ai', 'are you human', 'are you real'])) {
      return {
        intent: 'staff_identity',
        response: "I'm TMA's AI assistant! I can help answer your questions about our services, pricing, prop firms, and more. If you'd like to speak with a human team member, just let me know and someone will be with you shortly! 🤖\n\nThe Market Architects is a professional team of traders based in New York, USA. How can I help you?",
        confidence: 0.95,
      };
    }
    return {
      intent: 'staff_identity',
      response: "The Market Architects is a professional team of experienced traders and operations specialists based in **New York, USA** 🇺🇸\n\nFor security and privacy reasons, the identities of our staff and team members are kept confidential. This protects both our team and our clients.\n\nWhat we can share:\n• We're a team of professional traders with years of experience\n• We have dedicated traders, risk managers, and client support specialists\n• We've helped pass 2,400+ prop firm challenges\n\nIf you have questions about our services, I'm happy to help — or I can connect you with a team member!",
      confidence: 0.95,
    };
  }
  return null;
}

function detectHumanAgent(msg: string): IntentResult | null {
  if (containsAny(msg, ['speak to a human', 'real person', 'talk to someone', 'human agent', 'live agent', 'speak to someone', 'need a person', 'real agent', 'talk to a person', 'representative', 'support agent', 'live chat']) && normalize(msg).split(' ').length <= 20) {
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

// ── Complexity detection ────────────────────────────────────────────────

function isComplexQuery(msg: string): boolean {
  const words = normalize(msg).split(' ');
  const questionMarks = (msg.match(/\?/g) || []).length;
  if (questionMarks >= 3) return true;
  if (words.length >= 80 && questionMarks >= 2) return true;
  if (words.length >= 120) return true;
  return false;
}

function buildComplexQueryResponse(msg: string, kb: KnowledgeBase): string {
  const topics: string[] = [];
  if (containsAny(msg, ['refund', 'money back', 'guarantee', 'money back guarantee'])) topics.push('refund policy & guarantees');
  if (containsAny(msg, ['price', 'pricing', 'cost', 'fee', 'how much', '$'])) topics.push('pricing details');
  if (containsAny(msg, ['profit split', 'split', '80/20', '70/30', 'profit sharing'])) topics.push('profit split');
  if (containsAny(msg, ['prop firm', 'ftmo', 'fundednext', 'e8', 'funding pips', 'alpha capital', 'apex', 'goat funded', 'blue guardian', 'fundedfx', 'funded trader'])) topics.push('prop firm compatibility');
  if (containsAny(msg, ['time', 'timeframe', 'how long', 'approved', 'approval', 'duration'])) topics.push('timeframes & approval');
  if (containsAny(msg, ['elite', 'pro', 'starter', 'plan', 'senior trader', 'dedicated trader'])) topics.push('plan differences');
  if (containsAny(msg, ['retry', 'free retry', 'failed', 'fail'])) topics.push('retry policy');
  if (containsAny(msg, ['review', 'testimonial', 'proof', 'public review'])) topics.push('reviews & testimonials');
  if (containsAny(msg, ['risk', 'disqualif', 'safe', 'legal', 'regulation', 'agreement', 'permission', 'transparent'])) topics.push('compliance & safety');
  if (containsAny(msg, ['setup fee', 'hidden fee', 'additional cost', 'management fee', 'service fee'])) topics.push('fees');
  if (containsAny(msg, ['payout', 'quickest payout', 'fastest payout', 'success'])) topics.push('payout speed & success');

  const topicList = topics.length > 0
    ? `I can see you're asking about: **${topics.join(', ')}**.`
    : "You've raised some great points.";

  const planInfo = kb.plans.length > 0
    ? `\n\nHere's a quick overview of our plans:\n${kb.plans.map(p => {
        let line = `• **${p.name}** (${p.serviceType})`;
        if (p.price) line += ` — $${p.price}`;
        return line;
      }).join('\n')}`
    : '';

  const firmInfo = kb.firms.length > 0
    ? `\n\nWe currently work with: ${kb.firms.map(f => f.name).join(', ')}.`
    : '';

  return `Thank you for your detailed message! ${topicList}\n\nThese are great questions that deserve thorough, personalized answers. A team member will be with you shortly to address each of your points in detail.${planInfo}${firmInfo}\n\nIn the meantime, you can also:\n• Check our website for client testimonials and payout proofs\n• Browse our pricing page for plan comparisons\n• Email us at ${CONTACT_EMAIL}\n\nWe appreciate your diligence in researching before getting started — that's exactly the right approach! 🙌`;
}

// ── Response generation ─────────────────────────────────────────────────

function generateResponse(userMessage: string, kb: KnowledgeBase, lastAiIntent: string | null): string {
  const msg = userMessage.trim();

  if (isComplexQuery(msg)) {
    return buildComplexQueryResponse(msg, kb);
  }

  const checks: (IntentResult | null)[] = [
    detectGreeting(msg),
    detectThanks(msg),
    detectGoodbye(msg),
    detectStaffIdentity(msg),
    detectLocation(msg),
    detectHumanAgent(msg),
    detectContact(msg),
    detectRefundPolicy(msg, kb),
    detectFreeRetry(msg),
    detectCredentials(msg),
    detectOrderStatus(msg),
    detectPayment(msg),
    detectRisk(msg),
    detectDisqualification(msg),
    detectHowItWorks(msg),
    detectSafety(msg),
    detectTimeframe(msg),
    detectApprovalTime(msg),
    detectProfitSplit(msg),
    detectTraderTypes(msg),
    detectHiddenFees(msg),
    detectReferral(msg),
    detectDashboard(msg),
    detectResults(msg),
    detectPublicReviews(msg),
    detectAccountSize(msg),
    detectPlanComparison(msg, kb),
    detectBestFirms(msg, kb),
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
    if (body.includes('money-back guarantee') || body.includes('refund policy')) return 'refund_policy';
    if (body.includes('Free Retry') || body.includes('free retry')) return 'free_retry';
    if (body.includes('Senior Trader') || body.includes('Dedicated Trader')) return 'trader_types';
    if (body.includes('No hidden fees') || body.includes('setup fees')) return 'hidden_fees';
    if (body.includes('success rates') && body.includes('prop firm')) return 'best_firms';
    if (body.includes('disqualif') || body.includes('third-party trading')) return 'disqualification';
    if (body.includes('reviews') && body.includes('testimonials')) return 'public_reviews';
    if (body.includes('Starter') && body.includes('Pro') && body.includes('Elite')) return 'plan_comparison';
    if (body.includes('Order review') || body.includes('24-48 hours')) return 'approval_time';
    if (body.includes('New York') && body.includes('based')) return 'location';
    if (body.includes('identities') && body.includes('confidential')) return 'staff_identity';
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

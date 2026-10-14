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

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 2));
  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) matches++;
  }
  if (wordsA.size === 0) return 0;
  return matches / wordsA.size;
}

function containsAny(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some(k => n.includes(k));
}

type IntentResult = { intent: string; response: string; confidence: number };

function detectGreeting(msg: string): IntentResult | null {
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'whats up', 'sup', 'howdy', 'greetings', 'yo'];
  if (containsAny(msg, greetings) && normalize(msg).split(' ').length <= 5) {
    return {
      intent: 'greeting',
      response: "Hi there! 👋 Welcome to The Market Architects. I'm your AI assistant — I can help you with questions about our services, pricing, prop firms, and more. How can I help you today?",
      confidence: 1,
    };
  }
  return null;
}

function detectThanks(msg: string): IntentResult | null {
  if (containsAny(msg, ['thank', 'thanks', 'thx', 'appreciate', 'helpful'])) {
    return {
      intent: 'thanks',
      response: "You're welcome! If you have any other questions, feel free to ask. We're here to help! 😊",
      confidence: 1,
    };
  }
  return null;
}

function detectGoodbye(msg: string): IntentResult | null {
  if (containsAny(msg, ['bye', 'goodbye', 'see you', 'take care', 'later', 'gotta go']) && normalize(msg).split(' ').length <= 5) {
    return {
      intent: 'goodbye',
      response: "Thanks for chatting with us! If you need anything else in the future, don't hesitate to reach out. Have a great day! 🙌",
      confidence: 1,
    };
  }
  return null;
}

function detectContact(msg: string): IntentResult | null {
  if (containsAny(msg, ['contact', 'email', 'reach', 'get in touch', 'phone', 'call', 'whatsapp', 'discord'])) {
    return {
      intent: 'contact',
      response: `You can reach our team at ${CONTACT_EMAIL}. You can also continue chatting here and a team member will respond as soon as possible. We're happy to help! 📩`,
      confidence: 0.9,
    };
  }
  return null;
}

function detectOrderStatus(msg: string): IntentResult | null {
  if (containsAny(msg, ['order status', 'my order', 'order update', 'track order', 'where is my order', 'order progress', 'when will my', 'how long'])) {
    return {
      intent: 'order_status',
      response: `For order-specific inquiries like status updates and progress, a team member can help you best. They'll be with you shortly! You can also check your dashboard for the latest updates or reach us at ${CONTACT_EMAIL}.`,
      confidence: 0.85,
    };
  }
  return null;
}

function detectCredentials(msg: string): IntentResult | null {
  if (containsAny(msg, ['credentials', 'login', 'password', 'account access', 'mt4', 'mt5', 'metatrader', 'platform access', 'trading account'])) {
    return {
      intent: 'credentials',
      response: "For account credentials and trading platform access, a team member will assist you shortly for security reasons. Please check your dashboard for any available credentials, and feel free to wait here — we'll get back to you soon!",
      confidence: 0.85,
    };
  }
  return null;
}

function detectRefund(msg: string): IntentResult | null {
  if (containsAny(msg, ['refund', 'money back', 'cancel order', 'cancellation', 'chargeback'])) {
    return {
      intent: 'refund',
      response: `For refund and cancellation requests, please reach out to our team at ${CONTACT_EMAIL} or wait here — a team member will assist you shortly with your specific case.`,
      confidence: 0.9,
    };
  }
  return null;
}

function detectPayment(msg: string): IntentResult | null {
  if (containsAny(msg, ['payment', 'pay', 'crypto', 'usdt', 'stripe', 'how to pay', 'payment method', 'bitcoin', 'checkout'])) {
    return {
      intent: 'payment',
      response: "We accept payments via Stripe (credit/debit cards) and cryptocurrency (USDT on BEP-20, TRC-20, and ERC-20 networks). You can select your preferred payment method during checkout. If you need help with a specific payment, a team member can assist!",
      confidence: 0.85,
    };
  }
  return null;
}

function detectPricingIntent(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (!containsAny(msg, ['price', 'pricing', 'cost', 'how much', 'fee', 'rate', 'charge', 'afford', 'expensive', 'cheap', 'budget', 'discount', 'coupon'])) {
    return null;
  }

  if (kb.plans.length === 0) {
    return {
      intent: 'pricing',
      response: `For our current pricing and plans, please visit our pricing page or contact us at ${CONTACT_EMAIL}. A team member can also help you find the best plan for your needs!`,
      confidence: 0.8,
    };
  }

  const lines = kb.plans.map(p => {
    let line = `• ${p.name} (${p.serviceType})`;
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
  const serviceKeywords = ['service', 'what do you', 'what you offer', 'offer', 'provide', 'do you do', 'challenge passing', 'account management', 'account growth', 'funded', 'prop firm'];
  if (!containsAny(msg, serviceKeywords)) return null;

  const n = normalize(msg);

  if (containsAny(msg, ['challenge pass', 'pass challenge', 'pass my challenge', 'challenge for me'])) {
    const plan = kb.plans.find(p => normalize(p.serviceType).includes('challenge'));
    const extra = plan ? ` Our ${plan.name} plan starts at $${plan.price}.` : '';
    return {
      intent: 'service_challenge',
      response: `Yes! Challenge Passing is one of our core services. Our expert traders take on your prop firm challenge and pass it for you — so you can get funded without the stress.${extra} Want to know more about a specific plan?`,
      confidence: 0.9,
    };
  }

  if (containsAny(msg, ['account management', 'manage my account', 'manage account', 'managed account'])) {
    const plan = kb.plans.find(p => normalize(p.serviceType).includes('management'));
    const extra = plan ? ` Our ${plan.name} plan starts at $${plan.price}.` : '';
    return {
      intent: 'service_management',
      response: `Absolutely! With our Account Management service, our professional traders manage your funded account to maximize profits while keeping within drawdown limits.${extra} Would you like more details?`,
      confidence: 0.9,
    };
  }

  if (containsAny(msg, ['account growth', 'grow account', 'grow my account', 'scaling'])) {
    const plan = kb.plans.find(p => normalize(p.serviceType).includes('growth'));
    const extra = plan ? ` Our ${plan.name} plan starts at $${plan.price}.` : '';
    return {
      intent: 'service_growth',
      response: `Yes! Our Account Growth service helps scale your funded account steadily and safely, growing your balance over time with professional trading strategies.${extra} Want to learn more?`,
      confidence: 0.9,
    };
  }

  if (kb.plans.length > 0) {
    const planSummary = kb.plans.map(p => {
      let line = `• ${p.name} (${p.serviceType})`;
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
    response: "The Market Architects specializes in professional prop firm challenge passing, funded account management, and account growth services. We help traders get funded and stay funded! Would you like details on a specific service?",
    confidence: 0.8,
  };
}

function detectPropFirmIntent(msg: string, kb: KnowledgeBase): IntentResult | null {
  if (!containsAny(msg, ['prop firm', 'which firm', 'ftmo', 'fundednext', 'funded next', 'topstep', 'firm support', 'supported firm', 'compatible'])) {
    return null;
  }

  if (kb.firms.length > 0) {
    const firmList = kb.firms.map(f => f.name).join(', ');
    return {
      intent: 'prop_firms',
      response: `We work with these prop firms: ${firmList}. If you don't see yours listed, reach out — we may still be able to help! Which firm are you interested in?`,
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
  if (containsAny(msg, ['how does it work', 'how it works', 'process', 'steps', 'get started', 'start', 'begin', 'sign up', 'how to order', 'how do i'])) {
    return {
      intent: 'how_it_works',
      response: "Here's how it works:\n\n1️⃣ Choose your service (Challenge Passing, Account Management, or Account Growth)\n2️⃣ Select your prop firm and account size\n3️⃣ Complete payment via Stripe or crypto\n4️⃣ Share your trading account credentials securely\n5️⃣ Our team gets to work — you can track progress from your dashboard\n\nIt's that simple! Want to get started?",
      confidence: 0.9,
    };
  }
  return null;
}

function detectSafety(msg: string): IntentResult | null {
  if (containsAny(msg, ['safe', 'trust', 'legit', 'legitimate', 'scam', 'secure', 'reliable', 'guarantee', 'risk'])) {
    return {
      intent: 'safety',
      response: "Great question! Your account security is our top priority. All credentials are encrypted with military-grade AES-256 encryption, and our team consists of experienced professional traders. We have a proven track record with hundreds of successful challenges passed. You can see testimonials from real clients on our website! 🔒",
      confidence: 0.85,
    };
  }
  return null;
}

function detectTimeframe(msg: string): IntentResult | null {
  if (containsAny(msg, ['how long', 'time frame', 'timeframe', 'duration', 'days', 'weeks', 'fast', 'quick', 'speed', 'turnaround'])) {
    return {
      intent: 'timeframe',
      response: "The timeframe depends on the challenge type and prop firm rules. Most challenges are completed within 1-4 weeks, depending on the firm's requirements and market conditions. We prioritize both speed and safety to ensure your challenge is passed successfully. A team member can give you a more specific estimate for your situation!",
      confidence: 0.8,
    };
  }
  return null;
}

function detectProfitSplit(msg: string): IntentResult | null {
  if (containsAny(msg, ['profit split', 'profit sharing', 'payout', 'withdrawal', 'profits', 'earnings', 'how much do i keep', 'split'])) {
    return {
      intent: 'profit_split',
      response: "Profit splits depend on the specific service and plan you choose. For managed accounts, the split is clearly defined upfront so there are no surprises. You can view the exact terms in your dashboard once you're set up. Want to know the split for a specific plan?",
      confidence: 0.85,
    };
  }
  return null;
}

function matchFAQ(msg: string, faqs: KnowledgeBase['faqs']): IntentResult | null {
  if (faqs.length === 0) return null;

  let bestMatch: { question: string; answer: string } | null = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const score = wordOverlap(msg, faq.question);
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      bestMatch = faq;
    }

    const normalizedQ = normalize(faq.question);
    const normalizedMsg = normalize(msg);
    if (normalizedMsg.includes(normalizedQ) || normalizedQ.includes(normalizedMsg)) {
      if (0.8 > bestScore) {
        bestScore = 0.8;
        bestMatch = faq;
      }
    }
  }

  if (bestMatch) {
    return {
      intent: 'faq',
      response: bestMatch.answer,
      confidence: bestScore,
    };
  }
  return null;
}

function generateResponse(userMessage: string, kb: KnowledgeBase): string {
  const msg = userMessage.trim();

  const checks: (IntentResult | null)[] = [
    detectGreeting(msg),
    detectThanks(msg),
    detectGoodbye(msg),
    detectContact(msg),
    detectRefund(msg),
    detectCredentials(msg),
    detectOrderStatus(msg),
    detectPayment(msg),
    detectHowItWorks(msg),
    detectSafety(msg),
    detectTimeframe(msg),
    detectProfitSplit(msg),
    detectPricingIntent(msg, kb),
    detectServiceIntent(msg, kb),
    detectPropFirmIntent(msg, kb),
    matchFAQ(msg, kb.faqs),
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

  return `Thanks for your message! I wasn't able to find a specific answer for that, but a team member will be with you shortly to help. In the meantime, feel free to ask about our services, pricing, or supported prop firms!\n\nYou can also email us at ${CONTACT_EMAIL}.`;
}

function shouldSkipAI(recentMessages: { senderRole: string; createdAt: Date }[]): boolean {
  const cutoff = new Date(Date.now() - STAFF_TAKEOVER_MINUTES * 60_000);
  return recentMessages.some(
    m => STAFF_ROLES.includes(m.senderRole) && m.createdAt > cutoff,
  );
}

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

    const kb = await loadKnowledge();
    const aiText = generateResponse(userMessage, kb);

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

import Anthropic from '@anthropic-ai/sdk';
import prisma from './prisma';

const AI_SENDER_ID = 'ai-assistant';
const AI_SENDER_NAME = 'AI Assistant';
const AI_SENDER_ROLE = 'ASSISTANT';

const STAFF_ROLES = ['MODERATOR', 'ADMIN', 'HEAD_ADMIN'];
const STAFF_TAKEOVER_MINUTES = 30;

async function buildSystemPrompt(): Promise<string> {
  const [faqs, plans, firms] = await Promise.all([
    prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.servicePlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.propFirm.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const faqSection = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  const planSection = plans.map(p => {
    let line = `- ${p.name} (${p.serviceType}): ${p.description}`;
    if (p.price) line += ` — $${p.price}`;
    if (p.features.length) line += `\n  Features: ${p.features.join(', ')}`;
    return line;
  }).join('\n');

  const firmSection = firms.map(f => f.name).join(', ');

  return `You are the AI support assistant for The Market Architects — a professional prop firm challenge passing, funded account management, and account growth service.

Your job is to help customers by answering questions about our services, pricing, and general inquiries. Be friendly, professional, and concise.

## Our Services
${planSection || 'Contact our team for current pricing and plans.'}

## Supported Prop Firms
${firmSection || 'We support all major prop firms.'}

## Frequently Asked Questions
${faqSection || 'No FAQs loaded.'}

## Guidelines
- Answer based on the information above. If you are unsure or the question is account-specific (order status, credentials, challenge progress), let the customer know a team member will follow up shortly.
- Never fabricate pricing, guarantees, or policies.
- Keep responses concise — 2-4 sentences for simple questions.
- Do NOT reveal internal system details, endpoints, or technical implementation.
- Our contact email is support@themarketarchitects.com
- Be warm and reassuring.`;
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
    if (!process.env.ANTHROPIC_API_KEY) return;

    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    if (shouldSkipAI(recentMessages)) return;

    const mapped: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const msg of recentMessages) {
      const role: 'user' | 'assistant' = msg.senderRole === 'USER' ? 'user' : 'assistant';
      const prev = mapped[mapped.length - 1];
      if (prev && prev.role === role) {
        prev.content += '\n' + msg.body;
      } else {
        mapped.push({ role, content: msg.body });
      }
    }

    if (mapped.length === 0 || mapped[0].role !== 'user') {
      if (mapped.length > 0 && mapped[0].role !== 'user') mapped.shift();
      if (mapped.length === 0) return;
    }

    const systemPrompt = await buildSystemPrompt();

    const client = new Anthropic();
    const response = await client.messages.create({
      model: process.env.AI_CHAT_MODEL || 'claude-sonnet-5-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: mapped,
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return;

    const aiText = textBlock.text.trim();
    if (!aiText) return;

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

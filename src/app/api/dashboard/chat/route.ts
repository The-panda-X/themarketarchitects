export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

/** GET  – list user's conversations */
export async function GET() {
  try {
    const session = await requireAuth();
    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { lastAt: 'desc' },
    });
    return successResponse(conversations);
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST – start a new conversation (user → staff) */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { message, subject } = await req.json();

    if (!message?.trim()) return errorResponse('Message is required', 400);

    // Check if user already has an open conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId: session.user.id, isClosed: false },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          subject: subject || null,
          lastMessage: message.trim().slice(0, 200),
          staffUnread: 1,
          lastAt: new Date(),
        },
      });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        senderRole: 'USER',
        body: message.trim(),
      },
    });

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: message.trim().slice(0, 200),
        lastAt: new Date(),
        staffUnread: { increment: conversation.id ? 1 : 0 },
      },
    });

    return successResponse({ conversationId: conversation.id }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

/** GET – fetch messages for a conversation (user side) */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    });
    if (!conversation || conversation.userId !== session.user.id) {
      return errorResponse('Conversation not found', 404);
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: 'asc' },
    });

    // Mark staff messages as read & reset user unread count
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: params.id,
        senderRole: { not: 'USER' },
        read: false,
      },
      data: { read: true },
    });
    await prisma.conversation.update({
      where: { id: params.id },
      data: { userUnread: 0 },
    });

    return successResponse({ conversation, messages });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST – send a message (user side) */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { message } = await req.json();

    if (!message?.trim()) return errorResponse('Message is required', 400);

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    });
    if (!conversation || conversation.userId !== session.user.id) {
      return errorResponse('Conversation not found', 404);
    }
    if (conversation.isClosed) {
      return errorResponse('This conversation is closed', 400);
    }

    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        senderRole: 'USER',
        body: message.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessage: message.trim().slice(0, 200),
        lastAt: new Date(),
        staffUnread: { increment: 1 },
      },
    });

    return successResponse(msg, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

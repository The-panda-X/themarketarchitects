export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireModerator,
  getAuthSession,
  getSessionRole,
  handleApiError,
  successResponse,
  errorResponse,
} from '@/lib/api-helpers';

/** GET – fetch messages for a conversation (staff side) */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireModerator();

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    if (!conversation) return errorResponse('Conversation not found', 404);

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: 'asc' },
    });

    // Mark user messages as read & reset staff unread count
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: params.id,
        senderRole: 'USER',
        read: false,
      },
      data: { read: true },
    });
    await prisma.conversation.update({
      where: { id: params.id },
      data: { staffUnread: 0 },
    });

    return successResponse({ conversation, messages });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST – send a message (staff side) */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireModerator();
    const { message } = await req.json();

    if (!message?.trim()) return errorResponse('Message is required', 400);

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    });
    if (!conversation) return errorResponse('Conversation not found', 404);

    const role = getSessionRole(session as { user: { role?: string } });

    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        senderRole: role,
        body: message.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessage: message.trim().slice(0, 200),
        lastAt: new Date(),
        userUnread: { increment: 1 },
        isClosed: false,
      },
    });

    return successResponse(msg, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH – close/reopen conversation */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireModerator();
    const { isClosed } = await req.json();

    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: { isClosed: !!isClosed },
    });

    return successResponse(conversation);
  } catch (err) {
    return handleApiError(err);
  }
}

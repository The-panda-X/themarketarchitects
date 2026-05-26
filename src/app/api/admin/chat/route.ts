export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

/** GET – list all conversations for staff */
export async function GET() {
  try {
    await requireModerator();
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    return successResponse(conversations);
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST – staff initiates a new conversation (or reuses existing open one) */
export async function POST(req: NextRequest) {
  try {
    const session = await requireModerator();
    const staffId = (session as { user: { id: string } }).user.id;
    const staffRole = (session as { user: { role?: string } }).user.role ?? 'MODERATOR';

    const { userId, message } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return errorResponse('userId is required', 400);
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return errorResponse('message is required', 400);
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    // Check for existing open conversation with this user
    let conversation = await prisma.conversation.findFirst({
      where: { userId, isClosed: false },
      orderBy: { lastAt: 'desc' },
    });

    const trimmed = message.trim();

    if (conversation) {
      // Add message to existing conversation
      await prisma.$transaction([
        prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: staffId,
            senderRole: staffRole,
            body: trimmed,
          },
        }),
        prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: trimmed.slice(0, 200),
            lastAt: new Date(),
            userUnread: { increment: 1 },
          },
        }),
      ]);
    } else {
      // Create new conversation with first message
      conversation = await prisma.conversation.create({
        data: {
          userId,
          lastMessage: trimmed.slice(0, 200),
          lastAt: new Date(),
          userUnread: 1,
          staffUnread: 0,
          messages: {
            create: {
              senderId: staffId,
              senderRole: staffRole,
              body: trimmed,
            },
          },
        },
      });
    }

    return successResponse({ conversationId: conversation.id }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

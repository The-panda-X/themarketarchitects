/**
 * Head Admin endpoints to edit or delete an individual chat message.
 * Hard-deletes the row (the action is captured in AdminLog for audit).
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHeadAdmin();
    const { body } = await req.json();
    if (typeof body !== 'string' || !body.trim()) {
      return errorResponse('Message body is required', 400);
    }

    const existing = await prisma.chatMessage.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Message not found', 404);

    const updated = await prisma.chatMessage.update({
      where: { id: params.id },
      data: { body: body.trim(), editedAt: new Date() },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'EDIT_CHAT_MESSAGE',
        details: JSON.parse(JSON.stringify({
          messageId: params.id,
          conversationId: existing.conversationId,
          before: existing.body,
          after: updated.body,
        })),
      },
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHeadAdmin();

    const existing = await prisma.chatMessage.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Message not found', 404);

    await prisma.chatMessage.delete({ where: { id: params.id } });

    // If this was the last message in the conversation, recompute lastMessage/lastAt
    const remaining = await prisma.chatMessage.findFirst({
      where: { conversationId: existing.conversationId },
      orderBy: { createdAt: 'desc' },
    });
    await prisma.conversation.update({
      where: { id: existing.conversationId },
      data: {
        lastMessage: remaining ? remaining.body.slice(0, 200) : null,
        lastAt: remaining ? remaining.createdAt : new Date(),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'DELETE_CHAT_MESSAGE',
        details: JSON.parse(JSON.stringify({
          messageId: params.id,
          conversationId: existing.conversationId,
          body: existing.body,
          senderRole: existing.senderRole,
        })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

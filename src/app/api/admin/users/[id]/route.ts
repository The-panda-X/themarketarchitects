export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 5 },
        challenges: { orderBy: { createdAt: 'desc' }, take: 5 },
        tickets: { orderBy: { createdAt: 'desc' }, take: 5 },
        referrals: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!user) return errorResponse('User not found', 404);

    // Omit password hash
    const { passwordHash: _pw, ...safeUser } = user as typeof user & { passwordHash?: string };
    return successResponse(safeUser);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const { role, name } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role === 'USER' || role === 'ADMIN') updateData.role = role;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true },
    });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'UPDATE_USER',
        details: JSON.parse(JSON.stringify({ userId: params.id, changes: updateData })),
      },
    });

    return successResponse(user);
  } catch (err) {
    return handleApiError(err);
  }
}

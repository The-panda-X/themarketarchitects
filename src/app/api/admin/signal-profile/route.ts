export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireTrader, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

const nicknameSchema = z.object({
  signalNickname: z
    .string()
    .trim()
    .min(2, 'Nickname must be at least 2 characters')
    .max(30, 'Nickname must be 30 characters or less')
    .regex(/^[a-zA-Z0-9 _.-]+$/, 'Use only letters, numbers, spaces, dot, hyphen, underscore')
    .nullable(),
});

/** GET — fetch the current admin's signal nickname */
export async function GET() {
  try {
    const session = await requireTrader();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signalNickname: true, name: true, email: true, role: true, canOverrideRisk: true, canSendSignals: true },
    });
    const isHeadAdmin = user?.role === 'HEAD_ADMIN';
    const isTrader = user?.role === 'TRADER';
    return successResponse({
      signalNickname: user?.signalNickname ?? null,
      defaultDisplay: user?.name ?? user?.email ?? 'Admin',
      canOverrideRisk: isTrader ? (user?.canOverrideRisk ?? false) : true,
      canSendSignals: isHeadAdmin ? true : (user?.canSendSignals ?? false),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH — update the current admin's signal nickname */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTrader();
    const body = await req.json();
    const parsed = nicknameSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { signalNickname: parsed.data.signalNickname },
      select: { signalNickname: true },
    });

    return successResponse({ signalNickname: user.signalNickname });
  } catch (err) {
    return handleApiError(err);
  }
}

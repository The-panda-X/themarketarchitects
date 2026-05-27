/**
 * POST /api/admin/signals/send
 * ─────────────────────────────────────────────────────────────────────
 * Creates a new pending signal for the VPS Multi-Account Trade Manager.
 * The manager polls /api/ea/pending-signals every 5s and picks it up.
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { pair, direction, entry, sl, tp1, tp2, tp3, risk } = body;

    if (!pair || !direction || !sl || tp1 === undefined || tp1 === '' || tp1 === null) {
      return errorResponse('pair, direction, sl, and tp1 are required', 400);
    }

    const signal = await prisma.signal.create({
      data: {
        pair: pair.toUpperCase(),
        direction: direction.toUpperCase(),
        entry: entry ? parseFloat(entry) : 0,
        sl: parseFloat(sl),
        tp1: parseFloat(tp1),
        tp2: tp2 ? parseFloat(tp2) : null,
        tp3: tp3 ? parseFloat(tp3) : null,
        risk: risk ? parseFloat(risk) : 0,
        source: 'admin_panel',
        status: 'pending',
      },
    });

    return successResponse({ signalId: signal.id, status: 'pending' }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

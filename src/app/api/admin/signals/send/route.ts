/**
 * POST /api/admin/signals/send
 * ─────────────────────────────────────────────────────────────────────
 * Creates a new pending signal for the VPS Multi-Account Trade Manager.
 * The manager polls /api/ea/pending-signals every 5s and picks it up.
 * Signal is stamped with the sending admin's nickname.
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { resolveSignalSender } from '@/lib/signal-sender';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const { pair, direction, entry, sl, tp1, tp2, tp3, risk } = body;

    if (!pair || !direction || !sl || !tp1) {
      return errorResponse('pair, direction, sl, and tp1 are required', 400);
    }

    const parsedSl = parseFloat(sl);
    const parsedTp1 = parseFloat(tp1);
    const parsedEntry = entry ? parseFloat(entry) : 0;
    const parsedTp2 = tp2 ? parseFloat(tp2) : null;
    const parsedTp3 = tp3 ? parseFloat(tp3) : null;
    const parsedRisk = risk ? parseFloat(risk) : 0;

    if (isNaN(parsedSl) || isNaN(parsedTp1) || (entry && isNaN(parsedEntry))) {
      return errorResponse('sl, tp1, and entry must be valid numbers', 400);
    }
    if ((parsedTp2 !== null && isNaN(parsedTp2)) || (parsedTp3 !== null && isNaN(parsedTp3))) {
      return errorResponse('tp2 and tp3 must be valid numbers', 400);
    }

    const { senderId, senderNickname } = await resolveSignalSender(session.user.id);

    const signal = await prisma.signal.create({
      data: {
        pair: pair.toUpperCase(),
        direction: direction.toUpperCase(),
        entry: parsedEntry,
        sl: parsedSl,
        tp1: parsedTp1,
        tp2: parsedTp2,
        tp3: parsedTp3,
        risk: parsedRisk,
        source: 'admin_panel',
        status: 'pending',
        senderId,
        senderNickname,
      },
    });

    return successResponse({ signalId: signal.id, status: 'pending' }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/admin/signals/discord
 * ─────────────────────────────────────────────────────────────────────
 * Posts a signal to Discord via webhook. DiscordBridge.py picks it up
 * instantly and writes signal files for all EAs — near-zero latency.
 *
 * Also creates a VPS Signal record for tracking in the admin panel,
 * stamped with the sending admin's nickname.
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { postSignalToDiscord } from '@/lib/discord';
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

    const signalData = {
      pair: pair.toUpperCase(),
      direction: direction.toUpperCase(),
      entry: parsedEntry,
      sl: parsedSl,
      tp1: parsedTp1,
      tp2: parsedTp2,
      tp3: parsedTp3,
      risk: parsedRisk,
    };

    // Create DB record first so we have the signal ID for the Discord message
    const signal = await prisma.signal.create({
      data: {
        ...signalData,
        source: 'discord_webhook',
        status: 'pending',
        senderId,
        senderNickname,
      },
    });

    const result = await postSignalToDiscord({ ...signalData, senderNickname, signalId: signal.id });

    // Update status based on Discord delivery result
    await prisma.signal.update({
      where: { id: signal.id },
      data: {
        status: result.ok ? 'executed' : 'failed',
        executedAt: result.ok ? new Date() : null,
        errorMessage: result.error || null,
      },
    });

    if (!result.ok) {
      return errorResponse(`Discord delivery failed: ${result.error}`, 502);
    }

    return successResponse({ signalId: signal.id, status: 'executed', delivery: 'discord' }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

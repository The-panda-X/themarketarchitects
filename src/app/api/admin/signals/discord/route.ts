/**
 * POST /api/admin/signals/discord
 * ─────────────────────────────────────────────────────────────────────
 * Posts a signal to Discord via webhook. DiscordBridge.py picks it up
 * instantly and writes signal files for all EAs — near-zero latency.
 *
 * Also creates a VPS Signal record for tracking in the admin panel.
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { postSignalToDiscord } from '@/lib/discord';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { pair, direction, entry, sl, tp1, tp2, tp3, risk } = body;

    if (!pair || !direction || !sl) {
      return errorResponse('pair, direction, and sl are required', 400);
    }

    const signalData = {
      pair: pair.toUpperCase(),
      direction: direction.toUpperCase(),
      entry: entry ? parseFloat(entry) : 0,
      sl: parseFloat(sl),
      tp1: tp1 ? parseFloat(tp1) : 0,
      tp2: tp2 ? parseFloat(tp2) : null,
      tp3: tp3 ? parseFloat(tp3) : null,
      risk: risk ? parseFloat(risk) : 0,
    };

    const result = await postSignalToDiscord(signalData);

    const signal = await prisma.signal.create({
      data: {
        ...signalData,
        source: 'discord_webhook',
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

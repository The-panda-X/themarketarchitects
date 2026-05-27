/**
 * POST /api/ea/signal-ack
 * ─────────────────────────────────────────────────────────────────────
 * Called by the Multi-Account Trade Manager after executing a signal.
 * Updates the signal status and stores sent/failed counts.
 */
export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      id?: string;
      status?: string;
      sent?: number;
      failed?: number;
      error?: string;
    };

    const { id, status, sent, failed } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    if (!['executed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'status must be "executed" or "failed"' }, { status: 400 });
    }

    const signal = await prisma.signal.findUnique({ where: { id } });
    if (!signal) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    await prisma.signal.update({
      where: { id },
      data: {
        status,
        sentCount: sent ?? 0,
        failedCount: failed ?? 0,
        errorMessage: body.error || null,
        executedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ea/signal-ack]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

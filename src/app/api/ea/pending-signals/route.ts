/**
 * GET /api/ea/pending-signals
 * ─────────────────────────────────────────────────────────────────────
 * Polled by the Multi-Account Trade Manager every 5 seconds.
 * Returns all signals with status = 'pending'.
 */
export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

export async function GET(req: Request) {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pending = await prisma.signal.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    const signals = pending.map((s) => ({
      id: s.id,
      pair: s.pair,
      direction: s.direction,
      entry: s.entry,
      sl: s.sl,
      tp1: s.tp1,
      tp2: s.tp2 ?? null,
      tp3: s.tp3 ?? null,
      risk: s.risk,
      source: s.source,
      created_at: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ signals });
  } catch (err) {
    console.error('[ea/pending-signals]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

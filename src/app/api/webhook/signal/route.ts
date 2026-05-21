export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-webhook-secret');
  if (!WEBHOOK_SECRET || auth !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      pair, direction, entry, sl, tp1, tp2, tp3, riskPct,
      source = 'discord', rawMessage,
      deliveries, // array of { challengeId, status, skipReason }
    } = body;

    if (!pair || !direction || !sl) {
      return NextResponse.json({ error: 'Missing required fields: pair, direction, sl' }, { status: 400 });
    }

    const sent    = (deliveries ?? []).filter((d: { status: string }) => d.status === 'sent').length;
    const skipped = (deliveries ?? []).filter((d: { status: string }) => d.status === 'skipped').length;
    const failed  = (deliveries ?? []).filter((d: { status: string }) => d.status === 'failed').length;

    const signal = await prisma.signalLog.create({
      data: {
        pair:        pair.toUpperCase(),
        direction:   direction.toUpperCase(),
        entry:       entry ? parseFloat(entry) : null,
        sl:          parseFloat(sl),
        tp1:         tp1 ? parseFloat(tp1) : null,
        tp2:         tp2 ? parseFloat(tp2) : null,
        tp3:         tp3 ? parseFloat(tp3) : null,
        riskPct:     riskPct ? parseFloat(riskPct) : null,
        source,
        rawMessage:  rawMessage ?? null,
        totalSent:   sent,
        totalSkipped: skipped,
        totalFailed: failed,
        deliveries: {
          create: (deliveries ?? []).map((d: { challengeId: string; status: string; skipReason?: string }) => ({
            challengeId: d.challengeId,
            status:      d.status,
            skipReason:  d.skipReason ?? null,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, signalId: signal.id });
  } catch (err) {
    console.error('[webhook/signal]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Admin can also trigger a manual signal via POST /api/webhook/signal with adminKey
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

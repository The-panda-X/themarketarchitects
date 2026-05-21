export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Shared secret between the Python bridge and this endpoint
// Set WEBHOOK_SECRET in .env.local (any random string you choose)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

export async function GET(req: NextRequest) {
  // Validate shared secret
  const auth = req.headers.get('x-webhook-secret');
  if (!WEBHOOK_SECRET || auth !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'PHASE_1', 'PHASE_2'] },
        isPaused: false,
        signalFilePath: { not: null },
      },
      select: {
        id: true,
        firmName: true,
        accountSize: true,
        status: true,
        currentPhase: true,
        currentProfit: true,
        currentDrawdown: true,
        riskPct: true,
        dailyDDLimit: true,
        totalDDLimit: true,
        dailyCapPct: true,
        allowedPairs: true,
        signalFilePath: true,
        isPaused: true,
        user: { select: { email: true, name: true } },
        order: { select: { planName: true } },
      },
    });

    return NextResponse.json({ ok: true, clients: challenges });
  } catch (err) {
    console.error('[webhook/clients]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

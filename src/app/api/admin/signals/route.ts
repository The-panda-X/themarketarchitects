export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const [signals, total] = await Promise.all([
      prisma.signalLog.findMany({
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          deliveries: {
            include: {
              challenge: {
                select: {
                  id: true,
                  firmName: true,
                  accountSize: true,
                  user: { select: { email: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.signalLog.count(),
    ]);

    return successResponse({ data: signals, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

// Manual signal from admin panel
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { pair, direction, entry, sl, tp1, tp2, tp3, riskOverride } = body;

    if (!pair || !direction || !sl) {
      return errorResponse('pair, direction, and sl are required', 400);
    }

    // Fetch all active, unpaused accounts with a signal file path
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
        riskPct: true,
        dailyDDLimit: true,
        totalDDLimit: true,
        dailyCapPct: true,
        allowedPairs: true,
        signalFilePath: true,
        currentProfit: true,
        currentDrawdown: true,
      },
    });

    const deliveries: Array<{ challengeId: string; status: string; skipReason?: string }> = [];

    for (const ch of challenges) {
      // Check if this pair is allowed for this account
      if (ch.allowedPairs.length > 0 && !ch.allowedPairs.includes(pair.toUpperCase())) {
        deliveries.push({ challengeId: ch.id, status: 'skipped', skipReason: 'pair not in allowedPairs' });
        continue;
      }
      deliveries.push({ challengeId: ch.id, status: 'sent' });
    }

    const sent    = deliveries.filter(d => d.status === 'sent').length;
    const skipped = deliveries.filter(d => d.status === 'skipped').length;

    const signal = await prisma.signalLog.create({
      data: {
        pair:        pair.toUpperCase(),
        direction:   direction.toUpperCase(),
        entry:       entry ? parseFloat(entry) : null,
        sl:          parseFloat(sl),
        tp1:         tp1 ? parseFloat(tp1) : null,
        tp2:         tp2 ? parseFloat(tp2) : null,
        tp3:         tp3 ? parseFloat(tp3) : null,
        riskPct:     riskOverride ? parseFloat(riskOverride) : null,
        source:      'admin',
        totalSent:   sent,
        totalSkipped: skipped,
        deliveries: { create: deliveries },
      },
    });

    return successResponse({ signalId: signal.id, sent, skipped }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

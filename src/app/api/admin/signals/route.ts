export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTrader, requireModerator, requireHeadAdmin, handleApiError, successResponse, errorResponse, parsePagination, getSessionRole, isTraderRole } from '@/lib/api-helpers';
import { resolveSignalSender } from '@/lib/signal-sender';

export async function GET(req: NextRequest) {
  try {
    const session = await requireTrader();
    const role = getSessionRole(session as { user: { role?: string } });
    const trader = isTraderRole(role);
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const where: Record<string, unknown> = {};

    // Traders only see their own signals — match by senderId or senderNickname
    if (trader) {
      const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { signalNickname: true, staffNickname: true, name: true, email: true },
      });
      const possibleNames = [
        profile?.signalNickname,
        profile?.staffNickname,
        profile?.name,
      ].filter(Boolean) as string[];

      where.OR = [
        { senderId: session.user.id },
        ...(possibleNames.length > 0 ? [{ senderNickname: { in: possibleNames } }] : []),
      ];
    } else {
      const senderFilter = searchParams.get('sender');
      if (senderFilter) where.senderId = senderFilter;
    }

    const [signals, total] = await Promise.all([
      prisma.signalLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: trader ? undefined : {
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
      prisma.signalLog.count({ where }),
    ]);

    // Per-trader signal counts (not shown to traders — they only see their own)
    let traderStats: Array<{ senderId: string | null; senderNickname: string | null; totalSignals: number }> = [];
    if (!trader) {
      const grouped = await prisma.signalLog.groupBy({
        by: ['senderId', 'senderNickname'],
        _count: { id: true },
        where: { senderId: { not: null } },
        orderBy: { _count: { id: 'desc' } },
      });
      traderStats = grouped.map(t => ({
        senderId: t.senderId,
        senderNickname: t.senderNickname,
        totalSignals: t._count.id,
      }));
    }

    // Result breakdown for trader stats cards (uses same where filter)
    const resultCounts = trader
      ? await prisma.signalLog.groupBy({
          by: ['result'],
          _count: { id: true },
          where: { ...where, result: { not: null } },
        })
      : [];

    return successResponse({
      data: trader ? signals.map(s => ({ ...s, deliveries: undefined })) : signals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      traderStats,
      resultCounts: resultCounts.map(r => ({ result: r.result, count: r._count.id })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH – Update signal result (admin/moderator only) */
export async function PATCH(req: NextRequest) {
  try {
    await requireModerator();
    const body = await req.json();
    const { id, result, tp1Hit, tp2Hit, tp3Hit, slHit, pnl, closedAt, resultNote } = body;

    if (!id) return errorResponse('Signal id is required', 400);
    if (result && !['win', 'loss', 'breakeven'].includes(result)) {
      return errorResponse('result must be win, loss, or breakeven', 400);
    }

    const signal = await prisma.signalLog.findUnique({ where: { id } });
    if (!signal) return errorResponse('Signal not found', 404);

    const updated = await prisma.signalLog.update({
      where: { id },
      data: {
        ...(result !== undefined && { result }),
        ...(tp1Hit !== undefined && { tp1Hit }),
        ...(tp2Hit !== undefined && { tp2Hit }),
        ...(tp3Hit !== undefined && { tp3Hit }),
        ...(slHit !== undefined && { slHit }),
        ...(pnl !== undefined && { pnl: pnl ? parseFloat(pnl) : null }),
        ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
        ...(resultNote !== undefined && { resultNote }),
      },
    });

    return successResponse({ signal: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

// Manual signal from admin panel
export async function POST(req: NextRequest) {
  try {
    const session = await requireTrader();
    const body = await req.json();
    const { pair, direction, entry, sl, tp1, tp2, tp3, riskOverride } = body;

    const role = getSessionRole(session as { user: { role?: string } });
    const isHA = role === 'HEAD_ADMIN';

    if (!isHA) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { canSendSignals: true, canOverrideRisk: true },
      });
      if (!user?.canSendSignals) {
        return errorResponse('You do not have permission to send signals', 403);
      }
      if (riskOverride && isTraderRole(role) && !user?.canOverrideRisk) {
        return errorResponse('You do not have permission to override risk', 403);
      }
    }

    const { senderId, senderNickname } = await resolveSignalSender(session.user.id);

    if (!pair || !direction || !sl) {
      return errorResponse('pair, direction, and sl are required', 400);
    }

    // Fetch all active, unpaused accounts with an EA token
    const challenges = await prisma.challenge.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'PHASE_1', 'PHASE_2'] },
        isPaused: false,
        eaToken: { not: null },
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
        eaToken: true,
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
        tpMode:      (tp1 || tp2 || tp3) ? 'manual' : 'auto',
        totalSent:   sent,
        totalSkipped: skipped,
        senderId,
        senderNickname,
        deliveries: { create: deliveries },
      },
    });

    return successResponse({ signalId: signal.id, sent, skipped }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE – Head Admin can delete signal logs */
export async function DELETE(req: NextRequest) {
  try {
    await requireHeadAdmin();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      // Deliveries cascade-delete automatically
      const { count } = await prisma.signalLog.deleteMany();
      return successResponse({ deleted: count });
    }

    if (!id) return errorResponse('id or all=true is required', 400);

    await prisma.signalLog.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

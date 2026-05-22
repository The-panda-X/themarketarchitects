/**
 * POST /api/ea/report
 * ─────────────────────────────────────────────────────────────────────
 * Called by ChallengeReporter.mq5 every N seconds (and after each trade).
 * Updates the challenge metrics and triggers auto-status changes:
 *   • Drawdown ≥ maxDrawdown  →  FAILED  (user notified)
 *   • Profit ≥ targetProfit   →  PHASE_2 (phase 1) or PASSED (phase 2)
 *
 * Authentication: x-webhook-secret header  (same secret as Discord bridge)
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const secret = req.headers.get('x-webhook-secret');
    if (!secret || secret !== WEBHOOK_SECRET) {
      return errorResponse('Unauthorized', 401);
    }

    // ── Parse body ────────────────────────────────────────────────────
    const body = await req.json() as {
      token?:           string;   // preferred: unique EA token from admin panel
      signalFile?:      string;   // fallback: match by signal file name
      balance?:         number;
      equity?:          number;
      openProfit?:      number;
      currentProfit?:   number;   // closed profit $ from start balance
      currentDrawdown?: number;   // % drawdown from start balance
      winRate?:         number;
      daysTraded?:      number;
      totalTrades?:     number;
      winCount?:        number;
      openTrades?:      number;
    };

    const { token, signalFile } = body;
    if (!token && !signalFile) {
      return errorResponse('token or signalFile is required', 400);
    }

    // ── Find active challenge ─────────────────────────────────────────
    // Token takes priority (exact unique match); signalFile is the legacy fallback
    const challenge = token
      ? await prisma.challenge.findFirst({
          where: { eaToken: token, status: { notIn: ['FAILED', 'PASSED', 'FUNDED'] } },
        })
      : await prisma.challenge.findFirst({
          where: { signalFilePath: signalFile, status: { notIn: ['FAILED', 'PASSED', 'FUNDED'] } },
        });

    if (!challenge) {
      // 200 so EA doesn't spam error logs — just log and move on
      return successResponse({
        found:   false,
        message: token
          ? 'No active challenge found for this token. Check InpAccountToken or challenge status.'
          : 'No active challenge found for this signal file.',
      });
    }

    // ── Build update payload ──────────────────────────────────────────
    const updateData: Record<string, unknown> = {
      lastReportedAt: new Date(),
    };

    if (body.currentProfit   !== undefined) updateData.currentProfit   = body.currentProfit;
    if (body.currentDrawdown !== undefined) updateData.currentDrawdown = body.currentDrawdown;
    if (body.winRate         !== undefined) updateData.winRate         = body.winRate;
    if (body.daysTraded      !== undefined) updateData.daysTraded      = body.daysTraded;

    // ── Auto-status logic ─────────────────────────────────────────────
    let newStatus:        string | null = null;
    let notificationMsg:  string | null = null;
    let notificationType: string        = 'success';

    // AUTO-FAIL: drawdown hit the limit
    if (
      body.currentDrawdown !== undefined &&
      challenge.maxDrawdown !== null &&
      body.currentDrawdown >= challenge.maxDrawdown
    ) {
      newStatus             = 'FAILED';
      updateData.status     = 'FAILED';
      notificationMsg       =
        `Your challenge has been failed automatically. ` +
        `Drawdown reached ${body.currentDrawdown.toFixed(2)}% ` +
        `(max allowed: ${challenge.maxDrawdown.toFixed(1)}%).`;
      notificationType = 'warning';
    }

    // AUTO-ADVANCE/PASS: profit target reached (skip if already auto-failed above)
    if (
      !newStatus &&
      body.currentProfit !== undefined &&
      challenge.targetProfit !== null &&
      body.currentProfit >= challenge.targetProfit
    ) {
      if (challenge.currentPhase === 1) {
        newStatus             = 'PHASE_2';
        updateData.status     = 'PHASE_2';
        updateData.currentPhase = 2;
        notificationMsg       =
          `Phase 1 target reached! ` +
          `You made $${body.currentProfit.toFixed(0)} profit (target: $${challenge.targetProfit.toFixed(0)}). ` +
          `Phase 2 is now active.`;
      } else {
        newStatus             = 'PASSED';
        updateData.status     = 'PASSED';
        notificationMsg       =
          `Congratulations! You have passed the challenge. ` +
          `Final profit: $${body.currentProfit.toFixed(0)}.`;
      }
    }

    // ── Commit update ─────────────────────────────────────────────────
    await prisma.challenge.update({
      where: { id: challenge.id },
      data:  updateData,
    });

    // ── Notify user on status change ──────────────────────────────────
    if (notificationMsg) {
      await prisma.notification.create({
        data: {
          userId:  challenge.userId,
          title:   'Challenge Update',
          message: notificationMsg,
          type:    notificationType,
          link:    `/dashboard/challenges/${challenge.id}`,
        },
      });
    }

    return successResponse({
      challengeId: challenge.id,
      updated:     true,
      newStatus,
      metrics: {
        profit:   body.currentProfit,
        drawdown: body.currentDrawdown,
        winRate:  body.winRate,
        days:     body.daysTraded,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

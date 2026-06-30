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
      senderId: bodySenderId, senderNickname: bodyNickname, tpMode,
      deliveries,
    } = body;

    if (!pair || !direction || !sl) {
      return NextResponse.json({ error: 'Missing required fields: pair, direction, sl' }, { status: 400 });
    }

    // Resolve sender from the Signal record (created by the discord route before
    // DiscordBridge picks up the message). Try SID from rawMessage first, then
    // fall back to matching by pair + direction within a short time window.
    let resolvedSenderId = bodySenderId ?? null;
    let resolvedNickname = bodyNickname ?? null;

    if (!resolvedSenderId && rawMessage) {
      // Extract SID from rawMessage (format: "SID: cmqhsxbtp0000l404f6rmcc22")
      const sidMatch = (rawMessage as string).match(/SID:\s*(\S+)/);
      if (sidMatch) {
        const parentSignal = await prisma.signal.findUnique({
          where: { id: sidMatch[1] },
          select: { senderId: true, senderNickname: true },
        });
        if (parentSignal?.senderId) {
          resolvedSenderId = parentSignal.senderId;
          resolvedNickname = parentSignal.senderNickname;
        }
      }
    }

    // Fallback: extract sender name from rawMessage (last line starting with "- ")
    if (!resolvedSenderId && rawMessage) {
      const senderMatch = (rawMessage as string).match(/\n- (.+)$/);
      if (senderMatch) {
        const name = senderMatch[1].trim();
        if (!resolvedNickname) resolvedNickname = name;
        // Try to find the trader by name/nickname
        const trader = await prisma.user.findFirst({
          where: {
            role: { in: ['TRADER', 'MODERATOR', 'ADMIN', 'HEAD_ADMIN'] },
            OR: [
              { signalNickname: name },
              { staffNickname: name },
              { name: name },
            ],
          },
          select: { id: true },
        });
        if (trader) resolvedSenderId = trader.id;
      }
    }

    // Last resort: match to most recent Signal record by pair + direction (within 2 min)
    if (!resolvedSenderId) {
      const recentSignal = await prisma.signal.findFirst({
        where: {
          pair: pair.toUpperCase(),
          direction: direction.toUpperCase(),
          senderId: { not: null },
          createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        select: { senderId: true, senderNickname: true },
      });
      if (recentSignal?.senderId) {
        resolvedSenderId = recentSignal.senderId;
        resolvedNickname = resolvedNickname || recentSignal.senderNickname;
      }
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
        senderId:    resolvedSenderId,
        senderNickname: resolvedNickname,
        tpMode:      tpMode ?? 'manual',
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

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

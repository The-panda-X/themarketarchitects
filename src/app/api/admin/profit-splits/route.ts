export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();

    const splits = await prisma.profitSplit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user:      { select: { id: true, name: true, email: true } },
        challenge: { select: { firmName: true, accountSize: true } },
        order:     { select: { planName: true, serviceType: true } },
      },
    });

    const pending   = splits.filter((s) => s.status === 'PENDING').length;
    const confirmed = splits.filter((s) => s.status === 'CONFIRMED').length;
    const disputed  = splits.filter((s) => s.status === 'DISPUTED').length;
    const totalConfirmedAmount = splits
      .filter((s) => s.status === 'CONFIRMED')
      .reduce((sum, s) => sum + s.amountSent, 0);

    return successResponse({ splits, stats: { pending, confirmed, disputed, totalConfirmedAmount } });
  } catch (err) {
    return handleApiError(err);
  }
}

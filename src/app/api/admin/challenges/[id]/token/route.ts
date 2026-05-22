/**
 * POST /api/admin/challenges/[id]/token
 * Generates (or regenerates) a unique EA connection token for a challenge.
 * Returns { token } — admin copies this into the EA's InpAccountToken input.
 */
export const dynamic = 'force-dynamic';

import { randomBytes } from 'crypto';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

function generateToken(): string {
  // Format: TMA-XXXXXXXXXXXXXXXX (16 uppercase hex chars)
  // e.g.  TMA-A3F7B2C9D4E501F6
  return 'TMA-' + randomBytes(8).toString('hex').toUpperCase();
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!challenge) return errorResponse('Challenge not found', 404);

    // Keep generating until we get a unique one (collision is astronomically unlikely)
    let token = generateToken();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.challenge.findUnique({ where: { eaToken: token } });
      if (!existing) break;
      token = generateToken();
      attempts++;
    }

    const updated = await prisma.challenge.update({
      where: { id: params.id },
      data:  { eaToken: token },
      select: { eaToken: true },
    });

    return successResponse({ token: updated.eaToken });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await prisma.challenge.update({
      where: { id: params.id },
      data:  { eaToken: null },
    });
    return successResponse({ revoked: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import prisma from '@/lib/prisma';

/**
 * Resolve a staff member's display name shown to CLIENTS.
 * Order of preference: staffNickname → "Support Team" generic fallback.
 *
 * Never returns the real `name` or `email` — that would defeat the purpose of
 * hiding staff identity from clients.
 */
export async function resolveStaffDisplay(userId: string): Promise<{
  displayName: string;
  hasNickname: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { staffNickname: true },
  });

  const nickname = user?.staffNickname?.trim();
  if (nickname) {
    return { displayName: nickname, hasNickname: true };
  }

  return { displayName: 'Support Team', hasNickname: false };
}

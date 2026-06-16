import prisma from '@/lib/prisma';

/**
 * Resolve the signal sender's nickname for stamping on Signal/SignalLog rows
 * and for inclusion in the Discord webhook message.
 *
 * Preference order:
 *   1. signalNickname  — admin's Discord-specific tag, if set
 *   2. staffNickname   — admin's general client-facing display name
 *   3. name            — real name (only as last resort, only seen in admin-internal Discord)
 *   4. email prefix    — fallback
 *   5. 'Admin'         — final fallback
 */
export async function resolveSignalSender(userId: string): Promise<{
  senderId: string;
  senderNickname: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { signalNickname: true, staffNickname: true, name: true, email: true },
  });

  const senderNickname =
    user?.signalNickname?.trim() ||
    user?.staffNickname?.trim() ||
    user?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Admin';

  return { senderId: userId, senderNickname };
}

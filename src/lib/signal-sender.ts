import prisma from '@/lib/prisma';

/**
 * Resolve the signal sender's nickname for stamping on Signal/SignalLog rows
 * and for inclusion in the Discord webhook message.
 *
 * Falls back to the admin's name or email if no `signalNickname` is set.
 */
export async function resolveSignalSender(userId: string): Promise<{
  senderId: string;
  senderNickname: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { signalNickname: true, name: true, email: true },
  });

  const senderNickname =
    user?.signalNickname?.trim() ||
    user?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Admin';

  return { senderId: userId, senderNickname };
}

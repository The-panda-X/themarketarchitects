import prisma from '@/lib/prisma';

/**
 * Send a notification to all admin/moderator staff members.
 * Used when events require admin attention (new orders, payment proofs, etc.)
 */
export async function notifyAdmins({
  title,
  message,
  type = 'info',
  link,
}: {
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['HEAD_ADMIN', 'ADMIN', 'MODERATOR'] } },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title,
        message,
        type,
        link,
      })),
    });
  } catch (err) {
    // Best-effort — don't let notification failure break the main flow
    console.error('Failed to notify admins:', err);
  }
}

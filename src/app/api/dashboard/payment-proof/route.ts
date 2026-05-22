export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('orderId') as string | null;
    const network = formData.get('network') as string | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });

    // Verify order belongs to this user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() ?? 'png';
    const filename = `proof_${orderId}_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const proofUrl = `/uploads/proofs/${filename}`;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        proofImage: proofUrl,
        paymentNetwork: network ?? 'Unknown',
        notes: `Crypto payment proof submitted. Network: ${network ?? 'Unknown'}.`,
      },
    });

    // Notify admin via a system notification (using a special userId convention)
    // Also update user notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Payment Proof Submitted',
        message: `Your payment proof for order #${orderId.slice(-8).toUpperCase()} has been submitted. We'll verify within 24 hours.`,
        type: 'info',
        link: '/dashboard/payments',
      },
    });

    return NextResponse.json({ success: true, proofUrl });
  } catch (err) {
    return handleApiError(err);
  }
}

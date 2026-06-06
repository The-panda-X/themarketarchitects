export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { contactFormSchema } from '@/lib/validations';
import { formLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 contact submissions per minute per IP
    const { success } = formLimiter.check(getClientIp(req));
    if (!success) return errorResponse('Too many requests. Please try again later.', 429);

    const body = await req.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { name, email, subject, message } = parsed.data;

    await prisma.notification.create({
      data: {
        userId: 'system',
        title: `Contact: ${subject}`,
        message: `From ${name} (${email}): ${message.substring(0, 200)}`,
        type: 'info',
      },
    });

    console.log('[Contact Form]', { name, email, subject, message: message.substring(0, 100) });

    return successResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

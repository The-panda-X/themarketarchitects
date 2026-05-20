export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return errorResponse('All fields are required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email address', 400);
    }

    // Send notification to support email using the existing email utility
    // In production you would use a dedicated sendContactEmail function
    // For now we log and return success (email would be sent via Resend)
    console.log('[Contact Form]', { name, email, subject, message: message.substring(0, 100) });

    return successResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

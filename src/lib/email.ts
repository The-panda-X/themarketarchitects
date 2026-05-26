import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@themarketarchitects.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const SITE_NAME = 'The Market Architects';

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your email address',
    html: emailTemplate({
      title: 'Verify Your Email',
      body: `
        <p>Welcome to ${SITE_NAME}! Please verify your email address by clicking the button below.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a>
        <p style="margin-top:16px;font-size:14px;color:#9ca3af;">If you didn't create an account, you can safely ignore this email.</p>
      `,
    }),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your password',
    html: emailTemplate({
      title: 'Reset Your Password',
      body: `
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
        <p style="margin-top:16px;font-size:14px;color:#9ca3af;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    }),
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: { orderId: string; planName: string; amount: number }
) {
  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Order Confirmed — ${orderDetails.planName}`,
    html: emailTemplate({
      title: 'Order Confirmed',
      body: `
        <p>Your order has been confirmed and our team is getting started.</p>
        <div style="background:#1a1a2e;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Order ID:</strong> ${escapeHtml(orderDetails.orderId)}</p>
          <p style="margin:4px 0;"><strong>Plan:</strong> ${escapeHtml(orderDetails.planName)}</p>
          <p style="margin:4px 0;"><strong>Amount:</strong> $${orderDetails.amount.toFixed(2)}</p>
        </div>
        <p>You can track your progress from your <a href="${APP_URL}/dashboard" style="color:#dc2626;">dashboard</a>.</p>
      `,
    }),
  });
}

export async function sendChallengeUpdateEmail(
  email: string,
  details: { challengeId: string; status: string; message: string }
) {
  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Challenge Update — ${details.status}`,
    html: emailTemplate({
      title: 'Challenge Update',
      body: `
        <p>${escapeHtml(details.message)}</p>
        <p>View full details on your <a href="${APP_URL}/dashboard/challenges/${details.challengeId}" style="color:#dc2626;">dashboard</a>.</p>
      `,
    }),
  });
}

export async function send2FACode(email: string, code: string) {
  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `${code} is your verification code`,
    html: emailTemplate({
      title: 'Login Verification Code',
      body: `
        <p>Your two-factor authentication code is:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:8px;color:#fff;background:#1a1a2e;padding:16px 32px;border-radius:12px;border:1px solid rgba(220,38,38,0.3);">${escapeHtml(code)}</span>
        </div>
        <p style="font-size:14px;color:#9ca3af;">This code expires in <strong>10 minutes</strong>. If you didn't try to log in, someone may be trying to access your account — consider changing your password.</p>
      `,
    }),
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailTemplate({ title, body }: { title: string; body: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0a0a1a;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#dc2626;font-size:24px;margin:0;">${SITE_NAME}</h1>
        </div>
        <div style="background:#12121e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:32px;color:#e5e7eb;">
          <h2 style="color:#fff;margin-top:0;">${title}</h2>
          ${body}
        </div>
        <div style="text-align:center;margin-top:32px;font-size:12px;color:#6b7280;">
          <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

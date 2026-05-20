export const dynamic = 'force-dynamic';
﻿import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { constructWebhookEvent } from '@/lib/stripe';
import { sendOrderConfirmationEmail } from '@/lib/email';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const { orderId, userId } = checkoutSession.metadata ?? {};

        if (!orderId || !userId) break;

        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        });

        await prisma.payment.create({
          data: {
            orderId,
            userId,
            amount: (checkoutSession.amount_total ?? 0) / 100,
            currency: checkoutSession.currency?.toUpperCase() ?? 'USD',
            method: 'STRIPE',
            stripePaymentId: checkoutSession.payment_intent as string,
            status: 'succeeded',
          },
        });

        await prisma.notification.create({
          data: {
            userId,
            title: 'Payment Confirmed',
            message: `Your order for ${order.planName} has been confirmed. Our team will begin shortly.`,
            type: 'payment',
            link: `/dashboard/payments`,
          },
        });

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        if (user) {
          await sendOrderConfirmationEmail(user.email, {
            orderId: order.id,
            planName: order.planName,
            amount: order.totalAmount,
          });
        }

        // Handle referral commission if applicable
        if (user) {
          const referrer = await prisma.referral.findFirst({
            where: { referredEmail: user.email, orderId: null },
          });
          if (referrer) {
            const commission = order.totalAmount * 0.1; // 10% commission
            await prisma.referral.update({
              where: { id: referrer.id },
              data: { orderId, commission },
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PENDING_PAYMENT' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

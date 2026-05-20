'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import useToast from '@/hooks/useToast';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { addToast } = useToast();

  async function handleResend() {
    if (!email) {
      addToast('No email address provided', 'error');
      return;
    }

    setResending(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        addToast('Verification email sent!', 'success');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to resend', 'error');
      }
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setResending(false);
    }
  }

  return (
    <GlassCard variant="strong" padding="none">
      <div className="p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/assets/logos/logo.png"
              alt="The Market Architects"
              width={48}
              height={48}
            />
          </Link>
        </div>

        {/* Animated mail icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center mb-6"
        >
          <div className="h-20 w-20 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mail className="h-10 w-10 text-accent-primary" />
            </motion.div>
          </div>
        </motion.div>

        <h1 className="text-xl font-semibold mb-2">Check Your Email</h1>
        <p className="text-sm text-text-tertiary mb-2 max-w-xs mx-auto">
          We&apos;ve sent a verification link to
        </p>
        {email && (
          <p className="text-sm font-medium text-text-primary mb-6">{email}</p>
        )}
        <p className="text-xs text-text-tertiary mb-8 max-w-xs mx-auto">
          Click the link in the email to verify your account. Check your spam folder if you don&apos;t see it.
        </p>

        <Button
          variant="secondary"
          onClick={handleResend}
          loading={resending}
          icon={<RefreshCw className="h-4 w-4" />}
          className="mb-4"
        >
          Resend Verification Email
        </Button>

        <p className="text-sm text-text-tertiary">
          <Link href="/login" className="text-accent-primary hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </GlassCard>
  );
}

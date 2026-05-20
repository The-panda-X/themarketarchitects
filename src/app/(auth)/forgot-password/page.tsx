'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import useToast from '@/hooks/useToast';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const result = await res.json();
        addToast(result.error || 'Failed to send reset email', 'error');
      }
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard variant="strong" padding="none">
      <div className="p-8">
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

        {sent ? (
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <Mail className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Check Your Email</h1>
            <p className="text-sm text-text-tertiary mb-1">
              We&apos;ve sent a password reset link to
            </p>
            <p className="text-sm font-medium text-text-primary mb-6">
              {getValues('email')}
            </p>
            <Link href="/login">
              <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-center mb-1">
              Forgot Password?
            </h1>
            <p className="text-sm text-text-tertiary text-center mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                glow
                loading={loading}
              >
                Send Reset Link
              </Button>
            </form>

            <p className="text-sm text-text-tertiary text-center mt-6">
              <Link
                href="/login"
                className="text-accent-primary hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </GlassCard>
  );
}

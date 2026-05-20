'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import useToast from '@/hooks/useToast';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const result = await res.json();
        addToast(result.error || 'Failed to reset password', 'error');
      }
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <GlassCard variant="strong" padding="lg" className="text-center">
        <h1 className="text-xl font-semibold mb-2">Invalid Link</h1>
        <p className="text-sm text-text-tertiary mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password">
          <Button variant="primary">Request New Link</Button>
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="strong" padding="none">
      <div className="p-8">
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

        {success ? (
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Password Reset!</h1>
            <p className="text-sm text-text-tertiary">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-center mb-1">
              Set New Password
            </h1>
            <p className="text-sm text-text-tertiary text-center mb-8">
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('token')} />

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'Hide' : 'Show'} passwords
              </button>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                glow
                loading={loading}
              >
                Reset Password
              </Button>
            </form>
          </>
        )}
      </div>
    </GlassCard>
  );
}

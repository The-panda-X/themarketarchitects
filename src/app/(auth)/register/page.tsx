'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Eye, EyeOff, Gift } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import useToast from '@/hooks/useToast';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const refCode = searchParams.get('ref') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: refCode,
      acceptTerms: false as unknown as true,
    },
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          referralCode: data.referralCode,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        addToast(result.error || 'Registration failed', 'error');
        return;
      }

      if (result.data?.emailVerified) {
        addToast('Account created! You can now sign in.', 'success');
        router.push('/login');
      } else {
        addToast('Account created! Please check your email.', 'success');
        router.push('/verify-email?email=' + encodeURIComponent(data.email));
      }
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <GlassCard variant="strong" padding="none">
      <div className="p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/assets/logos/logo.png"
              alt="The Market Architects"
              width={52}
              height={52}
              style={{ filter: 'drop-shadow(0 0 10px rgba(230,57,70,0.55))' }}
            />
            <span className="text-base font-heading font-bold tracking-wide leading-tight">
              THE MARKET<br />
              <span className="text-accent-primary">ARCHITECTS</span>
            </span>
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-center mb-1">Create Account</h1>
        <p className="text-sm text-text-tertiary text-center mb-8">
          Join thousands of funded traders
        </p>

        {/* Google */}
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={handleGoogleSignIn}
          className="mb-6"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          }
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs text-text-tertiary uppercase">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            icon={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 characters"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat your password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPassword ? 'Hide' : 'Show'} passwords
            </button>
          </div>

          <Input
            label="Referral Code (Optional)"
            placeholder="Enter referral code"
            icon={<Gift className="h-4 w-4" />}
            error={errors.referralCode?.message}
            {...register('referralCode')}
          />

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register('acceptTerms')}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-accent-primary focus:ring-[rgba(230,57,70,0.30)] focus:ring-offset-0"
            />
            <span className="text-xs text-text-tertiary leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-accent-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-accent-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-danger -mt-2">{errors.acceptTerms.message}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            glow
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-sm text-text-tertiary text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-primary hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </GlassCard>
  );
}

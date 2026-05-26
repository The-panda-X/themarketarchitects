'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Shield, Save, ShieldCheck, ShieldOff, Loader2, Mail } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import useToast from '@/hooks/useToast';
import {
  updateProfileSchema,
  changePasswordSchema,
  createPasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type CreatePasswordInput,
} from '@/lib/validations';
import useAuth from '@/hooks/useAuth';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [createPwLoading, setCreatePwLoading] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const createPwForm = useForm<CreatePasswordInput>({
    resolver: zodResolver(createPasswordSchema),
  });

  // Fetch password status & 2FA status
  useEffect(() => {
    fetch('/api/dashboard/change-password')
      .then((r) => r.json())
      .then((d) => setHasPassword(d.data?.hasPassword ?? true))
      .catch(() => setHasPassword(true));
    fetch('/api/dashboard/two-factor')
      .then((r) => r.json())
      .then((d) => setTwoFAEnabled(d.data?.enabled ?? false))
      .catch(() => {})
      .finally(() => setTwoFALoading(false));
  }, []);

  const onProfileSubmit = async (data: UpdateProfileInput) => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addToast('Profile updated.', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to update profile.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/dashboard/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addToast('Password changed.', 'success');
        passwordForm.reset();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to change password.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onCreatePassword = async (data: CreatePasswordInput) => {
    setCreatePwLoading(true);
    try {
      const res = await fetch('/api/dashboard/create-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addToast('Password created successfully!', 'success');
        createPwForm.reset();
        setHasPassword(true);
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to create password.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setCreatePwLoading(false);
    }
  };

  // ── 2FA handlers ──
  const handleSendOTP = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/dashboard/two-factor', { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        setShowEnableModal(true);
        addToast('Verification code sent to your email', 'success');
      } else {
        addToast(d.error || 'Failed to send code', 'error');
      }
    } catch {
      addToast('Failed to send code', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/dashboard/two-factor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });
      const d = await res.json();
      if (res.ok) {
        setTwoFAEnabled(true);
        setShowEnableModal(false);
        setOtpCode('');
        addToast('Two-factor authentication enabled!', 'success');
      } else {
        addToast(d.error || 'Invalid code', 'error');
      }
    } catch {
      addToast('Verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    setDisabling(true);
    try {
      const res = await fetch('/api/dashboard/two-factor', { method: 'DELETE' });
      if (res.ok) {
        setTwoFAEnabled(false);
        setShowDisableModal(false);
        addToast('Two-factor authentication disabled', 'success');
      } else {
        addToast('Failed to disable 2FA', 'error');
      }
    } catch {
      addToast('Failed to disable 2FA', 'error');
    } finally {
      setDisabling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account preferences.</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {activeTab === 'profile' && (
        <GlassCard padding="lg">
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={user?.image} name={user?.name} size="xl" />
            <div>
              <p className="font-heading font-semibold">{user?.name || 'User'}</p>
              <p className="text-sm text-text-tertiary">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              label="Display Name"
              placeholder="Your name"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name')}
            />

            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              hint="Email cannot be changed."
            />

            <Button
              type="submit"
              variant="primary"
              loading={profileLoading}
              icon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </form>
        </GlassCard>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <GlassCard padding="lg">
            {hasPassword === null ? (
              <div className="flex items-center gap-2 text-text-tertiary text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : hasPassword ? (
              <>
                <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                  Change Password
                </h3>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <Input
                    type="password"
                    label="Current Password"
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register('currentPassword')}
                  />
                  <Input
                    type="password"
                    label="New Password"
                    error={passwordForm.formState.errors.newPassword?.message}
                    {...passwordForm.register('newPassword')}
                  />
                  <Input
                    type="password"
                    label="Confirm New Password"
                    error={passwordForm.formState.errors.confirmNewPassword?.message}
                    {...passwordForm.register('confirmNewPassword')}
                  />
                  <Button type="submit" variant="primary" loading={passwordLoading}>
                    Update Password
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                  Create Password
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  You signed in with Google. Create a password to also sign in with your email.
                </p>
                <form onSubmit={createPwForm.handleSubmit(onCreatePassword)} className="space-y-4">
                  <Input
                    type="password"
                    label="New Password"
                    placeholder="Min 8 characters"
                    error={createPwForm.formState.errors.newPassword?.message}
                    {...createPwForm.register('newPassword')}
                  />
                  <Input
                    type="password"
                    label="Confirm Password"
                    placeholder="Repeat your password"
                    error={createPwForm.formState.errors.confirmNewPassword?.message}
                    {...createPwForm.register('confirmNewPassword')}
                  />
                  <Button type="submit" variant="primary" loading={createPwLoading}>
                    Create Password
                  </Button>
                </form>
              </>
            )}
          </GlassCard>

          <GlassCard padding="lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${twoFAEnabled ? 'bg-success/10' : 'bg-white/[0.04]'}`}>
                  {twoFAEnabled ? (
                    <ShieldCheck className="h-5 w-5 text-success" />
                  ) : (
                    <Shield className="h-5 w-5 text-text-tertiary" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
                    Two-Factor Authentication
                    {!twoFALoading && (
                      <Badge variant={twoFAEnabled ? 'green' : 'default'} size="sm">
                        {twoFAEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {twoFAEnabled
                      ? 'A verification code will be sent to your email each time you log in.'
                      : 'Add an extra layer of security by requiring a verification code on login.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {twoFALoading ? (
                <div className="flex items-center gap-2 text-text-tertiary text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : twoFAEnabled ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDisableModal(true)}
                  icon={<ShieldOff className="h-4 w-4" />}
                  className="border-danger/30 text-danger hover:bg-danger/5"
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  loading={sending}
                  onClick={handleSendOTP}
                  icon={<ShieldCheck className="h-4 w-4" />}
                >
                  Enable 2FA
                </Button>
              )}
            </div>

            {!twoFAEnabled && !twoFALoading && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Mail className="h-4 w-4 text-accent-primary mt-0.5 shrink-0" />
                <p className="text-xs text-text-tertiary">
                  When enabled, we&apos;ll send a 6-digit verification code to <strong className="text-text-secondary">{user?.email}</strong> every time you sign in with your password.
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ── Enable 2FA Modal ── */}
      <Modal isOpen={showEnableModal} onClose={() => { setShowEnableModal(false); setOtpCode(''); }} title="Verify Your Identity" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Enter the 6-digit code sent to <strong className="text-text-primary">{user?.email}</strong>
          </p>

          <Input
            label="Verification Code"
            type="text"
            placeholder="Enter 6-digit code"
            icon={<ShieldCheck className="h-4 w-4" />}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleVerifyOTP();
              }
            }}
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowEnableModal(false); setOtpCode(''); }}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]"
            >
              Cancel
            </button>
            <Button
              variant="primary"
              size="sm"
              loading={verifying}
              onClick={handleVerifyOTP}
              disabled={otpCode.length !== 6}
            >
              Verify & Enable
            </Button>
          </div>

          <p className="text-xs text-text-tertiary text-center">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={() => { setOtpCode(''); handleSendOTP(); }}
              className="text-accent-primary hover:underline"
            >
              Resend code
            </button>
          </p>
        </div>
      </Modal>

      {/* ── Disable 2FA Modal ── */}
      <Modal isOpen={showDisableModal} onClose={() => setShowDisableModal(false)} title="Disable Two-Factor Authentication" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to disable two-factor authentication? Your account will be less secure.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDisableModal(false)}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable2FA}
              disabled={disabling}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40"
            >
              {disabling && <Loader2 className="h-4 w-4 animate-spin" />} Disable 2FA
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

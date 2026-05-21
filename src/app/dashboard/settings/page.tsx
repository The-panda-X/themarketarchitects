'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Shield, Save } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import Avatar from '@/components/ui/Avatar';
import Tabs from '@/components/ui/Tabs';
import useToast from '@/hooks/useToast';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
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

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

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
          </GlassCard>

          <GlassCard padding="lg">
            <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-text-tertiary" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Add an extra layer of security with TOTP-based two-factor authentication.
            </p>
            <Toggle
              label="Enable 2FA"
              description="Use an authenticator app for additional security."
              enabled={false}
              onChange={() => {
                addToast('2FA setup coming soon.', 'info');
              }}
            />
          </GlassCard>
        </div>
      )}
    </div>
  );
}

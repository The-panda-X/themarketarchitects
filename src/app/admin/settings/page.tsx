'use client';

import { Settings } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import useAuth from '@/hooks/useAuth';

export default function AdminSettingsPage() {
  const { canDelete } = useAuth();

  if (!canDelete) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent-primary" /> Settings
        </h1>
        <GlassCard>
          <p className="text-text-secondary">Only the Head Admin can access settings.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent-primary" /> Settings
        </h1>
        <p className="text-text-secondary mt-1">Platform configuration.</p>
      </div>

      <GlassCard>
        <p className="text-text-secondary text-sm">General settings coming soon. Use the <strong className="text-text-primary">Home Page</strong> section in the sidebar to customize landing page content.</p>
      </GlassCard>
    </div>
  );
}

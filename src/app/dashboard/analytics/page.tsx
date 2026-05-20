'use client';

import { BarChart3 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Analytics</h1>
        <p className="text-text-secondary mt-1">Detailed performance analytics for your challenges.</p>
      </div>

      <GlassCard padding="lg">
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold">Coming Soon</h3>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">
            Advanced analytics with performance charts, equity curves, and trade breakdowns will be available here.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

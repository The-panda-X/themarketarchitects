'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  className,
}: TabsProps) {
  const instanceId = useId();

  if (variant === 'pills') {
    return (
      <div
        role="tablist"
        className={cn(
          'inline-flex rounded-xl bg-white/[0.05] border border-white/[0.06] p-1 gap-1',
          className
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg font-medium transition-all duration-200',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              activeTab === tab.id
                ? 'text-white'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId={`pill-bg-${instanceId}`}
                className="absolute inset-0 bg-accent-primary/80 rounded-lg"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono',
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-text-tertiary'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div role="tablist" className={cn('flex border-b border-white/[0.06]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 font-medium transition-colors duration-200',
            size === 'sm' ? 'px-3 pb-2.5 text-xs' : 'px-4 pb-3 text-sm',
            activeTab === tab.id
              ? 'text-accent-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 font-mono">
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <motion.div
              layoutId={`tab-underline-${instanceId}`}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary shadow-glow-sm"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

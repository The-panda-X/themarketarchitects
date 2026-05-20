'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const trackSize = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const thumbSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const thumbTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          trackSize,
          enabled ? 'bg-accent-primary' : 'bg-white/10',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg transition-transform duration-200',
            thumbSize,
            'translate-y-[1px]',
            enabled ? thumbTranslate : 'translate-x-0.5'
          )}
        />
      </button>
      {(label || description) && (
        <div>
          {label && (
            <span className="text-sm font-medium text-text-primary">{label}</span>
          )}
          {description && (
            <p className="text-xs text-text-tertiary">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            className={cn(
              'w-full appearance-none rounded-lg border bg-white/[0.05] backdrop-blur-sm px-4 py-2.5 pr-10 text-sm text-text-primary',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-danger/50 focus:ring-danger/30 focus:border-danger/50'
                : 'border-white/[0.08] hover:border-white/[0.15]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-bg-card text-text-tertiary">
                {placeholder}
              </option>
            )}
            {options
              ? options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="bg-bg-card text-text-primary"
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
        </div>
        {error && <p id={`${selectId}-error`} className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

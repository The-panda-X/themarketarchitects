'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            'w-full rounded-lg border bg-white/[0.05] backdrop-blur-sm px-4 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-tertiary',
            'transition-all duration-200 resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-[rgba(230,57,70,0.30)] focus:border-[rgba(230,57,70,0.50)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-danger/50 focus:ring-danger/30 focus:border-danger/50'
              : 'border-[rgba(230,57,70,0.28)] hover:border-[rgba(230,57,70,0.40)]',
            className
          )}
          {...props}
        />
        {error && <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;

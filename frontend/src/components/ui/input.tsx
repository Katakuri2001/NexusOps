import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-9 px-3 bg-elevated border rounded-lg text-sm text-foreground placeholder:text-muted",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            error
              ? "border-danger focus:ring-danger/30 focus:border-danger/50"
              : "border-border hover:border-border-hover",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full h-9 px-3 bg-elevated border rounded-lg text-sm text-foreground",
            "transition-colors duration-150 appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            error
              ? "border-danger focus:ring-danger/30"
              : "border-border hover:border-border-hover",
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-2 bg-elevated border rounded-lg text-sm text-foreground placeholder:text-muted",
            "transition-colors duration-150 min-h-[80px] resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            error ? "border-danger" : "border-border hover:border-border-hover",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

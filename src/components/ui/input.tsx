import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'glass-control flex h-13 w-full rounded-2xl px-4 py-2 text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:border-emerald-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[hsl(var(--destructive))]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

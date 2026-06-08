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
            'flex h-12 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2 text-base ring-offset-[hsl(var(--background))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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

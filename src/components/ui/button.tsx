import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          {
            'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-emerald-500/30':
              variant === 'default',
            'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90':
              variant === 'destructive',
            'glass-control hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-[hsl(var(--foreground))]':
              variant === 'outline',
            'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]':
              variant === 'ghost',
            'text-[hsl(var(--primary))] underline-offset-4 hover:underline':
              variant === 'link',
            'glass-control text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]':
              variant === 'secondary',
            'h-11 px-5 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-13 rounded-2xl px-8': size === 'lg',
            'h-11 w-11': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

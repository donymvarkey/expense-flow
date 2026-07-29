import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Class applied while selected. Defaults to the primary accent. */
  selectedClassName?: string;
}

/** Selectable pill used for category, filter and option lists. */
export function Chip({
  selected = false,
  selectedClassName = 'bg-[hsl(var(--primary))] text-white',
  className,
  type = 'button',
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? selectedClassName
          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
        className
      )}
      {...props}
    />
  );
}

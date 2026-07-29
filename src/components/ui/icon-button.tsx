import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type IconButtonVariant = 'default' | 'destructive' | 'ghost-destructive';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: 'rounded-full p-2 hover:bg-[hsl(var(--accent))]',
  destructive: 'rounded-full p-2 text-red-400 hover:bg-red-500/10',
  'ghost-destructive':
    'p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400',
};

/** Borderless button holding a single icon. */
export function IconButton({
  variant = 'default',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}

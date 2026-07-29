import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0-100; values above 100 render as a full bar. */
  percentage: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({
  percentage,
  className,
  barClassName = 'bg-[hsl(var(--primary))]',
}: ProgressBarProps) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-[hsl(var(--muted))]', className)}>
      <div
        className={cn('h-full rounded-full transition-all', barClassName)}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

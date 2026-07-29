import { cn } from '@/lib/utils';

/** Small muted caption used above chip groups and inline inputs. */
export function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]',
        className
      )}
    >
      {children}
    </p>
  );
}

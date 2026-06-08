import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-[hsl(var(--card-foreground))]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1 pb-3', className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-medium text-[hsl(var(--muted-foreground))]', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

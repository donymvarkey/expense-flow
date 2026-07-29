import { cn } from '@/lib/utils';

/** Inline error banner shared by the auth forms. */
export function FormError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400',
        className
      )}
    >
      {message}
    </div>
  );
}

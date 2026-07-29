import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';

/** Branded panel wrapping the sign in / sign up forms. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 md:p-8">
        <div className="mb-8 text-center">
          <div className="brand-mark mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Wallet className="h-7 w-7 text-slate-950" />
          </div>
          <h1 className="text-gradient text-3xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Centered status screen used for reset-password confirmations and errors. */
export function AuthNotice({
  icon,
  title,
  description,
  footer,
}: {
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {icon && (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            {icon}
          </div>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
        {footer}
      </div>
    </div>
  );
}

export function AuthBackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="mt-6 inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

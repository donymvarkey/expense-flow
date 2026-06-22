import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setSubmitting(true);
      setError('');
      await updatePassword(data.password);
      setSuccess(true);
      // Give the user a moment to read the confirmation, then continue.
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Wait for Supabase to parse the recovery token from the URL.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
      </div>
    );
  }

  // No recovery session means the link is missing, invalid, or expired.
  if (!session) {
    return (
      <div className="auth-shell flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 text-center md:p-8">
          <h1 className="text-2xl font-bold">Invalid or expired link</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            This password reset link is no longer valid. Please request a new
            one.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-shell flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 text-center md:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Your password has been changed. Redirecting you to the app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 md:p-8">
        <div className="mb-8 text-center">
          <div className="brand-mark mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <KeyRound className="h-7 w-7 text-slate-950" />
          </div>
          <h1 className="text-gradient text-3xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Choose a new password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

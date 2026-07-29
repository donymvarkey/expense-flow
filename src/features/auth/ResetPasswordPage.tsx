import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncSubmit } from '@/hooks/useAsyncSubmit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { FullPageSpinner } from '@/components/ui/spinner';
import { AuthBackLink, AuthNotice } from '@/features/auth/AuthShell';
import { useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const { error, loading: submitting, submit } = useAsyncSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordInput) =>
    submit(async () => {
      await updatePassword(data.password);
      setSuccess(true);
      // Give the user a moment to read the confirmation, then continue.
      setTimeout(() => navigate('/dashboard'), 1500);
    }, 'Failed to update password');

  // Wait for Supabase to parse the recovery token from the URL.
  if (loading) {
    return <FullPageSpinner />;
  }

  // No recovery session means the link is missing, invalid, or expired.
  if (!session) {
    return (
      <AuthNotice
        title="Invalid or expired link"
        description="This password reset link is no longer valid. Please request a new one."
        footer={
          <AuthBackLink to="/forgot-password" label="Request a new link" />
        }
      />
    );
  }

  if (success) {
    return (
      <AuthNotice
        icon={<CheckCircle2 className="h-7 w-7 text-emerald-500" />}
        title="Password updated"
        description="Your password has been changed. Redirecting you to the app..."
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Choose a new password for your account.
          </p>
        </div>

        <FormError message={error} className="mb-4" />

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

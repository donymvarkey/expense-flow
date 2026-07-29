import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncSubmit } from '@/hooks/useAsyncSubmit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { AuthBackLink, AuthNotice } from '@/features/auth/AuthShell';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [success, setSuccess] = useState(false);
  const { error, loading, submit } = useAsyncSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) =>
    submit(async () => {
      await resetPassword(data.email);
      setSuccess(true);
    }, 'Failed to send reset email');

  if (success) {
    return (
      <AuthNotice
        icon={<Mail className="h-7 w-7 text-emerald-500" />}
        title="Check your email"
        description="We've sent a password reset link to your email address."
        footer={<AuthBackLink to="/login" label="Back to login" />}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <FormError message={error} className="mt-4" />

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="Email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </div>
    </div>
  );
}

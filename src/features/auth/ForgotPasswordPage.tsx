import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setLoading(true);
      setError('');
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Mail className="h-7 w-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            We&apos;ve sent a password reset link to your email address.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
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

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

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

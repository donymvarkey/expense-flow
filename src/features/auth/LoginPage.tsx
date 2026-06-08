import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoading(true);
      setError('');
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Sign in to ExpenseFlow
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            type="password"
            placeholder="Password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={signInWithGoogle}
          >
            Continue with Google
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

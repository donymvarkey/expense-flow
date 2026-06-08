import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setLoading(true);
      setError('');
      await signUp(data.email, data.password, data.full_name);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Start tracking your expenses
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />
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
          <Input
            type="password"
            placeholder="Confirm Password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

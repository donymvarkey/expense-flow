import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncSubmit } from '@/hooks/useAsyncSubmit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { AuthCard } from '@/features/auth/AuthShell';
import { useNavigate, Link } from 'react-router-dom';

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { error, loading, submit } = useAsyncSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) =>
    submit(async () => {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    }, 'Login failed');

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Your financial clarity is waiting."
    >
      <FormError message={error} className="mb-4" />

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
    </AuthCard>
  );
}

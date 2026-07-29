import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncSubmit } from '@/hooks/useAsyncSubmit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { AuthCard } from '@/features/auth/AuthShell';
import { useNavigate, Link } from 'react-router-dom';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { error, loading, submit } = useAsyncSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) =>
    submit(async () => {
      await signUp(data.email, data.password, data.full_name);
      navigate('/dashboard');
    }, 'Registration failed');

  return (
    <AuthCard
      title="Create account"
      subtitle="A calmer way to understand your money."
    >
      <FormError message={error} className="mb-4" />

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
    </AuthCard>
  );
}

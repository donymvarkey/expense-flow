import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { getTransaction, updateTransaction } from '@/services/transactions';
import { getCategories } from '@/services/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
  });

  const type = watch('type');

  useEffect(() => {
    if (!id || !user) return;

    async function loadData() {
      const [transaction, cats] = await Promise.all([
        getTransaction(id!),
        getCategories(user!.id),
      ]);

      if (transaction) {
        reset({
          amount: transaction.amount,
          type: transaction.type,
          category_id: transaction.category_id,
          description: transaction.description || '',
          notes: transaction.notes || '',
          payment_method: transaction.payment_method,
          transaction_date: transaction.transaction_date,
        });
      }

      setCategories(cats);
      setLoading(false);
    }

    loadData();
  }, [id, user, reset]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const onSubmit = async (data: TransactionInput) => {
    if (!user || !id) return;
    try {
      setSaving(true);
      await updateTransaction(user.id, id, data);
      toast({ title: 'Transaction updated', variant: 'success' });
      navigate(`/transactions/${id}`);
    } catch {
      toast({ title: 'Failed to update', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-12 md:pt-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="transition-page px-4 pt-12 md:pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-[hsl(var(--accent))]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Edit Transaction</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex rounded-xl bg-[hsl(var(--muted))] p-1">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
              type === 'expense'
                ? 'bg-red-500/20 text-red-400'
                : 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <Input
          type="number"
          step="0.01"
          placeholder="Amount"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        {/* Category */}
        <div>
          <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setValue('category_id', cat.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  watch('category_id') === cat.id
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {errors.category_id && (
            <p className="mt-1 text-xs text-red-400">{errors.category_id.message}</p>
          )}
        </div>

        {/* Date */}
        <Input
          type="date"
          error={errors.transaction_date?.message}
          {...register('transaction_date')}
        />

        {/* Description */}
        <Input
          type="text"
          placeholder="Description (optional)"
          {...register('description')}
        />

        {/* Notes */}
        <Input
          type="text"
          placeholder="Notes (optional)"
          {...register('notes')}
        />

        {/* Payment Method */}
        <div>
          <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Payment Method
          </p>
          <div className="flex flex-wrap gap-2">
            {['cash', 'card', 'upi', 'bank_transfer', 'other'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setValue('payment_method', method as TransactionInput['payment_method'])}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  watch('payment_method') === method
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                {method.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? 'Saving...' : 'Update Transaction'}
        </Button>
      </form>
    </div>
  );
}

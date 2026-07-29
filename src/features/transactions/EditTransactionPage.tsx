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
import { Chip } from '@/components/ui/chip';
import { FieldLabel } from '@/components/ui/field-label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { PageHeader } from '@/components/common/PageHeader';
import { TRANSACTION_TYPE_OPTIONS } from '@/lib/transaction-display';
import { PAYMENT_METHODS, type Category } from '@/types';

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
      <PageHeader title="Edit Transaction" titleClassName="text-lg" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <SegmentedControl
          options={TRANSACTION_TYPE_OPTIONS}
          value={type}
          onChange={(value) => setValue('type', value)}
        />

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
          <FieldLabel>Category</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((cat) => (
              <Chip
                key={cat.id}
                selected={watch('category_id') === cat.id}
                onClick={() => setValue('category_id', cat.id)}
              >
                {cat.name}
              </Chip>
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
          <FieldLabel>Payment Method</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <Chip
                key={method}
                className="capitalize"
                selected={watch('payment_method') === method}
                onClick={() => setValue('payment_method', method)}
              >
                {method.replace('_', ' ')}
              </Chip>
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

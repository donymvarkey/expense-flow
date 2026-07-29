import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { getTransaction, deleteTransaction } from '@/services/transactions';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { IconButton } from '@/components/ui/icon-button';
import { PageHeader } from '@/components/common/PageHeader';
import { TransactionAmount } from '@/components/common/TransactionAmount';
import type { TransactionWithCategory } from '@/types';
import {
  Edit,
  Trash2,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  Cloud,
  CloudOff,
  AlertCircle,
  Image,
} from 'lucide-react';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTransaction(id).then((t) => {
      setTransaction(t);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!user || !id) return;
    try {
      await deleteTransaction(user.id, id);
      toast({ title: 'Transaction deleted', variant: 'success' });
      navigate('/transactions');
    } catch {
      toast({ title: 'Failed to delete', variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-12 md:pt-6">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-6 h-24 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[hsl(var(--muted-foreground))]">Transaction not found</p>
      </div>
    );
  }

  const isExpense = transaction.type === 'expense';

  return (
    <div className="transition-page px-4 pt-12 md:pt-6">
      <PageHeader
        actions={
          <>
            <IconButton onClick={() => navigate(`/transactions/${id}/edit`)}>
              <Edit className="h-5 w-5" />
            </IconButton>
            <IconButton
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      {/* Amount */}
      <div className="mb-6 text-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {isExpense ? 'Expense' : 'Income'}
        </p>
        <TransactionAmount
          type={transaction.type}
          amount={transaction.amount}
          className="mt-1 block text-4xl font-bold"
        />
      </div>

      {/* Details */}
      <div className="space-y-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
        <DetailRow
          icon={<Tag className="h-4 w-4" />}
          label="Category"
          value={transaction.category.name}
        />
        <DetailRow
          icon={<Calendar className="h-4 w-4" />}
          label="Date"
          value={formatDate(transaction.transaction_date)}
        />
        {transaction.description && (
          <DetailRow
            icon={<FileText className="h-4 w-4" />}
            label="Description"
            value={transaction.description}
          />
        )}
        {transaction.notes && (
          <DetailRow
            icon={<FileText className="h-4 w-4" />}
            label="Notes"
            value={transaction.notes}
          />
        )}
        {transaction.payment_method && (
          <DetailRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Payment"
            value={transaction.payment_method.replace('_', ' ')}
          />
        )}
        <DetailRow
          icon={
            transaction.sync_status === 'synced' ? (
              <Cloud className="h-4 w-4 text-emerald-500" />
            ) : transaction.sync_status === 'failed' ? (
              <CloudOff className="h-4 w-4 text-red-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )
          }
          label="Sync"
          value={transaction.sync_status}
        />
      </div>

      {/* Receipt */}
      {transaction.receipt_url && (
        <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Image className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-medium">Receipt</span>
          </div>
          <img
            src={transaction.receipt_url}
            alt="Receipt"
            className="w-full rounded-lg object-cover"
          />
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-[hsl(var(--muted-foreground))]">{icon}</span>
      <span className="flex-1 text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

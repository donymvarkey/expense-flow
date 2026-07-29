import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { createTransaction } from '@/services/transactions';
import { getCategories } from '@/services/categories';
import { useNavigate } from 'react-router-dom';
import { Chip } from '@/components/ui/chip';
import { FieldLabel } from '@/components/ui/field-label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { BackButton } from '@/components/common/PageHeader';
import {
  TRANSACTION_TYPE_OPTIONS,
  TRANSACTION_TYPE_TEXT_CLASS,
} from '@/lib/transaction-display';
import { todayISODate } from '@/lib/date';
import type { Category, TransactionType } from '@/types';
import { cn } from '@/lib/utils';
import { Camera, Check, Delete } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export function QuickAddPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {currency} = useSettings();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TransactionType>('expense');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCategories(user.id, type).then(setCategories);
  }, [user, type]);

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => prev + '.');
      }
    } else {
      setAmount((prev) => (prev === '0' ? key : prev + key));
    }
  };

  const handleSave = async () => {
    if (!user || amount === '0' || !selectedCategory) {
      toast({
        title: 'Please fill required fields',
        description: 'Amount and category are required',
        variant: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      await createTransaction(user.id, {
        amount: parseFloat(amount),
        type,
        category_id: selectedCategory,
        notes: notes || undefined,
        transaction_date: todayISODate(),
      });

      toast({
        title: type === 'expense' ? 'Expense added' : 'Income added',
        variant: 'success',
      });
      navigate(-1);
    } catch {
      toast({
        title: 'Failed to save',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 md:pt-4">
        <BackButton />
        <SegmentedControl
          shape="pill"
          options={TRANSACTION_TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />
        <button
          onClick={() => navigate('/scan-receipt')}
          className="rounded-full p-2 hover:bg-[hsl(var(--accent))]"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      {/* Amount Display */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {type === 'expense' ? 'Expense Amount' : 'Income Amount'}
        </p>
        <p
          className={cn(
            'mt-2 text-5xl font-bold tabular-nums',
            TRANSACTION_TYPE_TEXT_CLASS[type]
          )}
        >
          {currency} {amount}
        </p>

        {/* Notes Input */}
        <input
          type="text"
          placeholder="Add a note (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-4 w-full max-w-xs border-b border-[hsl(var(--border))] bg-transparent pb-2 text-center text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
        />
      </div>

      {/* Category Selection */}
      <div className="px-4 pb-3">
        <FieldLabel>Category</FieldLabel>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              className="shrink-0 px-4 py-2"
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-1 px-4 pb-4 safe-area-bottom">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(
          (key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="flex h-14 items-center justify-center rounded-xl text-xl font-medium active:bg-[hsl(var(--accent))] transition-colors"
            >
              {key === 'backspace' ? (
                <Delete className="h-5 w-5" />
              ) : (
                key
              )}
            </button>
          )
        )}
      </div>

      {/* Save Button */}
      <div className="px-4 pb-6 safe-area-bottom">
        <button
          onClick={handleSave}
          disabled={saving || amount === '0' || !selectedCategory}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] py-4 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </div>
  );
}

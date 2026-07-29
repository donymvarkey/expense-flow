import type { SegmentedOption } from '@/components/ui/segmented-control';
import type { TransactionType } from '@/types';

export const TRANSACTION_TYPE_TEXT_CLASS: Record<TransactionType, string> = {
  expense: 'text-red-400',
  income: 'text-emerald-400',
};

export const TRANSACTION_TYPE_SELECTED_CLASS: Record<TransactionType, string> = {
  expense: 'bg-red-500/20 text-red-400',
  income: 'bg-emerald-500/20 text-emerald-400',
};

export const TRANSACTION_TYPE_OPTIONS: SegmentedOption<TransactionType>[] = [
  {
    value: 'expense',
    label: 'Expense',
    selectedClassName: TRANSACTION_TYPE_SELECTED_CLASS.expense,
  },
  {
    value: 'income',
    label: 'Income',
    selectedClassName: TRANSACTION_TYPE_SELECTED_CLASS.income,
  },
];

export function amountSign(type: TransactionType): string {
  return type === 'expense' ? '-' : '+';
}

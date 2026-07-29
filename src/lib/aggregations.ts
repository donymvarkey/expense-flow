import type { DateRange } from '@/lib/date';
import type { Transaction, TransactionType } from '@/types';

type AmountRecord = Pick<Transaction, 'amount'>;
type DatedTransaction = Pick<Transaction, 'transaction_date'>;
type TypedTransaction = Pick<Transaction, 'amount' | 'type'>;

export function sumBy<T>(items: T[], select: (item: T) => number): number {
  return items.reduce((sum, item) => sum + select(item), 0);
}

export function sumAmounts(records: AmountRecord[]): number {
  return sumBy(records, (record) => record.amount);
}

export function sumByType<T extends TypedTransaction>(
  transactions: T[],
  type: TransactionType
): number {
  return sumAmounts(transactions.filter((t) => t.type === type));
}

export function totalsByType<T extends TypedTransaction>(transactions: T[]) {
  const income = sumByType(transactions, 'income');
  const expenses = sumByType(transactions, 'expense');
  return { income, expenses, savings: income - expenses };
}

export function filterByDateRange<T extends DatedTransaction>(
  transactions: T[],
  { startDate, endDate }: DateRange
): T[] {
  return transactions.filter(
    (t) => t.transaction_date >= startDate && t.transaction_date <= endDate
  );
}

export function percentageOf(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

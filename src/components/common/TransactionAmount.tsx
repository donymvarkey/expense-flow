import { formatCurrency, cn } from '@/lib/utils';
import { TRANSACTION_TYPE_TEXT_CLASS, amountSign } from '@/lib/transaction-display';
import type { TransactionType } from '@/types';

interface TransactionAmountProps {
  type: TransactionType;
  amount: number;
  className?: string;
}

/** Signed, currency-formatted amount coloured by transaction type. */
export function TransactionAmount({
  type,
  amount,
  className,
}: TransactionAmountProps) {
  return (
    <span className={cn(TRANSACTION_TYPE_TEXT_CLASS[type], className)}>
      {amountSign(type)}
      {formatCurrency(amount)}
    </span>
  );
}

import { db } from '@/db';
import { syncEngine } from '@/sync/engine';
import { generateId } from '@/lib/utils';
import type { Transaction, TransactionWithCategory } from '@/types';
import type { TransactionInput } from '@/lib/validations';

export async function getTransactions(
  userId: string,
  options?: {
    type?: 'income' | 'expense';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
    limit?: number;
    offset?: number;
  }
): Promise<TransactionWithCategory[]> {
  let collection = db.transactions.where('user_id').equals(userId);

  let transactions = await collection.toArray();

  // Apply filters
  if (options?.type) {
    transactions = transactions.filter((t) => t.type === options.type);
  }

  if (options?.categoryId) {
    transactions = transactions.filter(
      (t) => t.category_id === options.categoryId
    );
  }

  if (options?.startDate) {
    transactions = transactions.filter(
      (t) => t.transaction_date >= options.startDate!
    );
  }

  if (options?.endDate) {
    transactions = transactions.filter(
      (t) => t.transaction_date <= options.endDate!
    );
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    transactions = transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  switch (options?.sortBy) {
    case 'oldest':
      transactions.sort(
        (a, b) =>
          new Date(a.transaction_date).getTime() -
          new Date(b.transaction_date).getTime()
      );
      break;
    case 'highest':
      transactions.sort((a, b) => b.amount - a.amount);
      break;
    case 'lowest':
      transactions.sort((a, b) => a.amount - b.amount);
      break;
    default: // newest
      transactions.sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      );
  }

  // Pagination
  if (options?.offset) {
    transactions = transactions.slice(options.offset);
  }

  if (options?.limit) {
    transactions = transactions.slice(0, options.limit);
  }

  // Attach categories
  const categories = await db.categories.where('user_id').equals(userId).toArray();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return transactions.map((t) => ({
    ...t,
    category: categoryMap.get(t.category_id) || {
      id: t.category_id,
      user_id: userId,
      name: 'Unknown',
      type: t.type,
      created_at: t.created_at,
      sync_status: 'synced' as const,
    },
  }));
}

export async function getTransaction(
  id: string
): Promise<TransactionWithCategory | null> {
  const transaction = await db.transactions.get(id);
  if (!transaction) return null;

  const category = await db.categories.get(transaction.category_id);
  return {
    ...transaction,
    category: category || {
      id: transaction.category_id,
      user_id: transaction.user_id,
      name: 'Unknown',
      type: transaction.type,
      created_at: transaction.created_at,
      sync_status: 'synced' as const,
    },
  };
}

export async function createTransaction(
  userId: string,
  input: TransactionInput
): Promise<Transaction> {
  const now = new Date().toISOString();
  const transaction: Transaction = {
    id: generateId(),
    user_id: userId,
    amount: input.amount,
    type: input.type,
    category_id: input.category_id,
    description: input.description,
    notes: input.notes,
    payment_method: input.payment_method,
    tags: input.tags,
    transaction_date: input.transaction_date,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  await db.transactions.add(transaction);

  // Queue for sync
  await syncEngine.addToQueue(userId, 'create', 'transactions', {
    ...transaction,
  });

  return transaction;
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: Partial<TransactionInput>
): Promise<Transaction> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error('Transaction not found');

  const updated: Transaction = {
    ...existing,
    ...input,
    updated_at: new Date().toISOString(),
    sync_status: 'pending',
  };

  await db.transactions.put(updated);

  await syncEngine.addToQueue(userId, 'update', 'transactions', {
    ...updated,
  });

  return updated;
}

export async function deleteTransaction(
  userId: string,
  id: string
): Promise<void> {
  await db.transactions.delete(id);
  await syncEngine.addToQueue(userId, 'delete', 'transactions', { id });
}

export async function getMonthlyStats(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]!;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]!;

  const transactions = await db.transactions
    .where('user_id')
    .equals(userId)
    .toArray();

  const monthlyTransactions = transactions.filter(
    (t) => t.transaction_date >= startDate && t.transaction_date <= endDate
  );

  const income = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expenses, savings: income - expenses };
}

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const allTransactions = await db.transactions
    .where('user_id')
    .equals(userId)
    .toArray();

  const totalIncome = allTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = allTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthly = await getMonthlyStats(userId, month, year);

  return {
    currentBalance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    savings: totalIncome - totalExpenses,
    monthlyIncome: monthly.income,
    monthlyExpenses: monthly.expenses,
  };
}

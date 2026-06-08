import { db } from '@/db';
import { syncEngine } from '@/sync/engine';
import { generateId } from '@/lib/utils';
import type { Budget, BudgetWithCategory } from '@/types';
import type { BudgetInput } from '@/lib/validations';

export async function getBudgets(
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithCategory[]> {
  const budgets = await db.budgets.where('user_id').equals(userId).toArray();

  const monthlyBudgets = budgets.filter(
    (b) => b.month === month && b.year === year
  );

  const categories = await db.categories
    .where('user_id')
    .equals(userId)
    .toArray();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Get spending for each category this month
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]!;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]!;

  const transactions = await db.transactions
    .where('user_id')
    .equals(userId)
    .toArray();

  const monthlyExpenses = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      t.transaction_date >= startDate &&
      t.transaction_date <= endDate
  );

  return monthlyBudgets.map((budget) => {
    const category = categoryMap.get(budget.category_id) || {
      id: budget.category_id,
      user_id: userId,
      name: 'Unknown',
      type: 'expense' as const,
      created_at: budget.created_at,
      sync_status: 'synced' as const,
    };

    const spent = monthlyExpenses
      .filter((t) => t.category_id === budget.category_id)
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      category,
      spent,
      percentage,
    };
  });
}

export async function createBudget(
  userId: string,
  input: BudgetInput
): Promise<Budget> {
  const budget: Budget = {
    id: generateId(),
    user_id: userId,
    category_id: input.category_id,
    amount: input.amount,
    month: input.month,
    year: input.year,
    created_at: new Date().toISOString(),
    sync_status: 'pending',
  };

  await db.budgets.add(budget);
  await syncEngine.addToQueue(userId, 'create', 'budgets', { ...budget });

  return budget;
}

export async function updateBudget(
  userId: string,
  id: string,
  input: Partial<BudgetInput>
): Promise<Budget> {
  const existing = await db.budgets.get(id);
  if (!existing) throw new Error('Budget not found');

  const updated: Budget = {
    ...existing,
    ...input,
    sync_status: 'pending',
  };

  await db.budgets.put(updated);
  await syncEngine.addToQueue(userId, 'update', 'budgets', { ...updated });

  return updated;
}

export async function deleteBudget(
  userId: string,
  id: string
): Promise<void> {
  await db.budgets.delete(id);
  await syncEngine.addToQueue(userId, 'delete', 'budgets', { id });
}

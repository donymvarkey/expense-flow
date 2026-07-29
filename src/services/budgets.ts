import { db } from '@/db';
import { rowsForUser, unknownCategory } from '@/db/queries';
import { getCategoryMap } from '@/services/categories';
import { syncEngine } from '@/sync/engine';
import { generateId } from '@/lib/utils';
import { getMonthRange } from '@/lib/date';
import { filterByDateRange, percentageOf, sumAmounts } from '@/lib/aggregations';
import type { Budget, BudgetWithCategory } from '@/types';
import type { BudgetInput } from '@/lib/validations';

export async function getBudgets(
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithCategory[]> {
  const budgets = await rowsForUser(db.budgets, userId);

  const monthlyBudgets = budgets.filter(
    (b) => b.month === month && b.year === year
  );

  const categoryMap = await getCategoryMap(userId);

  // Get spending for each category this month
  const transactions = await rowsForUser(db.transactions, userId);
  const monthlyExpenses = filterByDateRange(
    transactions.filter((t) => t.type === 'expense'),
    getMonthRange(year, month)
  );

  return monthlyBudgets.map((budget) => {
    const category =
      categoryMap.get(budget.category_id) ||
      unknownCategory({
        id: budget.category_id,
        userId,
        type: 'expense',
        createdAt: budget.created_at,
      });

    const spent = sumAmounts(
      monthlyExpenses.filter((t) => t.category_id === budget.category_id)
    );

    return {
      ...budget,
      category,
      spent,
      percentage: percentageOf(spent, budget.amount),
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

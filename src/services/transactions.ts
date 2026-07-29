import { db } from "@/db";
import { rowsForUser, unknownCategory } from "@/db/queries";
import { getCategoryMap } from "@/services/categories";
import { syncEngine } from "@/sync/engine";
import { generateId } from "@/lib/utils";
import { getCurrentMonth, getMonthRange } from "@/lib/date";
import { filterByDateRange, totalsByType } from "@/lib/aggregations";
import type { Transaction, TransactionWithCategory } from "@/types";
import type { TransactionInput } from "@/lib/validations";

export async function getTransactions(
  userId: string,
  options?: {
    type?: "income" | "expense";
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: "newest" | "oldest" | "highest" | "lowest";
    limit?: number;
    offset?: number;
  },
): Promise<TransactionWithCategory[]> {
  let transactions = await rowsForUser(db.transactions, userId);

  // Apply filters
  if (options?.type) {
    transactions = transactions.filter((t) => t.type === options.type);
  }

  if (options?.categoryId) {
    transactions = transactions.filter(
      (t) => t.category_id === options.categoryId,
    );
  }

  if (options?.startDate) {
    transactions = transactions.filter(
      (t) => t.transaction_date >= options.startDate!,
    );
  }

  if (options?.endDate) {
    transactions = transactions.filter(
      (t) => t.transaction_date <= options.endDate!,
    );
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    transactions = transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower),
    );
  }

  // Sort
  switch (options?.sortBy) {
    case "oldest":
      transactions.sort(
        (a, b) =>
          new Date(a.transaction_date).getTime() -
          new Date(b.transaction_date).getTime(),
      );
      break;
    case "highest":
      transactions.sort((a, b) => b.amount - a.amount);
      break;
    case "lowest":
      transactions.sort((a, b) => a.amount - b.amount);
      break;
    default: // newest
      transactions.sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime(),
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
  const categoryMap = await getCategoryMap(userId);

  return transactions.map((t) => ({
    ...t,
    category:
      categoryMap.get(t.category_id) ||
      unknownCategory({
        id: t.category_id,
        userId,
        type: t.type,
        createdAt: t.created_at,
      }),
  }));
}

export async function getTransaction(
  id: string,
): Promise<TransactionWithCategory | null> {
  const transaction = await db.transactions.get(id);
  if (!transaction) return null;

  const category = await db.categories.get(transaction.category_id);
  return {
    ...transaction,
    category:
      category ||
      unknownCategory({
        id: transaction.category_id,
        userId: transaction.user_id,
        type: transaction.type,
        createdAt: transaction.created_at,
      }),
  };
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
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
    sync_status: "pending",
  };

  await db.transactions.add(transaction);

  // Queue for sync
  await syncEngine.addToQueue(userId, "create", "transactions", {
    ...transaction,
  });

  return transaction;
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: Partial<TransactionInput>,
): Promise<Transaction> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error("Transaction not found");

  const updated: Transaction = {
    ...existing,
    ...input,
    updated_at: new Date().toISOString(),
    sync_status: "pending",
  };

  await db.transactions.put(updated);

  await syncEngine.addToQueue(userId, "update", "transactions", {
    ...updated,
  });

  return updated;
}

export async function deleteTransaction(
  userId: string,
  id: string,
): Promise<void> {
  await db.transactions.delete(id);
  await syncEngine.addToQueue(userId, "delete", "transactions", { id });
}

export async function getMonthlyStats(
  userId: string,
  month: number,
  year: number,
) {
  const transactions = await rowsForUser(db.transactions, userId);
  const monthlyTransactions = filterByDateRange(
    transactions,
    getMonthRange(year, month),
  );

  return totalsByType(monthlyTransactions);
}

export async function getDashboardStats(userId: string) {
  const { month, year } = getCurrentMonth();

  const allTransactions = await rowsForUser(db.transactions, userId);
  const { income, expenses, savings } = totalsByType(allTransactions);

  const monthly = await getMonthlyStats(userId, month, year);

  return {
    currentBalance: savings,
    totalIncome: income,
    totalExpenses: expenses,
    savings,
    monthlyIncome: monthly.income,
    monthlyExpenses: monthly.expenses,
  };
}

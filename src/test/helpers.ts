import { db } from '@/db';
import type { Budget, Category, SyncQueueItem, Transaction } from '@/types';

export const USER_ID = 'user-1';

export async function resetDb() {
  await Promise.all([
    db.transactions.clear(),
    db.categories.clear(),
    db.budgets.clear(),
    db.syncQueue.clear(),
  ]);
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    user_id: USER_ID,
    name: 'Food',
    type: 'expense',
    created_at: '2024-01-01T00:00:00.000Z',
    sync_status: 'synced',
    ...overrides,
  };
}

export function makeTransaction(
  overrides: Partial<Transaction> = {}
): Transaction {
  return {
    id: 'txn-1',
    user_id: USER_ID,
    amount: 10,
    type: 'expense',
    category_id: 'cat-1',
    transaction_date: '2024-03-05',
    created_at: '2024-03-05T00:00:00.000Z',
    updated_at: '2024-03-05T00:00:00.000Z',
    sync_status: 'synced',
    ...overrides,
  };
}

export function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    user_id: USER_ID,
    category_id: 'cat-1',
    amount: 100,
    month: 3,
    year: 2024,
    created_at: '2024-03-01T00:00:00.000Z',
    sync_status: 'synced',
    ...overrides,
  };
}

export function makeQueueItem(
  overrides: Partial<SyncQueueItem> = {}
): SyncQueueItem {
  return {
    id: 'queue-1',
    user_id: USER_ID,
    action_type: 'create',
    table_name: 'transactions',
    payload: { id: 'txn-1' },
    status: 'pending',
    retry_count: 0,
    created_at: '2024-03-05T00:00:00.000Z',
    ...overrides,
  };
}

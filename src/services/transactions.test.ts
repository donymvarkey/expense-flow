import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import {
  USER_ID,
  makeCategory,
  makeTransaction,
  resetDb,
} from '@/test/helpers';

const addToQueue = vi.fn();

vi.mock('@/sync/engine', () => ({
  syncEngine: { addToQueue: (...args: unknown[]) => addToQueue(...args) },
}));

const {
  createTransaction,
  deleteTransaction,
  getDashboardStats,
  getMonthlyStats,
  getTransaction,
  getTransactions,
  updateTransaction,
} = await import('./transactions');

beforeEach(async () => {
  await resetDb();
  addToQueue.mockReset();
});

describe('getTransactions', () => {
  beforeEach(async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'cat-food', name: 'Food' }),
      makeCategory({ id: 'cat-pay', name: 'Salary', type: 'income' }),
    ]);
    await db.transactions.bulkAdd([
      makeTransaction({
        id: 't1',
        amount: 30,
        category_id: 'cat-food',
        transaction_date: '2024-03-01',
        description: 'Coffee beans',
      }),
      makeTransaction({
        id: 't2',
        amount: 10,
        category_id: 'cat-food',
        transaction_date: '2024-03-10',
        notes: 'team LUNCH',
      }),
      makeTransaction({
        id: 't3',
        amount: 500,
        type: 'income',
        category_id: 'cat-pay',
        transaction_date: '2024-02-25',
      }),
      makeTransaction({ id: 't4', user_id: 'other-user', amount: 999 }),
    ]);
  });

  it('returns only the requested user rows, newest first', async () => {
    const result = await getTransactions(USER_ID);
    expect(result.map((t) => t.id)).toEqual(['t2', 't1', 't3']);
  });

  it('filters by type, category and date range', async () => {
    expect((await getTransactions(USER_ID, { type: 'income' })).map((t) => t.id)).toEqual(
      ['t3']
    );
    expect(
      (await getTransactions(USER_ID, { categoryId: 'cat-food' })).map((t) => t.id)
    ).toEqual(['t2', 't1']);
    expect(
      (
        await getTransactions(USER_ID, {
          startDate: '2024-03-01',
          endDate: '2024-03-05',
        })
      ).map((t) => t.id)
    ).toEqual(['t1']);
  });

  it('searches description and notes case-insensitively', async () => {
    expect((await getTransactions(USER_ID, { search: 'coffee' })).map((t) => t.id)).toEqual(
      ['t1']
    );
    expect((await getTransactions(USER_ID, { search: 'lunch' })).map((t) => t.id)).toEqual(
      ['t2']
    );
    expect(await getTransactions(USER_ID, { search: 'nothing' })).toEqual([]);
  });

  it('supports every sort order', async () => {
    expect((await getTransactions(USER_ID, { sortBy: 'oldest' })).map((t) => t.id)).toEqual(
      ['t3', 't1', 't2']
    );
    expect((await getTransactions(USER_ID, { sortBy: 'highest' })).map((t) => t.id)).toEqual(
      ['t3', 't1', 't2']
    );
    expect((await getTransactions(USER_ID, { sortBy: 'lowest' })).map((t) => t.id)).toEqual(
      ['t2', 't1', 't3']
    );
  });

  it('applies offset and limit', async () => {
    expect(
      (await getTransactions(USER_ID, { offset: 1, limit: 1 })).map((t) => t.id)
    ).toEqual(['t1']);
  });

  it('falls back to an Unknown category when the category is missing', async () => {
    await db.categories.clear();
    const [first] = await getTransactions(USER_ID, { limit: 1 });
    expect(first?.category.name).toBe('Unknown');
  });

  it('attaches the matching category', async () => {
    const [first] = await getTransactions(USER_ID, { limit: 1 });
    expect(first?.category.name).toBe('Food');
  });
});

describe('getTransaction', () => {
  it('returns null for an unknown id', async () => {
    expect(await getTransaction('missing')).toBeNull();
  });

  it('returns the transaction with its category', async () => {
    await db.categories.add(makeCategory({ id: 'cat-food', name: 'Food' }));
    await db.transactions.add(makeTransaction({ id: 't1', category_id: 'cat-food' }));

    expect((await getTransaction('t1'))?.category.name).toBe('Food');
  });

  it('falls back to an Unknown category', async () => {
    await db.transactions.add(makeTransaction({ id: 't1', category_id: 'gone' }));
    expect((await getTransaction('t1'))?.category.name).toBe('Unknown');
  });
});

describe('createTransaction', () => {
  it('stores a pending transaction and queues it for sync', async () => {
    const created = await createTransaction(USER_ID, {
      amount: 42,
      type: 'expense',
      category_id: 'cat-food',
      transaction_date: '2024-03-05',
    });

    expect(created.sync_status).toBe('pending');
    expect(await db.transactions.get(created.id)).toMatchObject({ amount: 42 });
    expect(addToQueue).toHaveBeenCalledWith(
      USER_ID,
      'create',
      'transactions',
      expect.objectContaining({ id: created.id })
    );
  });
});

describe('updateTransaction', () => {
  it('merges the input, marks the row pending and queues an update', async () => {
    await db.transactions.add(makeTransaction({ id: 't1', amount: 10 }));

    const updated = await updateTransaction(USER_ID, 't1', { amount: 99 });

    expect(updated).toMatchObject({ amount: 99, sync_status: 'pending' });
    expect(await db.transactions.get('t1')).toMatchObject({ amount: 99 });
    expect(addToQueue).toHaveBeenCalledWith(
      USER_ID,
      'update',
      'transactions',
      expect.objectContaining({ id: 't1', amount: 99 })
    );
  });

  it('throws when the transaction does not exist', async () => {
    await expect(updateTransaction(USER_ID, 'missing', {})).rejects.toThrow(
      'Transaction not found'
    );
    expect(addToQueue).not.toHaveBeenCalled();
  });
});

describe('deleteTransaction', () => {
  it('removes the row and queues a delete', async () => {
    await db.transactions.add(makeTransaction({ id: 't1' }));

    await deleteTransaction(USER_ID, 't1');

    expect(await db.transactions.get('t1')).toBeUndefined();
    expect(addToQueue).toHaveBeenCalledWith(USER_ID, 'delete', 'transactions', {
      id: 't1',
    });
  });
});

describe('getMonthlyStats', () => {
  it('sums income and expenses inside the month only', async () => {
    await db.transactions.bulkAdd([
      makeTransaction({ id: 't1', amount: 100, type: 'income', transaction_date: '2024-03-01' }),
      makeTransaction({ id: 't2', amount: 40, transaction_date: '2024-03-31' }),
      makeTransaction({ id: 't3', amount: 1000, transaction_date: '2024-04-01' }),
      makeTransaction({ id: 't4', user_id: 'other', amount: 5, transaction_date: '2024-03-15' }),
    ]);

    expect(await getMonthlyStats(USER_ID, 3, 2024)).toEqual({
      income: 100,
      expenses: 40,
      savings: 60,
    });
  });

  it('returns zeroes for an empty month', async () => {
    expect(await getMonthlyStats(USER_ID, 1, 2024)).toEqual({
      income: 0,
      expenses: 0,
      savings: 0,
    });
  });
});

describe('getDashboardStats', () => {
  it('combines all-time totals with the current month', async () => {
    const now = new Date();
    const thisMonth = (day: number) =>
      new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0]!;
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 3)
      .toISOString()
      .split('T')[0]!;

    await db.transactions.bulkAdd([
      makeTransaction({ id: 't1', amount: 200, type: 'income', transaction_date: thisMonth(2) }),
      makeTransaction({ id: 't2', amount: 50, transaction_date: thisMonth(3) }),
      makeTransaction({ id: 't3', amount: 25, transaction_date: lastYear }),
    ]);

    expect(await getDashboardStats(USER_ID)).toEqual({
      currentBalance: 125,
      totalIncome: 200,
      totalExpenses: 75,
      savings: 125,
      monthlyIncome: 200,
      monthlyExpenses: 50,
    });
  });
});

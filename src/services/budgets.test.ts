import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import {
  USER_ID,
  makeBudget,
  makeCategory,
  makeTransaction,
  resetDb,
} from '@/test/helpers';

const addToQueue = vi.fn();

vi.mock('@/sync/engine', () => ({
  syncEngine: { addToQueue: (...args: unknown[]) => addToQueue(...args) },
}));

const { createBudget, deleteBudget, getBudgets, updateBudget } = await import(
  './budgets'
);

beforeEach(async () => {
  await resetDb();
  addToQueue.mockReset();
});

describe('getBudgets', () => {
  it('returns budgets for the month with spending and percentage', async () => {
    await db.categories.add(makeCategory({ id: 'cat-food', name: 'Food' }));
    await db.budgets.bulkAdd([
      makeBudget({ id: 'b1', category_id: 'cat-food', amount: 200 }),
      makeBudget({ id: 'b2', category_id: 'cat-food', month: 4 }),
    ]);
    await db.transactions.bulkAdd([
      makeTransaction({ id: 't1', amount: 30, category_id: 'cat-food', transaction_date: '2024-03-01' }),
      makeTransaction({ id: 't2', amount: 20, category_id: 'cat-food', transaction_date: '2024-03-31' }),
      makeTransaction({ id: 't3', amount: 500, category_id: 'cat-food', transaction_date: '2024-04-02' }),
      makeTransaction({
        id: 't4',
        amount: 70,
        type: 'income',
        category_id: 'cat-food',
        transaction_date: '2024-03-10',
      }),
    ]);

    const result = await getBudgets(USER_ID, 3, 2024);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'b1',
      spent: 50,
      percentage: 25,
    });
    expect(result[0]?.category.name).toBe('Food');
  });

  it('ignores spending in other categories', async () => {
    await db.budgets.add(makeBudget({ id: 'b1', category_id: 'cat-food', amount: 100 }));
    await db.transactions.add(
      makeTransaction({ id: 't1', amount: 90, category_id: 'cat-other', transaction_date: '2024-03-05' })
    );

    expect((await getBudgets(USER_ID, 3, 2024))[0]?.spent).toBe(0);
  });

  it('falls back to an Unknown category and a zero percentage', async () => {
    await db.budgets.add(makeBudget({ id: 'b1', category_id: 'gone', amount: 0 }));

    const [budget] = await getBudgets(USER_ID, 3, 2024);
    expect(budget?.category.name).toBe('Unknown');
    expect(budget?.percentage).toBe(0);
  });

  it('returns an empty list when no budget exists for the month', async () => {
    expect(await getBudgets(USER_ID, 12, 2024)).toEqual([]);
  });
});

describe('createBudget', () => {
  it('stores a pending budget and queues a create', async () => {
    const created = await createBudget(USER_ID, {
      category_id: 'cat-food',
      amount: 150,
      month: 5,
      year: 2024,
    });

    expect(created).toMatchObject({ amount: 150, sync_status: 'pending' });
    expect(await db.budgets.get(created.id)).toMatchObject({ month: 5 });
    expect(addToQueue).toHaveBeenCalledWith(
      USER_ID,
      'create',
      'budgets',
      expect.objectContaining({ id: created.id })
    );
  });
});

describe('updateBudget', () => {
  it('merges the input and queues an update', async () => {
    await db.budgets.add(makeBudget({ id: 'b1', amount: 100 }));

    const updated = await updateBudget(USER_ID, 'b1', { amount: 250 });

    expect(updated).toMatchObject({ amount: 250, sync_status: 'pending' });
    expect(await db.budgets.get('b1')).toMatchObject({ amount: 250 });
    expect(addToQueue).toHaveBeenCalledWith(
      USER_ID,
      'update',
      'budgets',
      expect.objectContaining({ id: 'b1', amount: 250 })
    );
  });

  it('throws for an unknown budget', async () => {
    await expect(updateBudget(USER_ID, 'missing', { amount: 1 })).rejects.toThrow(
      'Budget not found'
    );
    expect(addToQueue).not.toHaveBeenCalled();
  });
});

describe('deleteBudget', () => {
  it('removes the budget and queues a delete', async () => {
    await db.budgets.add(makeBudget({ id: 'b1' }));

    await deleteBudget(USER_ID, 'b1');

    expect(await db.budgets.get('b1')).toBeUndefined();
    expect(addToQueue).toHaveBeenCalledWith(USER_ID, 'delete', 'budgets', {
      id: 'b1',
    });
  });
});

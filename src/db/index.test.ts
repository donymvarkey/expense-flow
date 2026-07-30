import { beforeEach, describe, expect, it } from 'vitest';
import { db, dedupeCategories, seedDefaultCategories } from './index';
import {
  USER_ID,
  makeBudget,
  makeCategory,
  makeQueueItem,
  makeTransaction,
  resetDb,
} from '@/test/helpers';

beforeEach(resetDb);

describe('dedupeCategories', () => {
  it('does nothing when there are no duplicates', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'c1', name: 'Food' }),
      makeCategory({ id: 'c2', name: 'Travel' }),
    ]);

    await dedupeCategories(USER_ID);

    expect(await db.categories.count()).toBe(2);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('keeps the earliest category and queues deletes for the duplicates', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'late', name: ' food ', created_at: '2024-02-01T00:00:00.000Z' }),
      makeCategory({ id: 'early', name: 'Food', created_at: '2024-01-01T00:00:00.000Z' }),
    ]);

    await dedupeCategories(USER_ID);

    expect((await db.categories.toArray()).map((c) => c.id)).toEqual(['early']);
    const queued = await db.syncQueue.toArray();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      action_type: 'delete',
      table_name: 'categories',
      payload: { id: 'late' },
    });
  });

  it('treats same-name categories of different types as distinct', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'c1', name: 'Other', type: 'expense' }),
      makeCategory({ id: 'c2', name: 'Other', type: 'income' }),
    ]);

    await dedupeCategories(USER_ID);

    expect(await db.categories.count()).toBe(2);
  });

  it('repoints transactions at the surviving category and queues them', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'early', name: 'Food', created_at: '2024-01-01T00:00:00.000Z' }),
      makeCategory({ id: 'late', name: 'Food', created_at: '2024-02-01T00:00:00.000Z' }),
    ]);
    await db.transactions.add(makeTransaction({ id: 't1', category_id: 'late' }));

    await dedupeCategories(USER_ID);

    expect(await db.transactions.get('t1')).toMatchObject({
      category_id: 'early',
      sync_status: 'pending',
    });
    const queued = await db.syncQueue.toArray();
    expect(
      queued.find((item) => item.table_name === 'transactions')
    ).toMatchObject({ action_type: 'update', payload: { id: 't1' } });
  });

  it('refreshes an existing pending queue item instead of adding a second one', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'early', name: 'Food', created_at: '2024-01-01T00:00:00.000Z' }),
      makeCategory({ id: 'late', name: 'Food', created_at: '2024-02-01T00:00:00.000Z' }),
    ]);
    await db.transactions.add(makeTransaction({ id: 't1', category_id: 'late' }));
    await db.syncQueue.add(
      makeQueueItem({
        id: 'q1',
        action_type: 'create',
        table_name: 'transactions',
        payload: { id: 't1', category_id: 'late' },
        status: 'failed',
        retry_count: 4,
      })
    );

    await dedupeCategories(USER_ID);

    const transactionItems = (await db.syncQueue.toArray()).filter(
      (item) => item.table_name === 'transactions'
    );
    expect(transactionItems).toHaveLength(1);
    expect(transactionItems[0]).toMatchObject({
      id: 'q1',
      status: 'pending',
      retry_count: 0,
      payload: { id: 't1', category_id: 'early' },
    });
  });

  it('does not re-queue a transaction that is already queued for deletion', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'early', name: 'Food', created_at: '2024-01-01T00:00:00.000Z' }),
      makeCategory({ id: 'late', name: 'Food', created_at: '2024-02-01T00:00:00.000Z' }),
    ]);
    await db.transactions.add(makeTransaction({ id: 't1', category_id: 'late' }));
    await db.syncQueue.add(
      makeQueueItem({
        id: 'q1',
        action_type: 'delete',
        table_name: 'transactions',
        payload: { id: 't1' },
      })
    );

    await dedupeCategories(USER_ID);

    const transactionItems = (await db.syncQueue.toArray()).filter(
      (item) => item.table_name === 'transactions'
    );
    expect(transactionItems).toHaveLength(1);
    expect(transactionItems[0]?.action_type).toBe('delete');
  });

  it('remaps budgets and drops the ones that collide after remapping', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'early', name: 'Food', created_at: '2024-01-01T00:00:00.000Z' }),
      makeCategory({ id: 'late', name: 'Food', created_at: '2024-02-01T00:00:00.000Z' }),
    ]);
    await db.budgets.bulkAdd([
      makeBudget({ id: 'keep', category_id: 'early', created_at: '2024-03-01T00:00:00.000Z' }),
      makeBudget({ id: 'dupe', category_id: 'late', created_at: '2024-03-02T00:00:00.000Z' }),
      makeBudget({ id: 'moved', category_id: 'late', month: 4, created_at: '2024-04-01T00:00:00.000Z' }),
    ]);

    await dedupeCategories(USER_ID);

    expect((await db.budgets.toArray()).map((b) => b.id).sort()).toEqual([
      'keep',
      'moved',
    ]);
    expect(await db.budgets.get('moved')).toMatchObject({
      category_id: 'early',
      sync_status: 'pending',
    });

    const budgetItems = (await db.syncQueue.toArray()).filter(
      (item) => item.table_name === 'budgets'
    );
    expect(
      budgetItems.map((item) => [item.action_type, item.payload['id']]).sort()
    ).toEqual([
      ['delete', 'dupe'],
      ['update', 'moved'],
    ]);
  });

  it('only touches the given user', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'a1', name: 'Food', user_id: 'other', created_at: '2024-01-01T00:00:00.000Z' }),
      makeCategory({ id: 'a2', name: 'Food', user_id: 'other', created_at: '2024-02-01T00:00:00.000Z' }),
    ]);

    await dedupeCategories(USER_ID);

    expect(await db.categories.count()).toBe(2);
  });
});

describe('seedDefaultCategories', () => {
  it('creates the default categories and queues them all for sync', async () => {
    await seedDefaultCategories(USER_ID);

    const categories = await db.categories.where('user_id').equals(USER_ID).toArray();
    expect(categories).toHaveLength(18);
    expect(categories.filter((c) => c.type === 'income')).toHaveLength(6);
    expect(categories.filter((c) => c.type === 'expense')).toHaveLength(12);
    expect(categories.every((c) => c.sync_status === 'pending')).toBe(true);

    const queued = await db.syncQueue.toArray();
    expect(queued).toHaveLength(18);
    expect(queued.every((item) => item.action_type === 'create')).toBe(true);
  });

  it('is a no-op when the user already has categories', async () => {
    await db.categories.add(makeCategory({ id: 'c1', name: 'Food' }));

    await seedDefaultCategories(USER_ID);

    expect(await db.categories.count()).toBe(1);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('does not duplicate when called concurrently', async () => {
    await Promise.all([
      seedDefaultCategories(USER_ID),
      seedDefaultCategories(USER_ID),
    ]);

    expect(await db.categories.count()).toBe(18);
  });
});

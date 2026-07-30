import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import {
  USER_ID,
  makeBudget,
  makeCategory,
  makeQueueItem,
  makeTransaction,
  resetDb,
} from '@/test/helpers';
import type { Budget, Category, Transaction } from '@/types';

type Row = Category | Transaction | Budget;

const upsert = vi.fn<(table: string, payload: Record<string, unknown>) => Promise<{ error: unknown }>>();
const remove = vi.fn<(table: string, id: unknown) => Promise<{ error: unknown }>>();
const getSession = vi.fn();
const remoteRows = new Map<string, Row[]>();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
    },
    from: (table: string) => ({
      upsert: (payload: Record<string, unknown>) => upsert(table, payload),
      delete: () => ({
        eq: (_column: string, value: unknown) => remove(table, value),
      }),
      select: () => ({
        eq: () => ({
          order: () => ({
            range: (from: number, to: number) =>
              Promise.resolve({
                data: (remoteRows.get(table) ?? []).slice(from, to + 1),
                error: null,
              }),
          }),
        }),
      }),
    }),
  },
}));

const { syncEngine } = await import('./engine');

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value: online,
    configurable: true,
  });
}

beforeEach(async () => {
  await resetDb();
  upsert.mockReset();
  remove.mockReset();
  getSession.mockReset();
  remoteRows.clear();
  upsert.mockResolvedValue({ error: null });
  remove.mockResolvedValue({ error: null });
  getSession.mockResolvedValue({
    data: { session: { user: { id: USER_ID } } },
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  setOnline(true);
});

describe('subscribe', () => {
  it('notifies listeners until they unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = syncEngine.subscribe(listener);

    setOnline(false);
    await syncEngine.addToQueue(USER_ID, 'create', 'transactions', { id: 't1' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await syncEngine.addToQueue(USER_ID, 'create', 'transactions', { id: 't2' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('addToQueue', () => {
  it('queues a pending item and does not sync while offline', async () => {
    setOnline(false);

    await syncEngine.addToQueue(USER_ID, 'create', 'transactions', { id: 't1' });

    const [item] = await db.syncQueue.toArray();
    expect(item).toMatchObject({
      user_id: USER_ID,
      action_type: 'create',
      table_name: 'transactions',
      status: 'pending',
      retry_count: 0,
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('flushes the item immediately while online', async () => {
    await db.transactions.add(makeTransaction({ id: 't1', sync_status: 'pending' }));

    await syncEngine.addToQueue(USER_ID, 'create', 'transactions', { id: 't1' });
    await vi.waitFor(async () => {
      expect(await db.syncQueue.count()).toBe(0);
    });

    expect(upsert).toHaveBeenCalledWith('transactions', { id: 't1' });
    expect(await db.transactions.get('t1')).toMatchObject({ sync_status: 'synced' });
  });
});

describe('processQueue', () => {
  it('returns without work while offline', async () => {
    setOnline(false);
    await db.syncQueue.add(makeQueueItem({ id: 'q1' }));

    await syncEngine.processQueue(USER_ID);

    expect(upsert).not.toHaveBeenCalled();
    expect(await db.syncQueue.count()).toBe(1);
  });

  it('resolves the user from the session when none is passed', async () => {
    await db.syncQueue.add(makeQueueItem({ id: 'q1' }));

    await syncEngine.processQueue();

    expect(getSession).toHaveBeenCalled();
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('does nothing when there is no session user', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await db.syncQueue.add(makeQueueItem({ id: 'q1' }));

    await syncEngine.processQueue();

    expect(upsert).not.toHaveBeenCalled();
    expect(await db.syncQueue.count()).toBe(1);
  });

  it('skips items belonging to other users', async () => {
    await db.syncQueue.add(makeQueueItem({ id: 'q1', user_id: 'other' }));

    await syncEngine.processQueue(USER_ID);

    expect(upsert).not.toHaveBeenCalled();
    expect(await db.syncQueue.count()).toBe(1);
  });

  it('pushes categories before transactions before budgets', async () => {
    await db.syncQueue.bulkAdd([
      makeQueueItem({ id: 'q1', table_name: 'budgets', payload: { id: 'b1' } }),
      makeQueueItem({ id: 'q2', table_name: 'transactions', payload: { id: 't1' } }),
      makeQueueItem({ id: 'q3', table_name: 'categories', payload: { id: 'c1' } }),
      makeQueueItem({ id: 'q4', table_name: 'profiles', payload: { id: 'p1' } }),
    ]);

    await syncEngine.processQueue(USER_ID);

    expect(upsert.mock.calls.map(([table]) => table)).toEqual([
      'categories',
      'transactions',
      'budgets',
      'profiles',
    ]);
  });

  it('orders items of the same table by creation time', async () => {
    await db.syncQueue.bulkAdd([
      makeQueueItem({
        id: 'q1',
        payload: { id: 'second' },
        created_at: '2024-03-02T00:00:00.000Z',
      }),
      makeQueueItem({
        id: 'q2',
        payload: { id: 'first' },
        created_at: '2024-03-01T00:00:00.000Z',
      }),
    ]);

    await syncEngine.processQueue(USER_ID);

    expect(upsert.mock.calls.map(([, payload]) => payload['id'])).toEqual([
      'first',
      'second',
    ]);
  });

  it('strips sync_status from create and update payloads', async () => {
    await db.syncQueue.bulkAdd([
      makeQueueItem({
        id: 'q1',
        action_type: 'create',
        payload: { id: 't1', sync_status: 'pending' },
      }),
      makeQueueItem({
        id: 'q2',
        action_type: 'update',
        payload: { id: 't2', sync_status: 'pending' },
        created_at: '2024-03-06T00:00:00.000Z',
      }),
    ]);

    await syncEngine.processQueue(USER_ID);

    expect(upsert).toHaveBeenNthCalledWith(1, 'transactions', { id: 't1' });
    expect(upsert).toHaveBeenNthCalledWith(2, 'transactions', { id: 't2' });
  });

  it('sends deletes to supabase by id', async () => {
    await db.syncQueue.add(
      makeQueueItem({ id: 'q1', action_type: 'delete', payload: { id: 't1' } })
    );

    await syncEngine.processQueue(USER_ID);

    expect(remove).toHaveBeenCalledWith('transactions', 't1');
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('keeps the item pending and increments retries when the push fails', async () => {
    upsert.mockResolvedValue({ error: new Error('boom') });
    await db.transactions.add(makeTransaction({ id: 't1', sync_status: 'pending' }));
    await db.syncQueue.add(makeQueueItem({ id: 'q1', payload: { id: 't1' } }));

    await syncEngine.processQueue(USER_ID);

    expect(await db.syncQueue.get('q1')).toMatchObject({
      status: 'pending',
      retry_count: 1,
    });
    expect(await db.transactions.get('t1')).toMatchObject({ sync_status: 'pending' });
  });

  it('marks the item and its record failed after five attempts', async () => {
    upsert.mockResolvedValue({ error: new Error('boom') });
    await db.transactions.add(makeTransaction({ id: 't1', sync_status: 'pending' }));
    await db.syncQueue.add(
      makeQueueItem({ id: 'q1', payload: { id: 't1' }, retry_count: 4 })
    );

    await syncEngine.processQueue(USER_ID);

    expect(await db.syncQueue.get('q1')).toMatchObject({
      status: 'failed',
      retry_count: 5,
    });
    expect(await db.transactions.get('t1')).toMatchObject({ sync_status: 'failed' });
  });

  it('coalesces a concurrent run into a single rerun', async () => {
    await db.syncQueue.add(makeQueueItem({ id: 'q1', payload: { id: 't1' } }));

    let release = () => {};
    upsert.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ error: null });
        })
    );

    const first = syncEngine.processQueue(USER_ID);
    await vi.waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    const second = syncEngine.processQueue(USER_ID);
    release();
    await Promise.all([first, second]);

    expect(await db.syncQueue.count()).toBe(0);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});

describe('getPendingCount / getFailedCount', () => {
  it('counts queue items by status', async () => {
    await db.syncQueue.bulkAdd([
      makeQueueItem({ id: 'q1', status: 'pending' }),
      makeQueueItem({ id: 'q2', status: 'pending' }),
      makeQueueItem({ id: 'q3', status: 'failed' }),
      makeQueueItem({ id: 'q4', status: 'processing' }),
    ]);

    expect(await syncEngine.getPendingCount()).toBe(2);
    expect(await syncEngine.getFailedCount()).toBe(1);
  });
});

describe('hydrateFromSupabase', () => {
  it('stores remote rows locally as synced', async () => {
    remoteRows.set('categories', [makeCategory({ id: 'c1', sync_status: 'pending' })]);
    remoteRows.set('transactions', [makeTransaction({ id: 't1', sync_status: 'pending' })]);
    remoteRows.set('budgets', [makeBudget({ id: 'b1', sync_status: 'pending' })]);

    await syncEngine.hydrateFromSupabase(USER_ID);

    expect(await db.categories.get('c1')).toMatchObject({ sync_status: 'synced' });
    expect(await db.transactions.get('t1')).toMatchObject({ sync_status: 'synced' });
    expect(await db.budgets.get('b1')).toMatchObject({ sync_status: 'synced' });
  });

  it('does not overwrite local rows with unsynced changes', async () => {
    await db.transactions.add(
      makeTransaction({ id: 't1', amount: 99, sync_status: 'pending' })
    );
    remoteRows.set('transactions', [makeTransaction({ id: 't1', amount: 10 })]);

    await syncEngine.hydrateFromSupabase(USER_ID);

    expect(await db.transactions.get('t1')).toMatchObject({ amount: 99 });
  });

  it('skips remote rows that are queued for deletion locally', async () => {
    await db.syncQueue.add(
      makeQueueItem({ id: 'q1', action_type: 'delete', payload: { id: 't1' } })
    );
    remoteRows.set('transactions', [makeTransaction({ id: 't1' })]);

    await syncEngine.hydrateFromSupabase(USER_ID);

    expect(await db.transactions.get('t1')).toBeUndefined();
  });

  it('drops synced local rows that no longer exist on the server', async () => {
    await db.transactions.bulkAdd([
      makeTransaction({ id: 'gone', sync_status: 'synced' }),
      makeTransaction({ id: 'local-only', sync_status: 'pending' }),
    ]);

    await syncEngine.hydrateFromSupabase(USER_ID);

    expect(await db.transactions.get('gone')).toBeUndefined();
    expect(await db.transactions.get('local-only')).toBeDefined();
  });

  it('pages through more than one thousand remote rows', async () => {
    remoteRows.set(
      'transactions',
      Array.from({ length: 1001 }, (_, index) =>
        makeTransaction({ id: `t${index}` })
      )
    );

    await syncEngine.hydrateFromSupabase(USER_ID);

    expect(await db.transactions.count()).toBe(1001);
  });

  it('dedupes categories pulled from the server', async () => {
    remoteRows.set('categories', [
      makeCategory({ id: 'early', name: 'Food', created_at: '2024-01-01T00:00:00.000Z' }),
      makeCategory({ id: 'late', name: 'food', created_at: '2024-02-01T00:00:00.000Z' }),
    ]);

    await syncEngine.hydrateFromSupabase(USER_ID);

    expect((await db.categories.toArray()).map((c) => c.id)).toEqual(['early']);
  });

  it('shares a single in-flight hydration per user', async () => {
    const first = syncEngine.hydrateFromSupabase(USER_ID);
    const second = syncEngine.hydrateFromSupabase(USER_ID);

    expect(second).toBe(first);
    await first;
  });
});

describe('resumeForUser', () => {
  it('requeues failed and processing items and flushes them', async () => {
    await db.syncQueue.bulkAdd([
      makeQueueItem({ id: 'q1', status: 'failed', retry_count: 5, payload: { id: 't1' } }),
      makeQueueItem({
        id: 'q2',
        status: 'processing',
        payload: { id: 't2' },
        created_at: '2024-03-06T00:00:00.000Z',
      }),
    ]);

    await syncEngine.resumeForUser(USER_ID);

    expect(await db.syncQueue.count()).toBe(0);
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('rebuilds queue items for unsynced records that lost their queue entry', async () => {
    setOnline(false);
    await db.categories.add(makeCategory({ id: 'c1', sync_status: 'pending' }));
    await db.transactions.add(makeTransaction({ id: 't1', sync_status: 'failed' }));
    await db.budgets.add(makeBudget({ id: 'b1', sync_status: 'synced' }));

    await syncEngine.resumeForUser(USER_ID);

    const queued = await db.syncQueue.toArray();
    expect(
      queued.map((item) => [item.table_name, item.payload['id']]).sort()
    ).toEqual([
      ['categories', 'c1'],
      ['transactions', 't1'],
    ]);
    expect(queued.every((item) => item.action_type === 'create')).toBe(true);
  });

  it('does not duplicate an existing queue entry when rebuilding', async () => {
    setOnline(false);
    await db.transactions.add(makeTransaction({ id: 't1', sync_status: 'pending' }));
    await db.syncQueue.add(makeQueueItem({ id: 'q1', payload: { id: 't1' } }));

    await syncEngine.resumeForUser(USER_ID);

    expect(await db.syncQueue.count()).toBe(1);
  });

  it('shares a single in-flight resume per user', async () => {
    const first = syncEngine.resumeForUser(USER_ID);
    const second = syncEngine.resumeForUser(USER_ID);

    expect(second).toBe(first);
    await first;
  });
});

describe('retryFailed', () => {
  it('resumes the signed-in user', async () => {
    await db.syncQueue.add(
      makeQueueItem({ id: 'q1', status: 'failed', payload: { id: 't1' } })
    );

    await syncEngine.retryFailed();

    expect(await db.syncQueue.count()).toBe(0);
    expect(upsert).toHaveBeenCalledWith('transactions', { id: 't1' });
  });

  it('is a no-op without a session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await db.syncQueue.add(makeQueueItem({ id: 'q1', status: 'failed' }));

    await syncEngine.retryFailed();

    expect(await db.syncQueue.get('q1')).toMatchObject({ status: 'failed' });
  });
});

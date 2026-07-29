import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { USER_ID, makeCategory, resetDb } from '@/test/helpers';

const addToQueue = vi.fn();

vi.mock('@/sync/engine', () => ({
  syncEngine: { addToQueue: (...args: unknown[]) => addToQueue(...args) },
}));

const {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} = await import('./categories');

beforeEach(async () => {
  await resetDb();
  addToQueue.mockReset();
});

describe('getCategories', () => {
  beforeEach(async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'c1', name: 'Travel' }),
      makeCategory({ id: 'c2', name: 'Food' }),
      makeCategory({ id: 'c3', name: 'Salary', type: 'income' }),
      makeCategory({ id: 'c4', name: 'Other user', user_id: 'other' }),
    ]);
  });

  it('returns the user categories sorted by name', async () => {
    expect((await getCategories(USER_ID)).map((c) => c.name)).toEqual([
      'Food',
      'Salary',
      'Travel',
    ]);
  });

  it('filters by type', async () => {
    expect((await getCategories(USER_ID, 'income')).map((c) => c.id)).toEqual(['c3']);
    expect((await getCategories(USER_ID, 'expense')).map((c) => c.id)).toEqual([
      'c2',
      'c1',
    ]);
  });
});

describe('createCategory', () => {
  it('trims the name, stores it as pending and queues a create', async () => {
    const created = await createCategory(USER_ID, {
      name: '  Groceries  ',
      type: 'expense',
    });

    expect(created).toMatchObject({ name: 'Groceries', sync_status: 'pending' });
    expect(await db.categories.get(created.id)).toMatchObject({ name: 'Groceries' });
    expect(addToQueue).toHaveBeenCalledWith(
      USER_ID,
      'create',
      'categories',
      expect.objectContaining({ id: created.id })
    );
  });

  it('rejects a blank name', async () => {
    await expect(
      createCategory(USER_ID, { name: '   ', type: 'expense' })
    ).rejects.toThrow('Category name is required');
  });

  it('rejects a duplicate name of the same type, ignoring case and padding', async () => {
    await db.categories.add(makeCategory({ id: 'c1', name: 'Food' }));

    await expect(
      createCategory(USER_ID, { name: ' food ', type: 'expense' })
    ).rejects.toThrow('A category with this name already exists');
    expect(addToQueue).not.toHaveBeenCalled();
  });

  it('allows the same name for a different type', async () => {
    await db.categories.add(makeCategory({ id: 'c1', name: 'Other' }));

    await expect(
      createCategory(USER_ID, { name: 'Other', type: 'income' })
    ).resolves.toMatchObject({ type: 'income' });
  });
});

describe('updateCategory', () => {
  it('renames a category and queues an update', async () => {
    await db.categories.add(makeCategory({ id: 'c1', name: 'Food' }));

    const updated = await updateCategory(USER_ID, 'c1', { name: ' Dining ' });

    expect(updated).toMatchObject({ name: 'Dining', sync_status: 'pending' });
    expect(addToQueue).toHaveBeenCalledWith(
      USER_ID,
      'update',
      'categories',
      expect.objectContaining({ id: 'c1', name: 'Dining' })
    );
  });

  it('keeps the existing name when none is provided', async () => {
    await db.categories.add(makeCategory({ id: 'c1', name: 'Food' }));

    expect(await updateCategory(USER_ID, 'c1', { color: '#fff' })).toMatchObject({
      name: 'Food',
      color: '#fff',
    });
  });

  it('throws for an unknown category', async () => {
    await expect(updateCategory(USER_ID, 'missing', {})).rejects.toThrow(
      'Category not found'
    );
  });

  it('rejects a whitespace-only rename', async () => {
    await db.categories.add(makeCategory({ id: 'c1', name: 'Food' }));

    await expect(updateCategory(USER_ID, 'c1', { name: '  ' })).rejects.toThrow(
      'Category name is required'
    );
  });

  it('rejects a rename that collides with another category', async () => {
    await db.categories.bulkAdd([
      makeCategory({ id: 'c1', name: 'Food' }),
      makeCategory({ id: 'c2', name: 'Travel' }),
    ]);

    await expect(updateCategory(USER_ID, 'c2', { name: 'food' })).rejects.toThrow(
      'A category with this name already exists'
    );
  });
});

describe('deleteCategory', () => {
  it('removes the category and queues a delete', async () => {
    await db.categories.add(makeCategory({ id: 'c1' }));

    await deleteCategory(USER_ID, 'c1');

    expect(await db.categories.get('c1')).toBeUndefined();
    expect(addToQueue).toHaveBeenCalledWith(USER_ID, 'delete', 'categories', {
      id: 'c1',
    });
  });
});

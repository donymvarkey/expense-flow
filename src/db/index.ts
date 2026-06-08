import Dexie, { type Table } from 'dexie';
import type { Transaction, Category, Budget, SyncQueueItem } from '@/types';

export class ExpenseFlowDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('ExpenseFlowDB');

    this.version(1).stores({
      transactions:
        'id, user_id, type, category_id, transaction_date, created_at, sync_status, [user_id+type], [user_id+category_id], [user_id+transaction_date]',
      categories: 'id, user_id, type, name, sync_status, [user_id+type]',
      budgets:
        'id, user_id, category_id, month, year, sync_status, [user_id+month+year]',
      syncQueue: 'id, user_id, status, table_name, created_at',
    });
  }
}

export const db = new ExpenseFlowDB();

// Guards against concurrent seeding within the same page session. useAuth can
// invoke seeding from both getSession() and onAuthStateChange() almost
// simultaneously; without this lock both calls observe an empty table and each
// insert the full default set, producing duplicates.
const seedingInProgress = new Set<string>();

// Remove duplicate categories that share the same type + name for a user,
// keeping the earliest-created one. Any transactions pointing at a removed
// duplicate are remapped to the surviving category so history stays intact.
export async function dedupeCategories(userId: string): Promise<void> {
  await db.transaction('rw', db.categories, db.transactions, async () => {
    const categories = await db.categories
      .where('user_id')
      .equals(userId)
      .toArray();

    const keepByKey = new Map<string, Category>();
    const remap = new Map<string, string>(); // duplicateId -> keptId
    const toDelete: string[] = [];

    // Earliest created_at wins as the canonical category.
    const sorted = [...categories].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );

    for (const cat of sorted) {
      const key = `${cat.type}:${cat.name.toLowerCase()}`;
      const kept = keepByKey.get(key);
      if (!kept) {
        keepByKey.set(key, cat);
      } else {
        remap.set(cat.id, kept.id);
        toDelete.push(cat.id);
      }
    }

    if (toDelete.length === 0) return;

    // Repoint transactions that referenced a removed duplicate.
    const affected = await db.transactions
      .where('user_id')
      .equals(userId)
      .toArray();
    const updates = affected
      .filter((t) => remap.has(t.category_id))
      .map((t) => ({ ...t, category_id: remap.get(t.category_id)! }));
    if (updates.length > 0) {
      await db.transactions.bulkPut(updates);
    }

    await db.categories.bulkDelete(toDelete);
  });
}

// Seed default categories for a new user
export async function seedDefaultCategories(userId: string) {
  if (seedingInProgress.has(userId)) return;
  seedingInProgress.add(userId);
  try {
    // Clean up any duplicates left behind by older versions of this code.
    await dedupeCategories(userId);

    await db.transaction('rw', db.categories, async () => {
      const existing = await db.categories
        .where('user_id')
        .equals(userId)
        .count();
      if (existing > 0) return;

      const expenseCategories = [
        { name: 'Food', icon: 'utensils', color: '#ef4444' },
        { name: 'Travel', icon: 'plane', color: '#f97316' },
        { name: 'Shopping', icon: 'shopping-bag', color: '#eab308' },
        { name: 'Bills', icon: 'receipt', color: '#84cc16' },
        { name: 'Entertainment', icon: 'film', color: '#06b6d4' },
        { name: 'Healthcare', icon: 'heart-pulse', color: '#8b5cf6' },
        { name: 'Education', icon: 'graduation-cap', color: '#ec4899' },
        { name: 'Rent', icon: 'home', color: '#6366f1' },
        { name: 'Fuel', icon: 'fuel', color: '#14b8a6' },
        { name: 'Groceries', icon: 'apple', color: '#22c55e' },
        { name: 'Subscriptions', icon: 'credit-card', color: '#a855f7' },
        { name: 'Other', icon: 'more-horizontal', color: '#6b7280' },
      ];

      const incomeCategories = [
        { name: 'Salary', icon: 'banknote', color: '#22c55e' },
        { name: 'Freelance', icon: 'laptop', color: '#06b6d4' },
        { name: 'Business', icon: 'briefcase', color: '#8b5cf6' },
        { name: 'Investments', icon: 'trending-up', color: '#f97316' },
        { name: 'Bonus', icon: 'gift', color: '#eab308' },
        { name: 'Other', icon: 'more-horizontal', color: '#6b7280' },
      ];

      const now = new Date().toISOString();

      const categories: Category[] = [
        ...expenseCategories.map((c) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: 'expense' as const,
          created_at: now,
          sync_status: 'pending' as const,
        })),
        ...incomeCategories.map((c) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: 'income' as const,
          created_at: now,
          sync_status: 'pending' as const,
        })),
      ];

      await db.categories.bulkAdd(categories);
    });
  } finally {
    seedingInProgress.delete(userId);
  }
}

import type { Table } from 'dexie';
import type { Category, TransactionType } from '@/types';

/** Every table is scoped by `user_id`, so this read is the base of most queries. */
export function rowsForUser<T>(
  table: Table<T, string>,
  userId: string
): Promise<T[]> {
  return table.where('user_id').equals(userId).toArray();
}

/**
 * Stand-in used when a transaction or budget references a category that is not
 * available locally (for example when it was deleted on another device).
 */
export function unknownCategory(options: {
  id: string;
  userId: string;
  type: TransactionType;
  createdAt: string;
}): Category {
  return {
    id: options.id,
    user_id: options.userId,
    name: 'Unknown',
    type: options.type,
    created_at: options.createdAt,
    sync_status: 'synced',
  };
}

import { generateId } from '@/lib/utils';
import type { SyncQueueItem } from '@/types';

/** Builds a pending queue item; every local write funnels through this shape. */
export function createSyncQueueItem(options: {
  userId: string;
  actionType: SyncQueueItem['action_type'];
  tableName: string;
  payload: Record<string, unknown>;
  createdAt?: string;
}): SyncQueueItem {
  return {
    id: generateId(),
    user_id: options.userId,
    action_type: options.actionType,
    table_name: options.tableName,
    payload: options.payload,
    status: 'pending',
    retry_count: 0,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

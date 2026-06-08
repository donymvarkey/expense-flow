import { db } from '@/db';
import { supabase } from '@/lib/supabase';
import type { SyncQueueItem } from '@/types';
import { generateId } from '@/lib/utils';

class SyncEngine {
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async addToQueue(
    userId: string,
    actionType: SyncQueueItem['action_type'],
    tableName: string,
    payload: Record<string, unknown>
  ) {
    const item: SyncQueueItem = {
      id: generateId(),
      user_id: userId,
      action_type: actionType,
      table_name: tableName,
      payload,
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    await db.syncQueue.add(item);
    this.notify();

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    if (!navigator.onLine) return;

    this.isProcessing = true;

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .sortBy('created_at');

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  private async processItem(item: SyncQueueItem) {
    try {
      await db.syncQueue.update(item.id, { status: 'processing' });

      switch (item.action_type) {
        case 'create':
          await this.handleCreate(item);
          break;
        case 'update':
          await this.handleUpdate(item);
          break;
        case 'delete':
          await this.handleDelete(item);
          break;
      }

      // Remove from queue on success
      await db.syncQueue.delete(item.id);

      // Update sync status on the local record
      const recordId = item.payload['id'] as string;
      if (recordId) {
        const table = db.table(item.table_name);
        const record = await table.get(recordId);
        if (record) {
          await table.update(recordId, { sync_status: 'synced' });
        }
      }
    } catch (error) {
      console.error('Sync failed for item:', item.id, error);
      const newRetryCount = item.retry_count + 1;

      if (newRetryCount >= 5) {
        await db.syncQueue.update(item.id, {
          status: 'failed',
          retry_count: newRetryCount,
        });

        // Mark the local record as failed
        const recordId = item.payload['id'] as string;
        if (recordId) {
          const table = db.table(item.table_name);
          const record = await table.get(recordId);
          if (record) {
            await table.update(recordId, { sync_status: 'failed' });
          }
        }
      } else {
        await db.syncQueue.update(item.id, {
          status: 'pending',
          retry_count: newRetryCount,
        });
      }
    }
  }

  private async handleCreate(item: SyncQueueItem) {
    const payload = { ...item.payload };
    delete payload['sync_status'];

    const { error } = await supabase
      .from(item.table_name)
      .insert(payload);

    if (error) throw error;
  }

  private async handleUpdate(item: SyncQueueItem) {
    const payload = { ...item.payload };
    const id = payload['id'] as string;
    delete payload['sync_status'];
    delete payload['id'];

    const { error } = await supabase
      .from(item.table_name)
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  private async handleDelete(item: SyncQueueItem) {
    const id = item.payload['id'] as string;

    const { error } = await supabase
      .from(item.table_name)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.where('status').equals('pending').count();
  }

  async getFailedCount(): Promise<number> {
    return db.syncQueue.where('status').equals('failed').count();
  }

  async retryFailed() {
    await db.syncQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retry_count: 0 });
    this.processQueue();
  }
}

export const syncEngine = new SyncEngine();

// Process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncEngine.processQueue();
  });
}

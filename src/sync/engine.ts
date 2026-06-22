import { db } from "@/db";
import { supabase } from "@/lib/supabase";
import type { SyncQueueItem } from "@/types";
import { generateId } from "@/lib/utils";

class SyncEngine {
  private isProcessing = false;
  private rerunRequested = false;
  private resumeInProgress = new Map<string, Promise<void>>();
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
    actionType: SyncQueueItem["action_type"],
    tableName: string,
    payload: Record<string, unknown>,
  ) {
    const item: SyncQueueItem = {
      id: generateId(),
      user_id: userId,
      action_type: actionType,
      table_name: tableName,
      payload,
      status: "pending",
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    await db.syncQueue.add(item);
    this.notify();

    // Try to process immediately if online
    if (navigator.onLine) {
      void this.processQueue(userId);
    }
  }

  async processQueue(userId?: string) {
    if (this.isProcessing) {
      this.rerunRequested = true;
      return;
    }
    if (!navigator.onLine) return;

    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user.id;
    }
    if (!userId) return;

    this.isProcessing = true;

    try {
      const pendingItems = (await db.syncQueue
        .where("user_id")
        .equals(userId)
        .and((item) => item.status === "pending")
        .toArray()).sort((a, b) => {
          const priority: Record<string, number> = {
            categories: 0,
            transactions: 1,
            budgets: 2,
          };
          return (
            (priority[a.table_name] ?? 3) - (priority[b.table_name] ?? 3) ||
            a.created_at.localeCompare(b.created_at)
          );
        });

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
      this.notify();

      if (this.rerunRequested) {
        this.rerunRequested = false;
        void this.processQueue(userId);
      }
    }
  }

  private async processItem(item: SyncQueueItem) {
    try {
      await db.syncQueue.update(item.id, { status: "processing" });

      switch (item.action_type) {
        case "create":
          await this.handleCreate(item);
          break;
        case "update":
          await this.handleUpdate(item);
          break;
        case "delete":
          await this.handleDelete(item);
          break;
      }

      // Remove from queue on success
      await db.syncQueue.delete(item.id);

      // Update sync status on the local record
      const recordId = item.payload["id"] as string;
      if (recordId) {
        const table = db.table(item.table_name);
        const record = await table.get(recordId);
        if (record) {
          await table.update(recordId, { sync_status: "synced" });
        }
      }
    } catch (error) {
      console.error("Sync failed for item:", item.id, error);
      const newRetryCount = item.retry_count + 1;

      if (newRetryCount >= 5) {
        await db.syncQueue.update(item.id, {
          status: "failed",
          retry_count: newRetryCount,
        });

        // Mark the local record as failed
        const recordId = item.payload["id"] as string;
        if (recordId) {
          const table = db.table(item.table_name);
          const record = await table.get(recordId);
          if (record) {
            await table.update(recordId, { sync_status: "failed" });
          }
        }
      } else {
        await db.syncQueue.update(item.id, {
          status: "pending",
          retry_count: newRetryCount,
        });
      }
    }
  }

  private async handleCreate(item: SyncQueueItem) {
    const payload = { ...item.payload };
    delete payload["sync_status"];

    const { error } = await supabase
      .from(item.table_name)
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;
  }

  private async handleUpdate(item: SyncQueueItem) {
    const payload = { ...item.payload };
    delete payload["sync_status"];

    const { error } = await supabase
      .from(item.table_name)
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;
  }

  private async handleDelete(item: SyncQueueItem) {
    const id = item.payload["id"] as string;

    const { error } = await supabase
      .from(item.table_name)
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.where("status").equals("pending").count();
  }

  async getFailedCount(): Promise<number> {
    return db.syncQueue.where("status").equals("failed").count();
  }

  resumeForUser(userId: string): Promise<void> {
    const existing = this.resumeInProgress.get(userId);
    if (existing) return existing;

    const resume = this.doResumeForUser(userId).finally(() => {
      this.resumeInProgress.delete(userId);
    });
    this.resumeInProgress.set(userId, resume);
    return resume;
  }

  private async doResumeForUser(userId: string) {
    await this.rebuildMissingQueueItems(userId);

    await db.syncQueue
      .where("user_id")
      .equals(userId)
      .and((item) => item.status === "failed" || item.status === "processing")
      .modify({ status: "pending", retry_count: 0 });

    this.notify();
    await this.processQueue(userId);
  }

  private async rebuildMissingQueueItems(userId: string) {
    const queued = await db.syncQueue
      .where("user_id")
      .equals(userId)
      .toArray();
    const queuedRecords = new Set(
      queued.map((item) => `${item.table_name}:${String(item.payload["id"])}`),
    );

    const tables = ["categories", "transactions", "budgets"] as const;
    const missing: SyncQueueItem[] = [];

    for (const tableName of tables) {
      const records = await db
        .table(tableName)
        .where("user_id")
        .equals(userId)
        .and((record) => record.sync_status !== "synced")
        .toArray();

      for (const record of records) {
        const key = `${tableName}:${String(record.id)}`;
        if (queuedRecords.has(key)) continue;

        missing.push({
          id: generateId(),
          user_id: userId,
          action_type: "create",
          table_name: tableName,
          payload: { ...record },
          status: "pending",
          retry_count: 0,
          created_at: record.created_at ?? new Date().toISOString(),
        });
        queuedRecords.add(key);
      }
    }

    if (missing.length > 0) {
      await db.syncQueue.bulkAdd(missing);
    }
  }

  async retryFailed() {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (userId) await this.resumeForUser(userId);
  }
}

export const syncEngine = new SyncEngine();

// Process queue when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id;
      if (userId) void syncEngine.resumeForUser(userId);
    });
  });
}

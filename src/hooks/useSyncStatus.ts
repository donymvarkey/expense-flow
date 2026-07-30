import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '@/sync/engine';
import { logError } from '@/lib/errors';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const pending = await syncEngine.getPendingCount();
      const failed = await syncEngine.getFailedCount();
      setPendingCount(pending);
      setFailedCount(failed);
      setLastError(syncEngine.getLastError());
    } catch (error) {
      logError('sync-status:refresh', error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = syncEngine.subscribe(() => {
      void refresh();
    });
    return unsubscribe;
  }, [refresh]);

  return {
    pendingCount,
    failedCount,
    lastError,
    retryFailed: syncEngine.retryFailed.bind(syncEngine),
    refresh,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '@/sync/engine';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const refresh = useCallback(async () => {
    const pending = await syncEngine.getPendingCount();
    const failed = await syncEngine.getFailedCount();
    setPendingCount(pending);
    setFailedCount(failed);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = syncEngine.subscribe(refresh);
    return unsubscribe;
  }, [refresh]);

  return {
    pendingCount,
    failedCount,
    retryFailed: syncEngine.retryFailed.bind(syncEngine),
    refresh,
  };
}

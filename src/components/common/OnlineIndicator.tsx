import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { WifiOff, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnlineIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingCount } = useSyncStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-medium safe-area-top',
        isOnline
          ? 'bg-amber-500/10 text-amber-500'
          : 'bg-red-500/10 text-red-400'
      )}
    >
      {isOnline ? (
        <>
          <Cloud className="h-3.5 w-3.5" />
          <span>{pendingCount} changes pending sync</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline — changes saved locally</span>
        </>
      )}
    </div>
  );
}

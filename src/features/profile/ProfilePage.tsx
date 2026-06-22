import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useSettings, type Theme } from '@/hooks/useSettings';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { CURRENCIES, cn } from '@/lib/utils';
import {
  User,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Tag,
  PieChart,
  Wifi,
  WifiOff,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Coins,
  Check,
} from 'lucide-react';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { pendingCount, failedCount, retryFailed } = useSyncStatus();
  const { theme, setTheme, currency, setCurrency } = useSettings();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const activeCurrency = CURRENCIES.find((c) => c.code === currency);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="transition-page px-4 pt-12 pb-24 md:px-8 md:pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">Personal space</p>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Profile</h1>

      {/* User Info */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10">
            <User className="h-6 w-6 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <p className="font-semibold">{user?.full_name || 'User'}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card className="mb-6">
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold">Sync Status</h3>
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 ? (
              <Cloud className="h-4 w-4 text-amber-500" />
            ) : (
              <Cloud className="h-4 w-4 text-emerald-500" />
            )}
            <span className="text-sm">
              {pendingCount === 0
                ? 'All synced'
                : `${pendingCount} pending`}
            </span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudOff className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  {failedCount} failed
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={retryFailed}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mb-6">
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold">Appearance</h3>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors',
                  theme === option.value
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="mb-6">
        <CardContent>
          <button
            onClick={() => setCurrencyOpen(true)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="text-[hsl(var(--muted-foreground))]">
              <Coins className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">Currency</span>
              <span className="block text-xs text-[hsl(var(--muted-foreground))]">
                {activeCurrency
                  ? `${activeCurrency.label} (${activeCurrency.symbol})`
                  : currency}
              </span>
            </span>
            <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              {currency}
            </span>
            <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        </CardContent>
      </Card>

      {/* Menu */}
      <div className="glass-panel space-y-1 rounded-3xl p-2">
        <MenuItem
          icon={<Tag className="h-5 w-5" />}
          label="Categories"
          onClick={() => navigate('/categories')}
        />
        <MenuItem
          icon={<PieChart className="h-5 w-5" />}
          label="Budgets"
          onClick={() => navigate('/budgets')}
        />
      </div>

      {/* Currency picker */}
      <Dialog
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        title="Select Currency"
      >
        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code);
                setCurrencyOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[hsl(var(--accent))]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold">
                {c.symbol}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{c.label}</span>
                <span className="block text-xs text-[hsl(var(--muted-foreground))]">
                  {c.code}
                </span>
              </span>
              {currency === c.code && (
                <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
              )}
            </button>
          ))}
        </div>
      </Dialog>

      {/* Sign Out */}
      <div className="mt-8">
        <Button
          variant="outline"
          className="w-full text-red-400 border-red-400/20 hover:bg-red-500/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-white/5 active:bg-[hsl(var(--accent))]"
    >
      <span className="text-[hsl(var(--muted-foreground))]">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {subtitle && (
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</span>
      )}
      <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
    </button>
  );
}

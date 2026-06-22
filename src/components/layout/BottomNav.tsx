import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="glass-panel fixed bottom-3 left-3 right-3 z-40 rounded-[1.6rem] safe-area-bottom md:hidden">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'relative flex min-w-16 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 transition-all',
                isActive
                  ? 'bg-emerald-500/12 text-emerald-500 shadow-inner shadow-emerald-500/5'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]')} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

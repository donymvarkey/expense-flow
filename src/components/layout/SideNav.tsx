import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  User,
  Wallet,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="glass-panel fixed bottom-5 left-5 top-5 z-40 hidden w-60 flex-col rounded-[2rem] px-4 py-6 md:flex">
      {/* Brand */}
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-2xl">
          <Wallet className="h-5 w-5 text-slate-950" />
        </div>
        <div>
          <span className="block text-base font-bold tracking-tight">ExpenseFlow</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">Money, clarified</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-500/12 text-emerald-500 shadow-inner shadow-emerald-500/5'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-white/5 hover:text-[hsl(var(--foreground))]'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Add transaction */}
      <button
        onClick={() => navigate('/add')}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-3 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" />
        Add Transaction
      </button>
    </aside>
  );
}

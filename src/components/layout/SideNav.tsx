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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-6 md:flex">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-2 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))]">
          <Wallet className="h-5 w-5 text-[hsl(var(--primary-foreground))]" />
        </div>
        <span className="text-lg font-bold">ExpenseFlow</span>
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
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
        className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" />
        Add Transaction
      </button>
    </aside>
  );
}

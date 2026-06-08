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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-md safe-area-bottom md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors',
                isActive
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

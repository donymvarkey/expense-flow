import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

/** Primary destinations shared by the bottom bar and the sidebar. */
export const navItems: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const NAV_ACTIVE_CLASS =
  'bg-emerald-500/12 text-emerald-500 shadow-inner shadow-emerald-500/5';

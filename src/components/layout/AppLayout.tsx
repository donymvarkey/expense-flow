import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { FAB } from './FAB';
import { OnlineIndicator } from '../common/OnlineIndicator';

export function AppLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed -left-24 top-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-28 top-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <OnlineIndicator />
      <SideNav />
      <main className="relative z-10 pb-28 md:pb-8 md:pl-72">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  );
}

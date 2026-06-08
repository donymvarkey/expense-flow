import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { FAB } from './FAB';
import { OnlineIndicator } from '../common/OnlineIndicator';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <OnlineIndicator />
      <SideNav />
      <main className="pb-20 md:pb-4 md:pl-60">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  );
}

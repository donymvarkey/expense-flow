import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FAB() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/add')}
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 md:hidden"
      aria-label="Add transaction"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FAB() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/add')}
      className="brand-mark fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl text-slate-950 transition-all hover:-translate-y-1 active:scale-95 md:hidden"
      aria-label="Add transaction"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 md:bottom-4 md:left-auto md:right-4 md:w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const Icon = {
    default: Info,
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[toast.variant || 'default'];

  return (
    <div
      className={cn(
        'glass-panel flex items-start gap-3 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-2',
        toast.variant === 'error' && 'border-[hsl(var(--destructive))]/50',
        toast.variant === 'success' && 'border-emerald-500/50'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          toast.variant === 'success' && 'text-emerald-500',
          toast.variant === 'error' && 'text-red-500',
          toast.variant === 'info' && 'text-blue-500'
        )}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {toast.description}
          </p>
        )}
      </div>
      <button onClick={onClose} className="shrink-0">
        <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      </button>
    </div>
  );
}

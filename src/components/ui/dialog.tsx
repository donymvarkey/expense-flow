import { type ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Dialog({ open, onClose, children, title, className }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={cn(
          'glass-panel relative z-50 w-full max-w-lg rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 md:rounded-[2rem] md:slide-in-from-bottom-0',
          className
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-[hsl(var(--accent))]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--accent))]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white',
            variant === 'destructive'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90'
          )}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}

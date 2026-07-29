import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export function BackButton({ onClick }: { onClick?: () => void }) {
  const navigate = useNavigate();

  return (
    <IconButton onClick={onClick ?? (() => navigate(-1))} aria-label="Go back">
      <ArrowLeft className="h-5 w-5" />
    </IconButton>
  );
}

interface PageHeaderProps {
  title?: string;
  titleClassName?: string;
  /** Rendered on the trailing edge of the header. */
  actions?: ReactNode;
  onBack?: () => void;
}

export function PageHeader({
  title,
  titleClassName,
  actions,
  onBack,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BackButton {...(onBack ? { onClick: onBack } : {})} />
        {title && (
          <h1 className={cn('text-xl font-bold', titleClassName)}>{title}</h1>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

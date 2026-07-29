import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Class applied while this option is active. Defaults to the primary accent. */
  selectedClassName?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `block` fills the available width, `pill` hugs its content. */
  shape?: 'block' | 'pill';
  className?: string;
  itemClassName?: string;
}

const SHAPE_CLASSES = {
  block: {
    container: 'flex rounded-xl bg-[hsl(var(--muted))] p-1',
    item: 'flex-1 rounded-lg py-2.5 text-sm',
  },
  pill: {
    container: 'flex rounded-full bg-[hsl(var(--muted))] p-1',
    item: 'rounded-full px-4 py-1.5 text-xs',
  },
} as const;

/** Mutually exclusive option group rendered as a segmented switch. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  shape = 'block',
  className,
  itemClassName,
}: SegmentedControlProps<T>) {
  const shapeClasses = SHAPE_CLASSES[shape];

  return (
    <div className={cn(shapeClasses.container, className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            shapeClasses.item,
            'font-medium transition-colors',
            value === option.value
              ? (option.selectedClassName ??
                  'bg-[hsl(var(--primary))] text-white')
              : 'text-[hsl(var(--muted-foreground))]',
            itemClassName
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

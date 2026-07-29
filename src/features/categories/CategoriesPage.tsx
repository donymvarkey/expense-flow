import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { getCategories, createCategory, deleteCategory } from '@/services/categories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { FieldLabel } from '@/components/ui/field-label';
import { IconButton } from '@/components/ui/icon-button';
import {
  SegmentedControl,
  type SegmentedOption,
} from '@/components/ui/segmented-control';
import { PageHeader } from '@/components/common/PageHeader';
import { TRANSACTION_TYPE_SELECTED_CLASS } from '@/lib/transaction-display';
import type { Category, TransactionType } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const ACTIVE_TAB_CLASS = 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]';

const TYPE_TABS: SegmentedOption<TransactionType>[] = [
  { value: 'expense', label: 'Expense', selectedClassName: ACTIVE_TAB_CLASS },
  { value: 'income', label: 'Income', selectedClassName: ACTIVE_TAB_CLASS },
];

export function CategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<TransactionType>('expense');

  // Form
  const [name, setName] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('#22c55e');

  useEffect(() => {
    if (!user) return;
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    const cats = await getCategories(user.id);
    setCategories(cats);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      toast({ title: 'Name is required', variant: 'error' });
      return;
    }

    try {
      await createCategory(user.id, { name: name.trim(), type: newType, color });
      toast({ title: 'Category created', variant: 'success' });
      setShowAdd(false);
      setName('');
      loadCategories();
    } catch {
      toast({ title: 'Failed to create category', variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteCategory(user.id, deleteId);
      toast({ title: 'Category deleted', variant: 'success' });
      setDeleteId(null);
      loadCategories();
    } catch {
      toast({ title: 'Failed to delete', variant: 'error' });
    }
  };

  const filtered = categories.filter((c) => c.type === activeType);

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
  ];

  return (
    <div className="transition-page px-4 pt-12 pb-24 md:pt-6">
      <PageHeader
        title="Categories"
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        }
      />

      {/* Type Toggle */}
      <SegmentedControl
        className="mb-4"
        itemClassName="py-2"
        options={TYPE_TABS}
        value={activeType}
        onChange={setActiveType}
      />

      {/* Category List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[hsl(var(--muted))]" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: cat.color || '#6b7280' }}
                />
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <IconButton
                  variant="ghost-destructive"
                  onClick={() => setDeleteId(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="New Category">
        <div className="space-y-4">
          <Input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="flex gap-2">
              {TYPE_TABS.map(({ value, label }) => (
                <Chip
                  key={value}
                  className="px-4"
                  selected={newType === value}
                  selectedClassName={TRANSACTION_TYPE_SELECTED_CLASS[value]}
                  onClick={() => setNewType(value)}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Color</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform',
                    color === c && 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[hsl(var(--background))]'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate}>
            Create Category
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description="Transactions using this category won't be deleted, but will show as uncategorized."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

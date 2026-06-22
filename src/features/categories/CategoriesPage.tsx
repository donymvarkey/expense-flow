import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { getCategories, createCategory, deleteCategory } from '@/services/categories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');

  // Form
  const [name, setName] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
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
    <div className="transition-page px-4 pt-12 pb-24 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-[hsl(var(--accent))]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Categories</h1>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Type Toggle */}
      <div className="mb-4 flex rounded-xl bg-[hsl(var(--muted))] p-1">
        <button
          onClick={() => setActiveType('expense')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
            activeType === 'expense'
              ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]'
              : 'text-[hsl(var(--muted-foreground))]'
          )}
        >
          Expense
        </button>
        <button
          onClick={() => setActiveType('income')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
            activeType === 'income'
              ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]'
              : 'text-[hsl(var(--muted-foreground))]'
          )}
        >
          Income
        </button>
      </div>

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
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">Type</p>
            <div className="flex gap-2">
              <button
                onClick={() => setNewType('expense')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium',
                  newType === 'expense'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                Expense
              </button>
              <button
                onClick={() => setNewType('income')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium',
                  newType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                Income
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">Color</p>
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

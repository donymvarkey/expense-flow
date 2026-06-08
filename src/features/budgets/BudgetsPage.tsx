import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { getBudgets, createBudget, deleteBudget } from '@/services/budgets';
import { getCategories } from '@/services/categories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { BudgetWithCategory, Category } from '@/types';
import { ArrowLeft, Plus, PieChart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BudgetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [b, cats] = await Promise.all([
      getBudgets(user.id, month, year),
      getCategories(user.id, 'expense'),
    ]);
    setBudgets(b);
    setCategories(cats);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !selectedCategory || !amount) {
      toast({ title: 'Fill in all fields', variant: 'error' });
      return;
    }

    try {
      await createBudget(user.id, {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        month,
        year,
      });
      toast({ title: 'Budget created', variant: 'success' });
      setShowAdd(false);
      setSelectedCategory('');
      setAmount('');
      loadData();
    } catch {
      toast({ title: 'Failed to create budget', variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteBudget(user.id, deleteId);
      toast({ title: 'Budget deleted', variant: 'success' });
      setDeleteId(null);
      loadData();
    } catch {
      toast({ title: 'Failed to delete', variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-12 md:pt-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="transition-page px-4 pt-12 pb-24 md:pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-[hsl(var(--accent))]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Budgets</h1>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Overview */}
      {budgets.length > 0 && (
        <Card className="mb-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="mt-1 text-lg font-bold">
                  {formatCurrency(totalSpent)}{' '}
                  <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
                    / {formatCurrency(totalBudget)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={<PieChart className="h-12 w-12" />}
          title="No budgets set"
          description="Create monthly budgets to track spending"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              Create Budget
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const isOver = budget.percentage > 100;
            const isNear = budget.percentage > 80 && !isOver;

            return (
              <Card key={budget.id}>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: budget.category.color }}
                      />
                      <span className="text-sm font-medium">{budget.category.name}</span>
                    </div>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isOver ? 'text-red-400' : isNear ? 'text-amber-400' : 'text-emerald-400'
                      )}
                    >
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[hsl(var(--muted))]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  {isOver && (
                    <p className="mt-2 text-xs text-red-400">
                      Over budget by {formatCurrency(budget.spent - budget.amount)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Budget Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="New Budget">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    selectedCategory === cat.id
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Budget Amount
            </p>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
          <Button className="w-full" onClick={handleCreate}>
            Create Budget
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        description="Are you sure you want to delete this budget?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

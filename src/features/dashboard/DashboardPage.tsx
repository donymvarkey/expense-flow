import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats } from '@/services/transactions';
import { getBudgets } from '@/services/budgets';
import { getTransactions } from '@/services/transactions';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DashboardStats, BudgetWithCategory, TransactionWithCategory } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const now = new Date();
        const [dashStats, monthlyBudgets, recent] = await Promise.all([
          getDashboardStats(user!.id),
          getBudgets(user!.id, now.getMonth() + 1, now.getFullYear()),
          getTransactions(user!.id, { limit: 5, sortBy: 'newest' }),
        ]);
        setStats(dashStats);
        setBudgets(monthlyBudgets);
        setRecentTransactions(recent);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="transition-page px-4 pt-12 md:pt-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Good {getGreeting()},</p>
        <h1 className="text-xl font-bold">{user?.full_name || 'there'} 👋</h1>
      </div>

      {/* Balance Card */}
      <Card className="mb-4 bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border-emerald-500/20">
        <CardContent>
          <p className="text-sm text-emerald-400/80">Current Balance</p>
          <p className="mt-1 text-3xl font-bold text-emerald-50">
            {formatCurrency(stats?.currentBalance || 0)}
          </p>
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400">
                {formatCurrency(stats?.monthlyIncome || 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-400">
                {formatCurrency(stats?.monthlyExpenses || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Income"
          value={formatCurrency(stats?.totalIncome || 0)}
          color="emerald"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
          label="Expenses"
          value={formatCurrency(stats?.totalExpenses || 0)}
          color="red"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-blue-500" />}
          label="Monthly Spend"
          value={formatCurrency(stats?.monthlyExpenses || 0)}
          color="blue"
        />
        <StatCard
          icon={<PiggyBank className="h-4 w-4 text-purple-500" />}
          label="Savings"
          value={formatCurrency(stats?.savings || 0)}
          color="purple"
        />
      </div>

      {/* Budget Progress */}
      {budgets.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Budgets</h2>
            <button
              onClick={() => navigate('/budgets')}
              className="text-xs text-[hsl(var(--primary))]"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 3).map((budget) => (
              <BudgetProgressCard key={budget.id} budget={budget} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs text-[hsl(var(--primary))]"
          >
            View all
          </button>
        </div>
        {recentTransactions.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No transactions yet. Add your first expense!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                onClick={() => navigate(`/transactions/${t.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color: _color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className="rounded-lg bg-[hsl(var(--muted))] p-2">{icon}</div>
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetProgressCard({ budget }: { budget: BudgetWithCategory }) {
  const isOverBudget = budget.percentage > 100;
  const isNearLimit = budget.percentage > 80 && !isOverBudget;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{budget.category.name}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[hsl(var(--muted))]">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOverBudget
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionCard({
  transaction,
  onClick,
}: {
  transaction: TransactionWithCategory;
  onClick: () => void;
}) {
  const isExpense = transaction.type === 'expense';

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-left transition-colors active:bg-[hsl(var(--accent))]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: (transaction.category.color || '#6b7280') + '20' }}
      >
        <span className="text-sm">
          {isExpense ? '↓' : '↑'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">
          {transaction.description || transaction.category.name}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {formatRelativeDate(transaction.transaction_date)}
        </p>
      </div>
      <span
        className={cn(
          'text-sm font-semibold',
          isExpense ? 'text-red-400' : 'text-emerald-400'
        )}
      >
        {isExpense ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </span>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-4 pt-12 md:pt-6">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-6 h-6 w-36" />
      <Skeleton className="mb-4 h-32 w-full rounded-xl" />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

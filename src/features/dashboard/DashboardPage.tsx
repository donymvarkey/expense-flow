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
  Sparkles,
  ChevronRight,
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
    <div className="transition-page px-4 pt-12 md:px-8 md:pt-8">
      {/* Header */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">
            <Sparkles className="h-3.5 w-3.5" />
            Good {getGreeting()}
          </div>
          <h1 className="text-gradient text-3xl font-bold tracking-tight md:text-4xl">
            {user?.full_name || 'Your money'}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Here&apos;s your financial pulse.</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="balance-card relative mb-4 overflow-hidden p-6 text-white md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-white/10" />
        <CardContent className="relative">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">Available balance</p>
            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-50 backdrop-blur-md">Live overview</div>
          </div>
          <p className="text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
            {formatCurrency(stats?.currentBalance || 0)}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 md:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur-md">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/65"><ArrowUpRight className="h-3.5 w-3.5" /> Income</div>
              <span className="text-sm font-semibold text-white">{formatCurrency(stats?.monthlyIncome || 0)}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/10 px-3 py-2.5 backdrop-blur-md">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/65"><ArrowDownRight className="h-3.5 w-3.5" /> Spent</div>
              <span className="text-sm font-semibold text-white">{formatCurrency(stats?.monthlyExpenses || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Income"
          value={formatCurrency(stats?.totalIncome || 0)}
          accent="bg-emerald-500/12"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
          label="Expenses"
          value={formatCurrency(stats?.totalExpenses || 0)}
          accent="bg-rose-500/12"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-blue-500" />}
          label="Monthly Spend"
          value={formatCurrency(stats?.monthlyExpenses || 0)}
          accent="bg-blue-500/12"
        />
        <StatCard
          icon={<PiggyBank className="h-4 w-4 text-purple-500" />}
          label="Savings"
          value={formatCurrency(stats?.savings || 0)}
          accent="bg-violet-500/12"
        />
      </div>

      {/* Budget Progress */}
      {budgets.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Budgets</h2>
            <button
              onClick={() => navigate('/budgets')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-500"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
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
          <h2 className="text-base font-semibold tracking-tight">Recent transactions</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-500"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
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
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="p-4">
      <CardContent className="flex items-center gap-3">
        <div className={cn('rounded-2xl p-2.5', accent)}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</p>
          <p className="truncate text-sm font-bold tracking-tight md:text-base">{value}</p>
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
      className="glass-panel flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/20 active:scale-[0.99]"
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
    <div className="page-shell px-4 pt-12 md:px-8 md:pt-8">
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

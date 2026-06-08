import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/db';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface CategorySpending {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'6m' | '12m'>('6m');

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user, period]);

  const loadAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    const transactions = await db.transactions
      .where('user_id')
      .equals(user.id)
      .toArray();

    const categories = await db.categories
      .where('user_id')
      .equals(user.id)
      .toArray();

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const months = period === '6m' ? 6 : 12;

    // Monthly data
    const monthly: MonthlyData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = d.toISOString().split('T')[0]!;
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]!;

      const monthTransactions = transactions.filter(
        (t) => t.transaction_date >= startDate && t.transaction_date <= endDate
      );

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      monthly.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses,
      });
    }

    setMonthlyData(monthly);

    // Category breakdown
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const total = expenseTransactions.reduce((s, t) => s + t.amount, 0);
    setTotalExpenses(total);
    setTotalIncome(
      transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0)
    );

    const categoryTotals = new Map<string, number>();
    for (const t of expenseTransactions) {
      categoryTotals.set(
        t.category_id,
        (categoryTotals.get(t.category_id) || 0) + t.amount
      );
    }

    const catData: CategorySpending[] = [];
    for (const [catId, amount] of categoryTotals) {
      const cat = categoryMap.get(catId);
      catData.push({
        name: cat?.name || 'Other',
        amount,
        color: cat?.color || '#6b7280',
        percentage: total > 0 ? (amount / total) * 100 : 0,
      });
    }

    catData.sort((a, b) => b.amount - a.amount);
    setCategoryData(catData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="px-4 pt-12 md:pt-6">
        <Skeleton className="mb-6 h-8 w-24" />
        <Skeleton className="mb-4 h-48 rounded-xl" />
        <Skeleton className="mb-4 h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="transition-page px-4 pt-12 pb-24 md:pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Analytics</h1>
        <div className="flex rounded-full bg-[hsl(var(--muted))] p-1">
          <button
            onClick={() => setPeriod('6m')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              period === '6m'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            6M
          </button>
          <button
            onClick={() => setPeriod('12m')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              period === '12m'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            12M
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card>
          <CardContent>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Income</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Expenses</p>
            <p className="mt-1 text-lg font-bold text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="mb-4">
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold">Monthly Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(215, 20.2%, 65.1%)' }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(222.2, 84%, 4.9%)',
                    border: '1px solid hsl(217.2, 32.6%, 17.5%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income vs Expense Bar Chart */}
      <Card className="mb-4">
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold">Income vs Expense</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(215, 20.2%, 65.1%)' }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(222.2, 84%, 4.9%)',
                    border: '1px solid hsl(217.2, 32.6%, 17.5%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="mb-4">
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <>
              <div className="mx-auto h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="amount"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 6).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-xs">{cat.name}</span>
                    <span className="text-xs font-medium">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No expense data yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

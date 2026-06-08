import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTransactions } from '@/services/transactions';
import { getCategories } from '@/services/categories';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { TransactionWithCategory, Category } from '@/types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Receipt,
  X,
} from 'lucide-react';

const BATCH_SIZE = 20;

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export function TransactionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadTransactions = useCallback(
    async (reset = false) => {
      if (!user) return;
      const currentOffset = reset ? 0 : offset;

      const results = await getTransactions(user.id, {
        type: typeFilter,
        categoryId: categoryFilter,
        search: search || undefined,
        sortBy,
        limit: BATCH_SIZE,
        offset: currentOffset,
      });

      if (reset) {
        setTransactions(results);
        setOffset(BATCH_SIZE);
      } else {
        setTransactions((prev) => [...prev, ...results]);
        setOffset(currentOffset + BATCH_SIZE);
      }

      setHasMore(results.length === BATCH_SIZE);
      setLoading(false);
    },
    [user, typeFilter, categoryFilter, search, sortBy, offset]
  );

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadTransactions(true);
    getCategories(user.id).then(setCategories);
  }, [user, typeFilter, categoryFilter, search, sortBy]);

  const lastItemRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadTransactions(false);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [hasMore, loading, loadTransactions]
  );

  return (
    <div className="transition-page px-4 pt-12 md:pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Transactions</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'rounded-full p-2',
            showFilters ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--accent))]'
          )}
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3">
        <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1 bg-transparent text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-4 space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          {/* Type */}
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">Type</p>
            <div className="flex gap-2">
              {[undefined, 'expense', 'income'].map((t) => (
                <button
                  key={t || 'all'}
                  onClick={() => setTypeFilter(t as 'income' | 'expense' | undefined)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    typeFilter === t
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter(undefined)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium',
                  !categoryFilter
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    categoryFilter === cat.id
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              <ArrowUpDown className="mr-1 inline h-3 w-3" />
              Sort
            </p>
            <div className="flex flex-wrap gap-2">
              {(['newest', 'oldest', 'highest', 'lowest'] as SortOption[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium capitalize',
                    sortBy === s
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="No transactions"
          description="Start by adding your first transaction"
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t, i) => (
            <div
              key={t.id}
              ref={i === transactions.length - 1 ? lastItemRef : undefined}
            >
              <button
                onClick={() => navigate(`/transactions/${t.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-left transition-colors active:bg-[hsl(var(--accent))]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: (t.category.color || '#6b7280') + '20',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: t.category.color }}>
                    {t.category.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.description || t.category.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatRelativeDate(t.transaction_date)}
                    </p>
                    {t.sync_status === 'pending' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    )}
                    {t.sync_status === 'failed' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    t.type === 'expense' ? 'text-red-400' : 'text-emerald-400'
                  )}
                >
                  {t.type === 'expense' ? '-' : '+'}
                  {formatCurrency(t.amount)}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

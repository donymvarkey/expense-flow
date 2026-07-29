export type BudgetLevel = 'ok' | 'near' | 'over';

/** Spending above the budget is `over`, above 80% is `near`. */
export function getBudgetLevel(percentage: number): BudgetLevel {
  if (percentage > 100) return 'over';
  if (percentage > 80) return 'near';
  return 'ok';
}

export const BUDGET_BAR_CLASS: Record<BudgetLevel, string> = {
  ok: 'bg-emerald-500',
  near: 'bg-amber-500',
  over: 'bg-red-500',
};

export const BUDGET_TEXT_CLASS: Record<BudgetLevel, string> = {
  ok: 'text-emerald-400',
  near: 'text-amber-400',
  over: 'text-red-400',
};

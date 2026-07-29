// Date helpers shared by services and feature pages. All transaction dates are
// stored as `YYYY-MM-DD` strings, so ranges compare lexicographically.

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/** Inclusive first/last day of the given month. `month` is 1-based. */
export function getMonthRange(year: number, month: number): DateRange {
  return {
    startDate: toISODate(new Date(year, month - 1, 1)),
    endDate: toISODate(new Date(year, month, 0)),
  };
}

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

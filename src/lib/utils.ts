import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Supported currencies with display labels. Locale is used for proper
// number/symbol formatting per currency.
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'en-IE' },
  { code: 'GBP', label: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

// Module-level active currency. Updated by the settings provider so that all
// existing formatCurrency() call sites automatically reflect the user's choice.
let activeCurrency: CurrencyCode = 'USD';

export function setActiveCurrency(code: CurrencyCode) {
  activeCurrency = code;
}

export function formatCurrency(amount: number, currency?: CurrencyCode): string {
  const code = currency ?? activeCurrency;
  const config = CURRENCIES.find((c) => c.code === code);
  const locale = config?.locale ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
}

export function generateId(): string {
  return crypto.randomUUID();
}

import { createContext, useContext } from 'react';
import { type CurrencyCode } from '@/lib/utils';

export type Theme = 'light' | 'dark' | 'system';

export const THEME_KEY = 'expenseflow-theme';
export const CURRENCY_KEY = 'expenseflow-currency';

export interface SettingsContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'dark';
}

export function getStoredCurrency(): CurrencyCode {
  return (localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null) ?? 'USD';
}

export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  // Keep the browser/PWA chrome in sync with the active theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
  }
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}

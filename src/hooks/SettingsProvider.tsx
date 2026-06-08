import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { setActiveCurrency, type CurrencyCode } from '@/lib/utils';
import {
  SettingsContext,
  THEME_KEY,
  CURRENCY_KEY,
  applyTheme,
  getStoredTheme,
  getStoredCurrency,
  type Theme,
} from './useSettings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [currency, setCurrencyState] = useState<CurrencyCode>(getStoredCurrency);

  // Apply currency synchronously so formatCurrency() reflects it during the
  // initial render of children, not just after effects run.
  setActiveCurrency(currency);

  // Apply theme on mount and whenever it changes.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // React to OS theme changes while on "system".
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    localStorage.setItem(CURRENCY_KEY, next);
    setActiveCurrency(next);
    setCurrencyState(next);
  }, []);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, currency, setCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

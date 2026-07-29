import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CURRENCIES,
  cn,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  generateId,
  setActiveCurrency,
} from './utils';

afterEach(() => {
  setActiveCurrency('USD');
  vi.useRealTimers();
});

describe('cn', () => {
  it('merges class names and drops falsy values', () => {
    const isActive = false;
    expect(cn('a', isActive && 'b', undefined, 'c')).toBe('a c');
  });

  it('lets later tailwind classes win over conflicting earlier ones', () => {
    expect(cn('p-2 text-sm', 'p-4')).toBe('text-sm p-4');
  });
});

describe('formatCurrency', () => {
  it('formats using the explicitly passed currency', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
  });

  it('uses the active currency when none is passed', () => {
    setActiveCurrency('GBP');
    expect(formatCurrency(10)).toBe('£10.00');
  });

  it('formats every supported currency without throwing', () => {
    for (const currency of CURRENCIES) {
      expect(formatCurrency(1, currency.code)).toContain('1');
    }
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-5, 'USD')).toBe('-$5.00');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    expect(formatDate('2024-03-05T12:00:00.000Z')).toBe('Mar 5, 2024');
  });

  it('formats a Date instance', () => {
    expect(formatDate(new Date(Date.UTC(2024, 11, 31, 12)))).toBe(
      'Dec 31, 2024'
    );
  });
});

describe('formatRelativeDate', () => {
  it('returns Today, Yesterday and day counts for recent dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T12:00:00.000Z'));

    expect(formatRelativeDate('2024-03-10T09:00:00.000Z')).toBe('Today');
    expect(formatRelativeDate('2024-03-09T09:00:00.000Z')).toBe('Yesterday');
    expect(formatRelativeDate('2024-03-06T09:00:00.000Z')).toBe('4 days ago');
  });

  it('falls back to an absolute date once a week has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T12:00:00.000Z'));

    expect(formatRelativeDate('2024-03-01T12:00:00.000Z')).toBe('Mar 1, 2024');
  });
});

describe('generateId', () => {
  it('generates unique uuids', () => {
    const first = generateId();
    const second = generateId();

    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(first).not.toBe(second);
  });
});

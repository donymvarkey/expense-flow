import { describe, expect, it } from 'vitest';
import {
  budgetSchema,
  categorySchema,
  forgotPasswordSchema,
  loginSchema,
  quickAddSchema,
  registerSchema,
  resetPasswordSchema,
  transactionSchema,
} from './validations';

function firstIssue(result: { success: boolean; error?: { issues: { message: string; path: (string | number | symbol)[] }[] } }) {
  return result.error?.issues[0];
}

describe('loginSchema', () => {
  it('accepts a valid credential pair', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: 'secret' }).success
    ).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret',
    });
    expect(firstIssue(result)?.message).toBe('Please enter a valid email');
  });

  it('rejects a short password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '12345' });
    expect(firstIssue(result)?.message).toBe(
      'Password must be at least 6 characters'
    );
  });
});

describe('registerSchema', () => {
  const valid = {
    email: 'a@b.com',
    password: 'secret',
    confirmPassword: 'secret',
    full_name: 'Ada',
  };

  it('accepts matching passwords', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('reports mismatched passwords on confirmPassword', () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: 'other',
    });
    expect(firstIssue(result)?.message).toBe("Passwords don't match");
    expect(firstIssue(result)?.path).toEqual(['confirmPassword']);
  });

  it('rejects a one-character name', () => {
    const result = registerSchema.safeParse({ ...valid, full_name: 'A' });
    expect(firstIssue(result)?.message).toBe(
      'Name must be at least 2 characters'
    );
  });
});

describe('forgotPasswordSchema / resetPasswordSchema', () => {
  it('validates the forgot-password email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(
      true
    );
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });

  it('requires the reset passwords to match', () => {
    expect(
      resetPasswordSchema.safeParse({
        password: 'secret',
        confirmPassword: 'secret',
      }).success
    ).toBe(true);

    const result = resetPasswordSchema.safeParse({
      password: 'secret',
      confirmPassword: 'nope',
    });
    expect(firstIssue(result)?.message).toBe("Passwords don't match");
  });
});

describe('transactionSchema', () => {
  const valid = {
    amount: 12.5,
    type: 'expense' as const,
    category_id: 'cat-1',
    transaction_date: '2024-03-01',
  };

  it('accepts the minimal required fields', () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all optional fields', () => {
    expect(
      transactionSchema.safeParse({
        ...valid,
        description: 'Lunch',
        notes: 'with team',
        payment_method: 'card',
        tags: ['work'],
      }).success
    ).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    expect(firstIssue(transactionSchema.safeParse({ ...valid, amount: 0 }))?.message).toBe(
      'Amount must be positive'
    );
  });

  it('rejects an empty category', () => {
    expect(
      firstIssue(transactionSchema.safeParse({ ...valid, category_id: '' }))
        ?.message
    ).toBe('Please select a category');
  });

  it('rejects unknown enum values', () => {
    expect(
      transactionSchema.safeParse({ ...valid, type: 'transfer' }).success
    ).toBe(false);
    expect(
      transactionSchema.safeParse({ ...valid, payment_method: 'crypto' }).success
    ).toBe(false);
  });
});

describe('quickAddSchema', () => {
  it('requires a positive amount and a category', () => {
    expect(
      quickAddSchema.safeParse({ amount: 5, category_id: 'cat-1' }).success
    ).toBe(true);
    expect(
      quickAddSchema.safeParse({ amount: -1, category_id: 'cat-1' }).success
    ).toBe(false);
    expect(quickAddSchema.safeParse({ amount: 5, category_id: '' }).success).toBe(
      false
    );
  });
});

describe('categorySchema', () => {
  it('requires a name and a valid type', () => {
    expect(categorySchema.safeParse({ name: 'Food', type: 'expense' }).success).toBe(
      true
    );
    expect(
      firstIssue(categorySchema.safeParse({ name: '', type: 'expense' }))?.message
    ).toBe('Category name is required');
    expect(categorySchema.safeParse({ name: 'Food', type: 'other' }).success).toBe(
      false
    );
  });
});

describe('budgetSchema', () => {
  const valid = { category_id: 'cat-1', amount: 100, month: 3, year: 2024 };

  it('accepts an in-range budget', () => {
    expect(budgetSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    expect(firstIssue(budgetSchema.safeParse({ ...valid, amount: 0 }))?.message).toBe(
      'Budget amount must be positive'
    );
  });

  it('rejects out-of-range months and years', () => {
    expect(budgetSchema.safeParse({ ...valid, month: 0 }).success).toBe(false);
    expect(budgetSchema.safeParse({ ...valid, month: 13 }).success).toBe(false);
    expect(budgetSchema.safeParse({ ...valid, year: 2019 }).success).toBe(false);
    expect(budgetSchema.safeParse({ ...valid, year: 2101 }).success).toBe(false);
  });
});

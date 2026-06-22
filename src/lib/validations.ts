import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Please select a category'),
  description: z.string().optional(),
  notes: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']).optional(),
  tags: z.array(z.string()).optional(),
  transaction_date: z.string(),
});

export const quickAddSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category_id: z.string().min(1, 'Please select a category'),
  notes: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const budgetSchema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  amount: z.number().positive('Budget amount must be positive'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type QuickAddInput = z.infer<typeof quickAddSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;

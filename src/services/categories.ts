import { db } from '@/db';
import { rowsForUser } from '@/db/queries';
import { syncEngine } from '@/sync/engine';
import { generateId } from '@/lib/utils';
import type { Category } from '@/types';
import type { CategoryInput } from '@/lib/validations';

export async function getCategories(
  userId: string,
  type?: 'income' | 'expense'
): Promise<Category[]> {
  let categories = await rowsForUser(db.categories, userId);

  if (type) {
    categories = categories.filter((c) => c.type === type);
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategoryMap(
  userId: string
): Promise<Map<string, Category>> {
  const categories = await rowsForUser(db.categories, userId);
  return new Map(categories.map((c) => [c.id, c]));
}

function isSameCategoryName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

async function assertNameAvailable(
  userId: string,
  name: string,
  type: Category['type'],
  excludeId?: string
): Promise<void> {
  const categories = await rowsForUser(db.categories, userId);
  const duplicate = categories.some(
    (category) =>
      category.id !== excludeId &&
      category.type === type &&
      isSameCategoryName(category.name, name)
  );
  if (duplicate) throw new Error('A category with this name already exists');
}

export async function createCategory(
  userId: string,
  input: CategoryInput
): Promise<Category> {
  const normalizedName = input.name.trim();
  if (!normalizedName) throw new Error('Category name is required');

  await assertNameAvailable(userId, normalizedName, input.type);

  const category: Category = {
    id: generateId(),
    user_id: userId,
    name: normalizedName,
    type: input.type,
    icon: input.icon,
    color: input.color,
    created_at: new Date().toISOString(),
    sync_status: 'pending',
  };

  await db.categories.add(category);
  await syncEngine.addToQueue(userId, 'create', 'categories', { ...category });

  return category;
}

export async function updateCategory(
  userId: string,
  id: string,
  input: Partial<CategoryInput>
): Promise<Category> {
  const existing = await db.categories.get(id);
  if (!existing) throw new Error('Category not found');

  const normalizedName = input.name?.trim() ?? existing.name;
  if (!normalizedName) throw new Error('Category name is required');

  await assertNameAvailable(
    userId,
    normalizedName,
    input.type ?? existing.type,
    id
  );

  const updated: Category = {
    ...existing,
    ...input,
    name: normalizedName,
    sync_status: 'pending',
  };

  await db.categories.put(updated);
  await syncEngine.addToQueue(userId, 'update', 'categories', { ...updated });

  return updated;
}

export async function deleteCategory(
  userId: string,
  id: string
): Promise<void> {
  await db.categories.delete(id);
  await syncEngine.addToQueue(userId, 'delete', 'categories', { id });
}

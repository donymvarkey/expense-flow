import { db } from '@/db';
import { syncEngine } from '@/sync/engine';
import { generateId } from '@/lib/utils';
import type { Category } from '@/types';
import type { CategoryInput } from '@/lib/validations';

export async function getCategories(
  userId: string,
  type?: 'income' | 'expense'
): Promise<Category[]> {
  let categories = await db.categories.where('user_id').equals(userId).toArray();

  if (type) {
    categories = categories.filter((c) => c.type === type);
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCategory(
  userId: string,
  input: CategoryInput
): Promise<Category> {
  const normalizedName = input.name.trim();
  if (!normalizedName) throw new Error('Category name is required');

  const duplicate = (await db.categories
    .where('user_id')
    .equals(userId)
    .toArray()).some(
    (category) =>
      category.type === input.type &&
      category.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );
  if (duplicate) throw new Error('A category with this name already exists');

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

  const duplicate = (await db.categories
    .where('user_id')
    .equals(userId)
    .toArray()).some(
    (category) =>
      category.id !== id &&
      category.type === (input.type ?? existing.type) &&
      category.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );
  if (duplicate) throw new Error('A category with this name already exists');

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

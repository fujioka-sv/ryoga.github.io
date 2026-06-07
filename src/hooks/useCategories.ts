import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Category, TransactionType } from '../types'

export function useCategories(type?: TransactionType) {
  const categories = useLiveQuery(
    () => type
      ? db.categories.where('type').equals(type).sortBy('order')
      : db.categories.toArray(),
    [type],
  ) ?? []
  return categories
}

export async function addCategory(name: string, type: TransactionType) {
  const existing = await db.categories.where('type').equals(type).toArray()
  const maxOrder = existing.reduce((m, c) => Math.max(m, c.order), -1)
  await db.categories.add({ name, type, order: maxOrder + 1 })
}

export async function updateCategory(id: number, name: string) {
  await db.categories.update(id, { name })
}

export async function deleteCategory(id: number) {
  await db.categories.delete(id)
}

export async function reorderCategories(items: Category[]) {
  await db.categories.bulkPut(items.map((c, i) => ({ ...c, order: i })))
}

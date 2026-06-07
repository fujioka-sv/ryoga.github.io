import Dexie, { type Table } from 'dexie'
import type { Transaction, Category, RecurringExpense } from '../types'

class KakeiLogDB extends Dexie {
  transactions!: Table<Transaction>
  categories!: Table<Category>
  recurringExpenses!: Table<RecurringExpense>

  constructor() {
    super('KakeiLogDB')
    this.version(1).stores({
      transactions: '++id, date, type, categoryId',
      categories: '++id, type, order',
    })
    this.version(2).stores({
      transactions: '++id, date, type, categoryId',
      categories: '++id, type, order',
      recurringExpenses: '++id, categoryId, enabled, nextDueDate',
    })
  }
}

export const db = new KakeiLogDB()

const DEFAULT_EXPENSE_CATEGORIES = [
  '食費', '外食', '日用品', '交通費', '住居費',
  '水道光熱費', '通信費', '医療費', '娯楽', '衣服',
  '交際費', 'サブスク', 'その他',
]
const DEFAULT_INCOME_CATEGORIES = ['給与', 'ボーナス', '副業', '還付金', 'その他']

export async function seedCategories() {
  const count = await db.categories.count()
  if (count > 0) return

  const expenseItems: Category[] = DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({
    name, type: 'expense', order: i,
  }))
  const incomeItems: Category[] = DEFAULT_INCOME_CATEGORIES.map((name, i) => ({
    name, type: 'income', order: i,
  }))
  await db.categories.bulkAdd([...expenseItems, ...incomeItems])
}

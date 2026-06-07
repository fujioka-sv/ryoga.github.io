import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Transaction } from '../types'

export function useMonthTransactions(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-31`
  return useLiveQuery(
    () => db.transactions
      .where('date').between(from, to, true, true)
      .sortBy('date'),
    [year, month],
  ) ?? []
}

export function useRecentTransactions(limit = 5) {
  return useLiveQuery(
    () => db.transactions.orderBy('date').reverse().limit(limit).toArray(),
    [],
  ) ?? []
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString()
  await db.transactions.add({ ...tx, createdAt: now, updatedAt: now })
}

export async function updateTransaction(id: number, tx: Partial<Transaction>) {
  await db.transactions.update(id, { ...tx, updatedAt: new Date().toISOString() })
}

export async function deleteTransaction(id: number) {
  await db.transactions.delete(id)
}

export function useAllTransactions() {
  return useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) ?? []
}

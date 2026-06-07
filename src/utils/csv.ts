import Papa from 'papaparse'
import { db } from '../db/database'
import type { Transaction } from '../types'

export async function exportCSV() {
  const transactions = await db.transactions.orderBy('date').toArray()
  const categories = await db.categories.toArray()
  const catMap = Object.fromEntries(categories.map(c => [c.id!, c.name]))

  const rows = transactions.map(t => ({
    日付: t.date,
    種別: t.type === 'income' ? '収入' : '支出',
    金額: t.amount,
    カテゴリ: catMap[t.categoryId] ?? '',
    支払い方法: t.paymentMethod,
    メモ: t.memo,
    作成日時: t.createdAt,
  }))

  const csv = Papa.unparse(rows, { header: true })
  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kakeilog_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importCSV(file: File): Promise<{ added: number; errors: number }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const categories = await db.categories.toArray()
        const catMap = Object.fromEntries(categories.map(c => [c.name, c.id!]))
        let added = 0
        let errors = 0
        const now = new Date().toISOString()

        for (const row of result.data as Record<string, string>[]) {
          try {
            const catId = catMap[row['カテゴリ']]
            if (!catId || !row['日付'] || !row['金額']) { errors++; continue }
            const tx: Omit<Transaction, 'id'> = {
              date: row['日付'],
              amount: parseInt(row['金額'], 10),
              type: row['種別'] === '収入' ? 'income' : 'expense',
              categoryId: catId,
              paymentMethod: (row['支払い方法'] as Transaction['paymentMethod']) || 'cash',
              memo: row['メモ'] ?? '',
              createdAt: row['作成日時'] ?? now,
              updatedAt: now,
            }
            await db.transactions.add(tx)
            added++
          } catch {
            errors++
          }
        }
        resolve({ added, errors })
      },
    })
  })
}

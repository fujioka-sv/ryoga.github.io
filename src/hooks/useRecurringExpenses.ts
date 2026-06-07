import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { RecurringExpense, RecurrenceInterval } from '../types'

export function useRecurringExpenses() {
  return useLiveQuery(() => db.recurringExpenses.orderBy('id').toArray(), []) ?? []
}

export async function addRecurringExpense(
  re: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>
) {
  const now = new Date().toISOString()
  await db.recurringExpenses.add({ ...re, createdAt: now, updatedAt: now })
}

export async function updateRecurringExpense(id: number, re: Partial<RecurringExpense>) {
  await db.recurringExpenses.update(id, { ...re, updatedAt: new Date().toISOString() })
}

export async function deleteRecurringExpense(id: number) {
  await db.recurringExpenses.delete(id)
}

export async function toggleRecurringExpense(id: number, enabled: boolean) {
  await db.recurringExpenses.update(id, { enabled, updatedAt: new Date().toISOString() })
}

/** 起点日の「日」を保ちながら、指定月数後の日付文字列を返す */
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  // 月末補正（例: 1/31 + 1ヶ月 → 2/28）
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return d.toISOString().slice(0, 10)
}

/** アプリ起動時に呼ぶ。期日が来た定期支出を取引として自動追加する */
export async function applyDueRecurringExpenses() {
  const today = new Date().toISOString().slice(0, 10)
  const allRecurring = await db.recurringExpenses
    .filter(r => r.enabled && r.nextDueDate <= today)
    .toArray()

  for (const re of allRecurring) {
    let nextDue = re.nextDueDate

    // 長期間開かなかった場合、まとめて処理
    while (nextDue <= today) {
      const now = new Date().toISOString()
      await db.transactions.add({
        date: nextDue,
        amount: re.amount,
        type: re.type,
        categoryId: re.categoryId,
        paymentMethod: re.paymentMethod,
        memo: re.memo ? `${re.memo}（定期支出）` : '定期支出',
        createdAt: now,
        updatedAt: now,
      })
      nextDue = addMonths(nextDue, re.intervalMonths as RecurrenceInterval)
    }

    await db.recurringExpenses.update(re.id!, {
      nextDueDate: nextDue,
      updatedAt: new Date().toISOString(),
    })
  }
}

/** 初回 nextDueDate を計算（startDate と同じ日付から開始） */
export function calcFirstDueDate(startDate: string): string {
  const today = new Date().toISOString().slice(0, 10)
  // startDateが今日以前なら今日以降の最初の発生日を計算してもよいが、
  // シンプルに startDate をそのまま使う（アプリ起動時に自動適用される）
  return startDate <= today ? startDate : startDate
}

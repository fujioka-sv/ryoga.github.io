export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'cash' | 'credit' | 'emoney' | 'transfer'

export interface Transaction {
  id?: number
  date: string
  amount: number
  type: TransactionType
  categoryId: number
  paymentMethod: PaymentMethod
  memo: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id?: number
  name: string
  type: TransactionType
  order: number
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  credit: 'クレカ',
  emoney: '電子マネー',
  transfer: '銀行振込',
}

export type RecurrenceInterval = 1 | 2 | 3 | 6 | 12

export interface RecurringExpense {
  id?: number
  name: string
  amount: number
  type: TransactionType
  categoryId: number
  paymentMethod: PaymentMethod
  memo: string
  intervalMonths: RecurrenceInterval
  startDate: string     // YYYY-MM-DD（起点日。この「日」が毎回の実行日）
  nextDueDate: string   // YYYY-MM-DD（次回実行予定日）
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export const INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  1: '毎月',
  2: '2ヶ月ごと',
  3: '3ヶ月ごと（四半期）',
  6: '半年ごと',
  12: '毎年',
}

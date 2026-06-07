import { useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import AmountDisplay from '../components/ui/AmountDisplay'
import { useMonthTransactions, deleteTransaction, updateTransaction } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import type { Transaction, PaymentMethod } from '../types'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: '現金', credit: 'クレカ', emoney: '電子マネー', transfer: '銀行振込',
}

export default function List() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const txs = useMonthTransactions(year, month)
  const categories = useCategories()
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id!, c.name])), [categories])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  return (
    <div className="pb-20">
      <Header title="取引一覧" />

      {/* 月セレクタ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={prevMonth} className="p-2 text-gray-500 hover:text-gray-800">‹</button>
        <span className="font-medium text-gray-700">{year}年{month}月</span>
        <button onClick={nextMonth} className="p-2 text-gray-500 hover:text-gray-800">›</button>
      </div>

      {txs.length === 0 ? (
        <p className="text-center text-gray-400 py-12">この月の取引はありません</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {[...txs].reverse().map(t => (
            <div key={t.id}
              className="flex items-center px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer"
              onClick={() => setEditing(t)}
            >
              <div className="flex-1">
                <p className="text-sm text-gray-800 font-medium">{catMap[t.categoryId] ?? '—'}</p>
                <p className="text-xs text-gray-400">{t.date} · {PAYMENT_LABELS[t.paymentMethod]}{t.memo ? ` · ${t.memo}` : ''}</p>
              </div>
              <AmountDisplay amount={t.amount} type={t.type} size="sm" showSign />
            </div>
          ))}
        </div>
      )}

      {/* 編集モーダル */}
      {editing && (
        <EditModal
          tx={editing}
          catMap={catMap}
          onClose={() => setEditing(null)}
          onDelete={async () => { await deleteTransaction(editing.id!); setEditing(null) }}
          onSave={async (partial) => { await updateTransaction(editing.id!, partial); setEditing(null) }}
        />
      )}
    </div>
  )
}

function EditModal({ tx, catMap, onClose, onDelete, onSave }: {
  tx: Transaction
  catMap: Record<number, string>
  onClose: () => void
  onDelete: () => void
  onSave: (p: Partial<Transaction>) => void
}) {
  const [memo, setMemo] = useState(tx.memo)
  const [date, setDate] = useState(tx.date)
  const [amount, setAmount] = useState(String(tx.amount))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">取引を編集</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-500">{catMap[tx.categoryId]}</p>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1" />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
        </div>
        <input type="text" placeholder="メモ" value={memo} onChange={e => setMemo(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-3 pt-2">
          <button onClick={onDelete}
            className="flex-1 py-3 rounded-xl text-rose-500 border border-rose-200 font-medium text-sm">
            削除
          </button>
          <button onClick={() => onSave({ memo, date, amount: parseInt(amount, 10) })}
            className="flex-1 py-3 rounded-xl bg-accent-500 text-white font-medium text-sm">
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

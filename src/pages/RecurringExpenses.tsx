import { useState, useMemo } from 'react'
import Header from '../components/layout/Header'
import AmountDisplay from '../components/ui/AmountDisplay'
import {
  useRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
} from '../hooks/useRecurringExpenses'
import { useCategories } from '../hooks/useCategories'
import type { RecurringExpense, RecurrenceInterval, TransactionType, PaymentMethod } from '../types'
import { INTERVAL_LABELS, PAYMENT_LABELS } from '../types'
import type { Page } from '../App'

interface Props { onNavigate: (p: Page) => void }

const INTERVALS: RecurrenceInterval[] = [1, 2, 3, 6, 12]
const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: '現金' },
  { value: 'credit', label: 'クレカ' },
  { value: 'emoney', label: '電子マネー' },
  { value: 'transfer', label: '銀行振込' },
]

const EMPTY_FORM = {
  name: '',
  amount: '',
  type: 'expense' as TransactionType,
  categoryId: 0,
  paymentMethod: 'cash' as PaymentMethod,
  memo: '',
  intervalMonths: 1 as RecurrenceInterval,
  startDate: new Date().toISOString().slice(0, 10),
}

export default function RecurringExpenses({ onNavigate }: Props) {
  const [tab, setTab] = useState<TransactionType>('expense')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<RecurringExpense | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const allRecurring = useRecurringExpenses()
  const categories = useCategories(tab)
  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id!, c.name])),
    [categories]
  )
  const allCategories = useCategories()
  const allCatMap = useMemo(
    () => Object.fromEntries(allCategories.map(c => [c.id!, c.name])),
    [allCategories]
  )

  const filtered = allRecurring.filter(r => r.type === tab)

  function openAdd() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, type: tab })
    setShowForm(true)
  }

  function openEdit(re: RecurringExpense) {
    setEditTarget(re)
    setForm({
      name: re.name,
      amount: String(re.amount),
      type: re.type,
      categoryId: re.categoryId,
      paymentMethod: re.paymentMethod,
      memo: re.memo,
      intervalMonths: re.intervalMonths,
      startDate: re.startDate,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.amount || !form.categoryId) return
    const data = {
      name: form.name,
      amount: parseInt(form.amount, 10),
      type: form.type,
      categoryId: form.categoryId,
      paymentMethod: form.paymentMethod,
      memo: form.memo,
      intervalMonths: form.intervalMonths,
      startDate: form.startDate,
      nextDueDate: form.startDate,
      enabled: true,
    }
    if (editTarget) {
      await updateRecurringExpense(editTarget.id!, data)
    } else {
      await addRecurringExpense(data)
    }
    setShowForm(false)
  }

  return (
    <div className="pb-20">
      <Header
        title="定期支出"
        right={
          <button onClick={() => onNavigate('settings')} className="text-gray-400 text-sm">
            ← 戻る
          </button>
        }
      />

      {/* 種別タブ */}
      <div className="flex border-b border-gray-100">
        {(['expense', 'income'] as TransactionType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${tab === t ? 'text-accent-500 border-b-2 border-accent-500' : 'text-gray-400'}`}>
            {t === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className="px-4 py-3 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">登録された定期支出はありません</p>
        )}
        {filtered.map(re => (
          <div key={re.id}
            className={`bg-white rounded-2xl shadow-sm p-4 ${!re.enabled ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-800">{re.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {INTERVAL_LABELS[re.intervalMonths]} · {PAYMENT_LABELS[re.paymentMethod]}
                  {re.memo ? ` · ${re.memo}` : ''}
                </p>
                <p className="text-xs text-gray-400">
                  {allCatMap[re.categoryId] ?? '—'} ·{' '}
                  {re.enabled ? `次回: ${re.nextDueDate}` : '停止中'}
                </p>
              </div>
              <AmountDisplay amount={re.amount} type={re.type} size="md" />
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <button
                onClick={() => toggleRecurringExpense(re.id!, !re.enabled)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600">
                {re.enabled ? '一時停止' : '再開'}
              </button>
              <button
                onClick={() => openEdit(re)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600">
                編集
              </button>
              <button
                onClick={() => deleteRecurringExpense(re.id!)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-500">
                削除
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={openAdd}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm hover:border-accent-300 hover:text-accent-500 transition-colors">
          ＋ 定期支出を追加
        </button>
      </div>

      {/* 追加・編集フォーム（ボトムシート） */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? '定期支出を編集' : '定期支出を追加'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* 名前 */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">名前</label>
              <input type="text" placeholder="例：家賃、Netflix"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>

            {/* 種別 */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">種別</label>
              <div className="flex gap-2">
                {(['expense', 'income'] as TransactionType[]).map(t => (
                  <button key={t}
                    onClick={() => setForm(f => ({ ...f, type: t, categoryId: 0 }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                      ${form.type === t ? 'bg-accent-500 text-white border-accent-500' : 'border-gray-200 text-gray-600'}`}>
                    {t === 'expense' ? '支出' : '収入'}
                  </button>
                ))}
              </div>
            </div>

            {/* 金額 */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">金額</label>
              <input type="number" placeholder="0"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">カテゴリ</label>
              <div className="flex flex-wrap gap-2">
                {(form.type === tab ? categories : allCategories.filter(c => c.type === form.type)).map(c => (
                  <button key={c.id}
                    onClick={() => setForm(f => ({ ...f, categoryId: c.id! }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${form.categoryId === c.id ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 繰り返し間隔 */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">繰り返し間隔</label>
              <div className="flex flex-wrap gap-2">
                {INTERVALS.map(n => (
                  <button key={n}
                    onClick={() => setForm(f => ({ ...f, intervalMonths: n }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${form.intervalMonths === n ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {INTERVAL_LABELS[n]}
                  </button>
                ))}
              </div>
            </div>

            {/* 起点日 */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">起点日（最初の記録日）</label>
              <input type="date"
                value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>

            {/* 支払い方法 */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">支払い方法</label>
              <select value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full">
                {PAYMENT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* メモ */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">メモ（任意）</label>
              <input type="text" placeholder="メモ"
                value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name || !form.amount || !form.categoryId}
              className="w-full py-3.5 rounded-2xl text-white font-semibold bg-accent-500 disabled:opacity-40">
              保存する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

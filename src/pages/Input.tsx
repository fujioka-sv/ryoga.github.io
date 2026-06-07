import { useRef, useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { addTransaction } from '../hooks/useTransactions'
import { runReceiptOcr } from '../utils/receiptOcr'
import { parseReceipt } from '../utils/receiptParser'
import type { TransactionType, PaymentMethod } from '../types'
import type { Page } from '../App'

interface Props {
  onNavigate: (p: Page) => void
  editId?: number
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: '現金' },
  { value: 'credit', label: 'クレカ' },
  { value: 'emoney', label: '電子マネー' },
  { value: 'transfer', label: '銀行振込' },
]

const PAD = ['7','8','9','4','5','6','1','2','3','00','0','⌫']

export default function Input({ onNavigate }: Props) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [payment, setPayment] = useState<PaymentMethod>('cash')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'reading' | 'error'>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrMessage, setOcrMessage] = useState('')

  const categories = useCategories(type)

  async function handleReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 同じ画像を再選択できるようにリセット
    if (!file) return

    setOcrStatus('reading')
    setOcrProgress(0)
    setOcrMessage('')
    try {
      const text = await runReceiptOcr(file, setOcrProgress)
      const result = parseReceipt(text)
      if (result.amount !== undefined) setAmount(String(result.amount))
      if (result.date) setDate(result.date)
      if (result.memo) setMemo(result.memo)

      if (result.amount === undefined && !result.date && !result.memo) {
        setOcrStatus('error')
        setOcrMessage('読み取れませんでした。手入力してください。')
      } else {
        setOcrStatus('idle')
        if (result.amount === undefined) {
          setOcrMessage('金額を読み取れませんでした。確認してください。')
        }
      }
    } catch {
      setOcrStatus('error')
      setOcrMessage('読み取りに失敗しました。手入力してください。')
    }
  }

  function handlePad(key: string) {
    if (key === '⌫') {
      setAmount(a => a.slice(0, -1))
    } else if (key === '00') {
      setAmount(a => (a === '' ? '' : a + '00'))
    } else {
      setAmount(a => (a.length >= 8 ? a : a + key))
    }
  }

  async function handleSave() {
    if (!amount || !categoryId) return
    setSaving(true)
    await addTransaction({ date, amount: parseInt(amount, 10), type, categoryId, paymentMethod: payment, memo })
    setSaving(false)
    onNavigate('home')
  }

  return (
    <div className="flex flex-col h-screen pb-4">
      {/* 種別タブ */}
      <div className="flex border-b border-gray-100">
        {(['expense', 'income'] as TransactionType[]).map(t => (
          <button
            key={t}
            onClick={() => { setType(t); setCategoryId(null) }}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${type === t ? 'text-accent-500 border-b-2 border-accent-500' : 'text-gray-400'}`}
          >
            {t === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      {/* レシート読み取り */}
      <div className="px-4 py-2 border-b border-gray-50">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleReceiptFile}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={ocrStatus === 'reading'}
          className="w-full py-2 rounded-xl text-sm font-medium border border-accent-500
            text-accent-500 disabled:opacity-50 active:scale-95 transition-colors
            hover:bg-accent-50 flex items-center justify-center gap-2"
        >
          {ocrStatus === 'reading'
            ? `読み取り中… ${ocrProgress}%`
            : '📷 レシートから読み取り'}
        </button>
        {ocrMessage && (
          <p className={`mt-1 text-xs ${ocrStatus === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
            {ocrMessage}
          </p>
        )}
      </div>

      {/* 金額表示 */}
      <div className="flex items-end justify-end px-6 py-3 border-b border-gray-50">
        <span className="text-gray-400 text-2xl mr-2">¥</span>
        <span className="text-4xl font-bold text-gray-800 tabular-nums min-w-[4ch] text-right">
          {amount || '0'}
        </span>
      </div>

      {/* カテゴリ */}
      <div className="px-4 py-3 border-b border-gray-50">
        <p className="text-xs text-gray-400 mb-2">カテゴリ</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id!)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${categoryId === c.id
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 日付・支払い方法・メモ */}
      <div className="px-4 py-3 border-b border-gray-50 flex gap-3 flex-wrap text-sm">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
        />
        <select
          value={payment}
          onChange={e => setPayment(e.target.value as PaymentMethod)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
        >
          {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="メモ（任意）"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 min-w-[120px]"
        />
      </div>

      {/* テンキー */}
      <div className="flex-1 grid grid-cols-3 gap-1 px-2 py-2">
        {PAD.map(k => (
          <button
            key={k}
            onClick={() => handlePad(k)}
            className={`rounded-xl text-xl font-medium h-full min-h-[44px] transition-colors active:scale-95
              ${k === '⌫' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* 保存ボタン */}
      <div className="px-4 pt-2">
        <button
          onClick={handleSave}
          disabled={!amount || !categoryId || saving}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-base
            bg-accent-500 disabled:opacity-40 active:scale-95 transition"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}

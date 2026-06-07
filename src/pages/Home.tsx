import { useMemo } from 'react'
import Header from '../components/layout/Header'
import AmountDisplay from '../components/ui/AmountDisplay'
import { useMonthTransactions, useRecentTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'

export default function Home() {
  const now = new Date()
  const txs = useMonthTransactions(now.getFullYear(), now.getMonth() + 1)
  const recent = useRecentTransactions(5)
  const categories = useCategories()
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id!, c.name])), [categories])

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const catTotals = useMemo(() => {
    const map: Record<number, number> = {}
    txs.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, total]) => ({ name: catMap[Number(id)] ?? '?', total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }, [txs, catMap])

  const month = `${now.getFullYear()}年${now.getMonth() + 1}月`

  return (
    <div className="pb-20">
      <Header title="KakeiLog" />

      {/* 月次サマリ */}
      <div className="bg-accent-500 text-white px-4 pt-6 pb-8">
        <p className="text-accent-100 text-sm mb-1">{month}の収支</p>
        <AmountDisplay amount={balance} size="xl" />
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-accent-100 text-xs">収入</p>
            <span className="text-white font-semibold">¥{totalIncome.toLocaleString()}</span>
          </div>
          <div>
            <p className="text-accent-100 text-xs">支出</p>
            <span className="text-white font-semibold">¥{totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* カテゴリTOP3 */}
        {catTotals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium mb-3">支出 TOP3</p>
            <div className="space-y-2">
              {catTotals.map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{c.name}</span>
                  <AmountDisplay amount={c.total} type="expense" size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 直近5件 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-3">直近の取引</p>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">取引がありません</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(t => (
                <div key={t.id} className="flex justify-between items-center py-2.5">
                  <div>
                    <p className="text-sm text-gray-800">{catMap[t.categoryId] ?? '—'}</p>
                    <p className="text-xs text-gray-400">{t.date}{t.memo ? ` · ${t.memo}` : ''}</p>
                  </div>
                  <AmountDisplay amount={t.amount} type={t.type} size="sm" showSign />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

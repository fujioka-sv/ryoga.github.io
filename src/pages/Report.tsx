import { useMemo, useState } from 'react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import Header from '../components/layout/Header'
import { useMonthTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316',
  '#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6',
  '#a855f7','#f59e0b','#10b981',
]

export default function Report() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const txs = useMonthTransactions(year, month)
  const categories = useCategories('expense')
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id!, c.name])), [categories])

  // 円グラフ
  const { catLabels, catData } = useMemo(() => {
    const map: Record<number, number> = {}
    txs.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
    })
    const entries = Object.entries(map).sort(([,a],[,b]) => b - a)
    return {
      catLabels: entries.map(([id]) => catMap[Number(id)] ?? '?'),
      catData: entries.map(([,v]) => v),
    }
  }, [txs, catMap])

  // 棒グラフ（過去12ヶ月）
  const monthlyData = useLiveQuery(async () => {
    const months: { label: string; income: number; expense: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const from = `${y}-${String(m).padStart(2,'0')}-01`
      const to = `${y}-${String(m).padStart(2,'0')}-31`
      const list = await db.transactions.where('date').between(from, to, true, true).toArray()
      months.push({
        label: `${m}月`,
        income: list.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0),
        expense: list.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0),
      })
    }
    return months
  }, [year, month]) ?? []

  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }

  return (
    <div className="pb-20">
      <Header title="レポート" />

      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={prevMonth} className="p-2 text-gray-500">‹</button>
        <span className="font-medium text-gray-700">{year}年{month}月</span>
        <button onClick={nextMonth} className="p-2 text-gray-500">›</button>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 円グラフ */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600 mb-4">カテゴリ別支出</p>
          {catData.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">データがありません</p>
          ) : (
            <div className="max-w-xs mx-auto">
              <Doughnut
                data={{
                  labels: catLabels,
                  datasets: [{ data: catData, backgroundColor: COLORS, borderWidth: 0 }],
                }}
                options={{ plugins: { legend: { position: 'bottom' } } }}
              />
            </div>
          )}
        </div>

        {/* 棒グラフ */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600 mb-4">収支推移（過去12ヶ月）</p>
          <Bar
            data={{
              labels: monthlyData.map(m => m.label),
              datasets: [
                { label: '収入', data: monthlyData.map(m => m.income), backgroundColor: '#86efac' },
                { label: '支出', data: monthlyData.map(m => m.expense), backgroundColor: '#fca5a5' },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      </div>
    </div>
  )
}

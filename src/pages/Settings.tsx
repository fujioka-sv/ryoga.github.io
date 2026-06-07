import { useRef, useState } from 'react'
import Header from '../components/layout/Header'
import { exportCSV, importCSV } from '../utils/csv'
import { db } from '../db/database'
import type { Page } from '../App'

interface Props { onNavigate: (p: Page) => void }

export default function Settings({ onNavigate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  async function handleExport() {
    await exportCSV()
    setMsg('CSVをダウンロードしました')
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { added, errors } = await importCSV(file)
    setMsg(`${added}件インポート完了${errors > 0 ? `（${errors}件スキップ）` : ''}`)
    e.target.value = ''
  }

  async function handleDeleteAll() {
    if (!confirm('すべての取引データを削除しますか？この操作は元に戻せません。')) return
    await db.transactions.clear()
    setMsg('すべての取引データを削除しました')
  }

  return (
    <div className="pb-20">
      <Header title="設定" />

      <div className="px-4 py-4 space-y-3">
        {msg && (
          <div className="bg-accent-50 text-accent-700 rounded-xl px-4 py-3 text-sm">{msg}</div>
        )}

        <Section title="カスタマイズ">
          <Item label="カテゴリ管理" desc="カテゴリの追加・編集・削除"
            onClick={() => onNavigate('categories')} />
          <Item label="定期支出管理" desc="毎月の家賃・サブスクなどを自動記録"
            onClick={() => onNavigate('recurring')} />
        </Section>

        <Section title="データ">
          <Item label="CSVエクスポート" desc="取引データをCSVで保存" onClick={handleExport} />
          <Item label="CSVインポート" desc="CSVファイルから取引を読み込む"
            onClick={() => fileRef.current?.click()} />
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </Section>

        <Section title="危険な操作">
          <Item label="全データ削除" desc="すべての取引履歴を削除します"
            onClick={handleDeleteAll} danger />
        </Section>

        <p className="text-xs text-gray-400 text-center pt-4">KakeiLog v1.0.0</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <p className="text-xs text-gray-400 font-medium px-4 pt-4 pb-2">{title}</p>
      {children}
    </div>
  )
}

function Item({ label, desc, onClick, danger }: {
  label: string; desc: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex flex-col px-4 py-3 text-left border-t border-gray-50 hover:bg-gray-50 transition-colors
        ${danger ? 'text-rose-500' : 'text-gray-800'}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-gray-400 mt-0.5">{desc}</span>
    </button>
  )
}

import { useState } from 'react'
import Header from '../components/layout/Header'
import { useCategories, addCategory, updateCategory, deleteCategory } from '../hooks/useCategories'
import type { TransactionType } from '../types'

export default function Categories() {
  const [tab, setTab] = useState<TransactionType>('expense')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const categories = useCategories(tab)

  async function handleAdd() {
    if (!newName.trim()) return
    await addCategory(newName.trim(), tab)
    setNewName('')
  }

  async function handleSaveEdit(id: number) {
    if (!editingName.trim()) return
    await updateCategory(id, editingName.trim())
    setEditingId(null)
  }

  return (
    <div className="pb-20">
      <Header title="カテゴリ管理" />

      <div className="flex border-b border-gray-100">
        {(['expense', 'income'] as TransactionType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${tab === t ? 'text-accent-500 border-b-2 border-accent-500' : 'text-gray-400'}`}>
            {t === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      {/* 追加フォーム */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-50">
        <input
          type="text"
          placeholder="新しいカテゴリ名"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <button onClick={handleAdd}
          className="px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-medium">
          追加
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {categories.map(c => (
          <div key={c.id} className="flex items-center px-4 py-3 bg-white">
            {editingId === c.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(c.id!)}
                  autoFocus
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm mr-2"
                />
                <button onClick={() => handleSaveEdit(c.id!)}
                  className="text-accent-500 text-sm font-medium mr-2">保存</button>
                <button onClick={() => setEditingId(null)}
                  className="text-gray-400 text-sm">キャンセル</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                <button onClick={() => { setEditingId(c.id!); setEditingName(c.name) }}
                  className="text-gray-400 mr-3 text-sm">編集</button>
                <button onClick={() => deleteCategory(c.id!)}
                  className="text-rose-400 text-sm">削除</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

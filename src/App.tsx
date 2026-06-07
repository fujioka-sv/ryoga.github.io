import { useState, useEffect } from 'react'
import BottomNav from './components/layout/BottomNav'
import Home from './pages/Home'
import Input from './pages/Input'
import List from './pages/List'
import Report from './pages/Report'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import RecurringExpenses from './pages/RecurringExpenses'
import { applyDueRecurringExpenses } from './hooks/useRecurringExpenses'

export type Page = 'home' | 'input' | 'list' | 'report' | 'categories' | 'settings' | 'recurring'

export default function App() {
  const [page, setPage] = useState<Page>('home')

  // 起動時に期日が来た定期支出を自動追加
  useEffect(() => {
    applyDueRecurringExpenses()
  }, [])

  function renderPage() {
    switch (page) {
      case 'home':       return <Home />
      case 'input':      return <Input onNavigate={setPage} />
      case 'list':       return <List />
      case 'report':     return <Report />
      case 'categories': return <Categories />
      case 'settings':   return <Settings onNavigate={setPage} />
      case 'recurring':  return <RecurringExpenses onNavigate={setPage} />
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative">
      {renderPage()}
      {page !== 'input' && <BottomNav current={page} onChange={setPage} />}
    </div>
  )
}

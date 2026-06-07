import type { Page } from '../../App'

interface Props {
  current: Page
  onChange: (p: Page) => void
}

const NAV_ITEMS: { page: Page; label: string; icon: string }[] = [
  { page: 'home',       label: 'ホーム',   icon: '🏠' },
  { page: 'list',       label: '一覧',     icon: '📋' },
  { page: 'input',      label: '＋',       icon: '' },
  { page: 'report',     label: 'レポート', icon: '📊' },
  { page: 'settings',   label: '設定',     icon: '⚙️' },
]

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-end z-50"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map(({ page, label, icon }) =>
        page === 'input' ? (
          <button
            key={page}
            onClick={() => onChange('input')}
            className="flex-1 flex flex-col items-center pb-2 pt-1 -mt-5"
          >
            <span className="w-14 h-14 rounded-full bg-accent-500 text-white text-3xl flex items-center justify-center shadow-lg">
              ＋
            </span>
          </button>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors
              ${current === page ? 'text-accent-500' : 'text-gray-400'}`}
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </button>
        )
      )}
    </nav>
  )
}

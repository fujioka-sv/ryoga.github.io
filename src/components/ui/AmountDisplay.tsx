interface Props {
  amount: number
  type?: 'income' | 'expense' | 'balance'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSign?: boolean
}

const SIZE_CLASS = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
  xl: 'text-3xl font-bold',
}

export default function AmountDisplay({ amount, type = 'balance', size = 'md', showSign }: Props) {
  const colorClass =
    type === 'income' ? 'text-emerald-600' :
    type === 'expense' ? 'text-rose-500' :
    amount >= 0 ? 'text-gray-800' : 'text-rose-500'

  const sign = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : amount >= 0 ? '+' : '') : ''

  return (
    <span className={`${SIZE_CLASS[size]} ${colorClass} tabular-nums`}>
      {sign}¥{Math.abs(amount).toLocaleString()}
    </span>
  )
}

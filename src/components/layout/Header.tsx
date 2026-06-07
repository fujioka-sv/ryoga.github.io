interface Props {
  title: string
  right?: React.ReactNode
}

export default function Header({ title, right }: Props) {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 z-40 px-4 h-14 flex items-center justify-between">
      <h1 className="font-semibold text-gray-800 text-lg">{title}</h1>
      {right && <div>{right}</div>}
    </header>
  )
}

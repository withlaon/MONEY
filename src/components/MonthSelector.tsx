'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  year: number
  month: number
  onChange: (y: number, m: number) => void
}

export default function MonthSelector({ year, month, onChange }: Props) {
  const prev = () => month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1)
  const next = () => {
    const now = new Date()
    const ny = month === 12 ? year + 1 : year
    const nm = month === 12 ? 1 : month + 1
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth() + 1)) return
    onChange(ny, nm)
  }
  const isCurrent = () => {
    const n = new Date()
    return year === n.getFullYear() && month === n.getMonth() + 1
  }

  const btnBase: React.CSSProperties = {
    width: 32, height: 32,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={prev} style={btnBase}>
        <ChevronLeft size={13} />
      </button>
      <div
        className="flex items-center justify-center px-3"
        style={{
          height: 32, minWidth: 120,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}
      >
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>
          {year}년 {month}월
        </span>
      </div>
      <button onClick={next} disabled={isCurrent()} style={{ ...btnBase, opacity: isCurrent() ? 0.3 : 1 }}>
        <ChevronRight size={13} />
      </button>
      {!isCurrent() && (
        <button
          onClick={() => { const n = new Date(); onChange(n.getFullYear(), n.getMonth() + 1) }}
          className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
          style={{ color: 'var(--primary-light)', background: 'var(--primary-glow)', border: '1px solid rgba(124,111,224,0.2)' }}
        >
          이번달
        </button>
      )}
    </div>
  )
}

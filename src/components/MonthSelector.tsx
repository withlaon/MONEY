'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export default function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const goPrev = () => {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }

  const goNext = () => {
    const now = new Date()
    const ny = month === 12 ? year + 1 : year
    const nm = month === 12 ? 1 : month + 1
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth() + 1)) return
    onChange(ny, nm)
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return year === now.getFullYear() && month === now.getMonth() + 1
  }

  const btnStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: '10px',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    flexShrink: 0,
  } as React.CSSProperties

  return (
    <div className="flex items-center gap-2">
      <button onClick={goPrev} style={btnStyle} className="hover:border-[var(--border-light)] hover:text-white">
        <ChevronLeft size={14} />
      </button>

      <div
        className="flex items-center gap-2 px-4"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          height: 32,
          minWidth: 130,
          justifyContent: 'center',
        }}
      >
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {year}년 {month}월
        </span>
      </div>

      <button
        onClick={goNext}
        disabled={isCurrentMonth()}
        style={{ ...btnStyle, opacity: isCurrentMonth() ? 0.3 : 1, cursor: isCurrentMonth() ? 'not-allowed' : 'pointer' }}
        className="hover:border-[var(--border-light)] hover:text-white"
      >
        <ChevronRight size={14} />
      </button>

      {!isCurrentMonth() && (
        <button
          onClick={() => { const n = new Date(); onChange(n.getFullYear(), n.getMonth() + 1) }}
          className="text-[12px] font-medium px-2 transition-colors"
          style={{ color: 'var(--primary-light)' }}
        >
          이번달
        </button>
      )}
    </div>
  )
}

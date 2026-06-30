'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props { year: number; month: number; onChange: (y: number, m: number) => void }

export default function MonthSelector({ year, month, onChange }: Props) {
  const prev = () => month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1)
  const next = () => {
    const n = new Date()
    const ny = month === 12 ? year + 1 : year
    const nm = month === 12 ? 1 : month + 1
    if (ny > n.getFullYear() || (ny === n.getFullYear() && nm > n.getMonth() + 1)) return
    onChange(ny, nm)
  }
  const isCur = () => { const n = new Date(); return year === n.getFullYear() && month === n.getMonth() + 1 }

  const btnBase: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'var(--day-card)', border: '1px solid var(--day-border)',
    color: 'var(--day-text3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', boxShadow: 'var(--day-shadow)',
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} style={btnBase}><ChevronLeft size={15} /></button>
      <div style={{ ...btnBase, minWidth: 136, width: 'auto', padding: '0 16px', cursor: 'default', justifyContent: 'center' }}>
        <span className="text-[15px] font-bold" style={{ color: 'var(--day-text1)' }}>
          {year}년 {month}월
        </span>
      </div>
      <button onClick={next} disabled={isCur()} style={{ ...btnBase, opacity: isCur() ? 0.35 : 1 }}>
        <ChevronRight size={15} />
      </button>
      {!isCur() && (
        <button
          onClick={() => { const n = new Date(); onChange(n.getFullYear(), n.getMonth() + 1) }}
          className="text-[13px] font-bold px-3 py-1.5 rounded-xl transition-all"
          style={{
            color: 'var(--primary-light)', background: 'var(--primary-soft)',
            border: '1px solid var(--primary-border)',
          }}
        >
          이번달
        </button>
      )}
    </div>
  )
}

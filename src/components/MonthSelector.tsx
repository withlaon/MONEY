'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

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
  const isCur = () => {
    const n = new Date()
    return year === n.getFullYear() && month === n.getMonth() + 1
  }

  const navBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 10, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: 'var(--day-card)', border: '1px solid var(--day-border)',
    color: 'var(--day-text2)', cursor: 'pointer',
    boxShadow: 'var(--day-shadow)', transition: 'all 0.12s',
  }

  return (
    <div className="flex items-center gap-2">
      {/* 날짜 표시 + 이전/다음 버튼 */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
        style={{ background: 'var(--day-card)', border: '1px solid var(--day-border)', boxShadow: 'var(--day-shadow)' }}>
        <Calendar size={14} style={{ color: 'var(--day-text3)' }} />
        <span className="text-[14px] font-extrabold px-1" style={{ color: 'var(--day-text1)', minWidth: 84, textAlign: 'center' }}>
          {year}년 {month}월
        </span>
        <button onClick={prev} style={{ ...navBtn, width: 28, height: 28, background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <ChevronLeft size={14} />
        </button>
        <button onClick={next} disabled={isCur()} style={{ ...navBtn, width: 28, height: 28, background: 'transparent', border: 'none', boxShadow: 'none', opacity: isCur() ? 0.3 : 1 }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 이번달 */}
      {!isCur() && (
        <button
          onClick={() => { const n = new Date(); onChange(n.getFullYear(), n.getMonth() + 1) }}
          className="text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all"
          style={{
            background: 'var(--primary-soft)', border: '1px solid var(--primary-border)',
            color: 'var(--primary)',
          }}
        >
          이번달
        </button>
      )}
    </div>
  )
}

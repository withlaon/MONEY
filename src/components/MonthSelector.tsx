'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

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
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    if (nextYear > now.getFullYear() || (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)) return
    onChange(nextYear, nextMonth)
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return year === now.getFullYear() && month === now.getMonth() + 1
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goPrev}
        className="w-8 h-8 rounded-lg bg-[#1a1d27] border border-[#252836] flex items-center justify-center text-[#6b7280] hover:text-white hover:border-[#6c63ff50] transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1d27] border border-[#252836] min-w-[140px] justify-center">
        <Calendar className="w-3.5 h-3.5 text-[#6c63ff]" />
        <span className="text-sm font-semibold text-white">
          {year}년 {month}월
        </span>
      </div>

      <button
        onClick={goNext}
        disabled={isCurrentMonth()}
        className="w-8 h-8 rounded-lg bg-[#1a1d27] border border-[#252836] flex items-center justify-center text-[#6b7280] hover:text-white hover:border-[#6c63ff50] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrentMonth() && (
        <button
          onClick={() => {
            const now = new Date()
            onChange(now.getFullYear(), now.getMonth() + 1)
          }}
          className="text-xs text-[#6c63ff] hover:text-[#8b84ff] transition-colors px-2"
        >
          이번달
        </button>
      )}
    </div>
  )
}

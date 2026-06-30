'use client'

import { useState } from 'react'
import { Trash2, TrendingUp, Building2, User, Lock, ChevronDown } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'

interface Props {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export default function TransactionList({ transactions, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [deletingId, setDeletingId] = useState<string|null>(null)

  const del = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    setDeletingId(id)
    try { await onDelete(id) } finally { setDeletingId(null) }
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)' }}>
          <TrendingUp size={20} style={{ color:'var(--text-3)' }} />
        </div>
        <p className="text-[13px] font-medium" style={{ color:'var(--text-2)' }}>거래 내역이 없습니다</p>
        <p className="text-[11px] mt-1" style={{ color:'var(--text-3)' }}>상단 버튼으로 거래를 추가하세요</p>
      </div>
    )
  }

  const grouped = transactions.reduce((acc, t) => {
    if (!acc[t.transaction_date]) acc[t.transaction_date] = []
    acc[t.transaction_date].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  const dates = Object.keys(grouped).sort((a,b) => b.localeCompare(a))

  return (
    <div className="space-y-4 sm:space-y-5">
      {dates.map(date => {
        const items = grouped[date]
        const dayIn  = items.filter(t => t.transaction_type==='income').reduce((s,t) => s+t.amount, 0)
        const dayOut = items.filter(t => t.transaction_type==='expense').reduce((s,t) => s+t.amount, 0)

        return (
          <div key={date}>
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] sm:text-[12px] font-bold" style={{ color:'var(--text-3)' }}>
                {formatDate(date)}
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                {dayIn  > 0 && <span className="text-[11px] sm:text-[12px] font-semibold" style={{ color:'var(--income)' }}>+{formatCurrency(dayIn)}</span>}
                {dayOut > 0 && <span className="text-[11px] sm:text-[12px] font-semibold" style={{ color:'var(--expense)' }}>-{formatCurrency(dayOut)}</span>}
              </div>
            </div>

            {/* 항목 */}
            <div className="space-y-1.5">
              {items.map(t => {
                const inc      = t.transaction_type === 'income'
                const expanded = expandedId === t.id
                const c  = inc ? 'var(--income)' : t.expense_type==='office' ? 'var(--office)' : 'var(--personal)'
                const bg = inc ? 'var(--income-soft)' : t.expense_type==='office' ? 'var(--office-soft)' : 'var(--personal-soft)'
                const Icon = inc ? TrendingUp : t.expense_type==='office' ? Building2 : User

                return (
                  <div key={t.id} className="rounded-xl overflow-hidden transition-all duration-150"
                    style={{ background: expanded ? 'var(--bg-elevated)' : 'var(--bg-surface)', border:`1px solid ${expanded ? 'var(--border-mid)' : 'var(--border)'}` }}>
                    <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : t.id)}>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg, color:c }}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] sm:text-[13px] font-semibold truncate" style={{ color:'var(--text-1)' }}>
                            {t.description || (inc ? t.income_sources?.name||'수입' : t.expense_categories?.name||'지출')}
                          </p>
                          {t.is_fixed && (
                            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{ background:'var(--fixed-soft)', color:'var(--fixed)', border:'1px solid rgba(148,163,184,0.15)' }}>
                              <Lock size={8}/>고정
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] mt-0.5 truncate" style={{ color:'var(--text-3)' }}>
                          {inc
                            ? t.income_sources?.name||'—'
                            : `${t.expense_type==='office'?'사무실':'개인'} · ${t.expense_categories?.name||'—'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <p className="text-[12px] sm:text-[14px] font-bold" style={{ color: inc ? 'var(--income)' : 'var(--expense)' }}>
                          {inc?'+':'-'}{formatCurrency(t.amount)}
                        </p>
                        <ChevronDown size={13} style={{ color:'var(--text-3)', transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>
                      </div>
                    </div>

                    {expanded && (
                      <div className="px-3.5 sm:px-4 pb-3 pt-2 fade-in" style={{ borderTop:'1px solid var(--border)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            {t.memo && <p className="text-[11px] sm:text-[12px]" style={{ color:'var(--text-2)' }}><span style={{ color:'var(--text-3)' }}>메모 · </span>{t.memo}</p>}
                            <p className="text-[10px] sm:text-[11px]" style={{ color:'var(--text-3)' }}>등록일 · {new Date(t.created_at).toLocaleDateString('ko-KR')}</p>
                          </div>
                          <button onClick={() => del(t.id)} disabled={deletingId===t.id}
                            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-semibold flex-shrink-0', deletingId===t.id&&'opacity-50')}
                            style={{ background:'var(--expense-soft)', border:'1px solid var(--expense-border)', color:'var(--expense)' }}>
                            <Trash2 size={11}/>{deletingId===t.id?'삭제 중':'삭제'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

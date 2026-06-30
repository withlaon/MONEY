'use client'

import { useState } from 'react'
import { Trash2, TrendingUp, Building2, User, Lock, ChevronDown, TrendingDown } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'

interface Props { transactions: Transaction[]; onDelete: (id: string) => void }

export default function TransactionList({ transactions, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const del = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    setDeletingId(id)
    try { await onDelete(id) } finally { setDeletingId(null) }
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-14 sm:py-20">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)' }}>
          <TrendingDown size={24} style={{ color: 'var(--day-text3)' }} />
        </div>
        <p className="text-[15px] sm:text-[16px] font-semibold" style={{ color: 'var(--day-text2)' }}>거래 내역이 없습니다</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--day-text3)' }}>상단 버튼으로 거래를 추가하세요</p>
      </div>
    )
  }

  const grouped = transactions.reduce((acc, t) => {
    if (!acc[t.transaction_date]) acc[t.transaction_date] = []
    acc[t.transaction_date].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-5 sm:space-y-6">
      {dates.map(date => {
        const items   = grouped[date]
        const dayIn   = items.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
        const dayOut  = items.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)

        return (
          <div key={date}>
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: 'var(--day-text3)' }}>
                {formatDate(date)}
              </span>
              <div className="flex items-center gap-3">
                {dayIn > 0  && <span className="text-[13px] font-bold" style={{ color: 'var(--income)' }}>+{formatCurrency(dayIn)}</span>}
                {dayOut > 0 && <span className="text-[13px] font-bold" style={{ color: 'var(--expense)' }}>-{formatCurrency(dayOut)}</span>}
              </div>
            </div>

            {/* 항목 */}
            <div className="space-y-2">
              {items.map(t => {
                const inc  = t.transaction_type === 'income'
                const open = expandedId === t.id
                const color = inc ? 'var(--income)' : t.expense_type === 'office' ? 'var(--office)' : 'var(--personal)'
                const iconBg = inc ? 'var(--income-soft)' : t.expense_type === 'office' ? 'var(--office-soft)' : 'var(--personal-soft)'
                const Icon  = inc ? TrendingUp : t.expense_type === 'office' ? Building2 : User

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl overflow-hidden transition-all duration-150"
                    style={{
                      background: open ? '#fafbff' : 'var(--day-card)',
                      border: `1px solid ${open ? 'var(--day-border2)' : 'var(--day-border)'}`,
                      boxShadow: open ? 'var(--day-shadow-lg)' : 'var(--day-shadow)',
                    }}
                  >
                    {/* 메인 행 */}
                    <div
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer"
                      onClick={() => setExpandedId(open ? null : t.id)}
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color }}>
                        <Icon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] sm:text-[15px] font-semibold truncate" style={{ color: 'var(--day-text1)' }}>
                            {t.description || (inc ? t.income_sources?.name || '수입' : t.expense_categories?.name || '지출')}
                          </p>
                          {t.is_fixed && (
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                              style={{ background: 'var(--fixed-soft)', color: 'var(--fixed)', border: '1px solid var(--fixed-border)' }}>
                              <Lock size={10} />고정비
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] sm:text-[13px] mt-0.5" style={{ color: 'var(--day-text3)' }}>
                          {inc
                            ? t.income_sources?.name || '—'
                            : `${t.expense_type === 'office' ? '사무실' : '개인'} · ${t.expense_categories?.name || '—'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-[15px] sm:text-[16px] font-extrabold" style={{ color: inc ? 'var(--income)' : 'var(--expense)' }}>
                          {inc ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <ChevronDown size={15}
                          style={{ color: 'var(--day-text3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>

                    {/* 확장 */}
                    {open && (
                      <div className="px-4 sm:px-5 pb-4 pt-3 fade-in"
                        style={{ borderTop: '1px solid var(--day-border)' }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            {t.memo && (
                              <p className="text-[13px] sm:text-[14px]" style={{ color: 'var(--day-text2)' }}>
                                <span style={{ color: 'var(--day-text3)' }}>메모  </span>{t.memo}
                              </p>
                            )}
                            <p className="text-[12px] sm:text-[13px]" style={{ color: 'var(--day-text3)' }}>
                              등록일  {new Date(t.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <button
                            onClick={() => del(t.id)}
                            disabled={deletingId === t.id}
                            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold flex-shrink-0', deletingId === t.id && 'opacity-50')}
                            style={{ background: 'var(--expense-soft)', border: '1px solid var(--expense-border)', color: 'var(--expense)' }}
                          >
                            <Trash2 size={13} />{deletingId === t.id ? '삭제 중' : '삭제'}
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

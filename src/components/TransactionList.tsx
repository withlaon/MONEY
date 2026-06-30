'use client'

import { useState } from 'react'
import { Trash2, TrendingUp, Building2, User, Lock, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('이 거래 내역을 삭제하시겠습니까?')) return
    setDeletingId(id)
    try { await onDelete(id) }
    finally { setDeletingId(null) }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-14">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <TrendingUp size={22} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          거래 내역이 없습니다
        </p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          상단 버튼으로 거래를 추가하세요
        </p>
      </div>
    )
  }

  const grouped = transactions.reduce((acc, t) => {
    if (!acc[t.transaction_date]) acc[t.transaction_date] = []
    acc[t.transaction_date].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-5">
      {sortedDates.map(date => {
        const items = grouped[date]
        const dayIncome  = items.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
        const dayExpense = items.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)

        return (
          <div key={date}>
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                {formatDate(date)}
              </span>
              <div className="flex items-center gap-3">
                {dayIncome > 0 && (
                  <span className="text-[12px] font-medium flex items-center gap-0.5" style={{ color: '#10b981' }}>
                    <ArrowUpRight size={12} />
                    {formatCurrency(dayIncome)}
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="text-[12px] font-medium flex items-center gap-0.5" style={{ color: '#f43f5e' }}>
                    <ArrowDownRight size={12} />
                    {formatCurrency(dayExpense)}
                  </span>
                )}
              </div>
            </div>

            {/* 항목 목록 */}
            <div className="space-y-1.5">
              {items.map(t => {
                const isIncome = t.transaction_type === 'income'
                const isExpanded = expandedId === t.id

                const iconColor = isIncome ? '#10b981' : t.expense_type === 'office' ? '#3b82f6' : '#f97316'
                const iconBg    = isIncome ? 'rgba(16,185,129,0.1)' : t.expense_type === 'office' ? 'rgba(59,130,246,0.1)' : 'rgba(249,115,22,0.1)'
                const IconEl    = isIncome ? TrendingUp : t.expense_type === 'office' ? Building2 : User

                return (
                  <div
                    key={t.id}
                    className="rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      background: isExpanded ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      border: `1px solid ${isExpanded ? 'var(--border-light)' : 'var(--border)'}`,
                    }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      {/* 아이콘 */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color: iconColor }}
                      >
                        <IconEl size={15} />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {t.description || (isIncome
                              ? (t.income_sources?.name || '수입')
                              : (t.expense_categories?.name || '지출')
                            )}
                          </p>
                          {t.is_fixed && (
                            <span
                              className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}
                            >
                              <Lock size={9} />고정
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {isIncome
                            ? (t.income_sources?.name || '—')
                            : `${t.expense_type === 'office' ? '사무실' : '개인'} · ${t.expense_categories?.name || '—'}`
                          }
                        </p>
                      </div>

                      {/* 금액 + 화살표 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p
                          className="text-[14px] font-bold"
                          style={{ color: isIncome ? '#10b981' : '#f43f5e' }}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <ChevronDown
                          size={14}
                          style={{
                            color: 'var(--text-muted)',
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* 확장 패널 */}
                    {isExpanded && (
                      <div
                        className="px-4 pb-3 pt-2 fade-in"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            {t.memo && (
                              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>메모 · </span>
                                {t.memo}
                              </p>
                            )}
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              등록일 · {new Date(t.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deletingId === t.id}
                            className={cn(
                              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                              deletingId === t.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                            )}
                            style={{
                              background: 'rgba(244,63,94,0.08)',
                              border: '1px solid rgba(244,63,94,0.2)',
                              color: '#f43f5e',
                            }}
                          >
                            <Trash2 size={12} />
                            {deletingId === t.id ? '삭제 중' : '삭제'}
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

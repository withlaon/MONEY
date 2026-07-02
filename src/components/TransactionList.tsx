'use client'

import { useState } from 'react'
import { Trash2, Pencil, TrendingUp, Building2, User, Lock, ChevronDown, TrendingDown, Receipt } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'

interface Props {
  transactions: Transaction[]
  onDelete: (id: string) => void
  onEdit: (tx: Transaction) => void
}

export default function TransactionList({ transactions, onDelete, onEdit }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const del = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return
    setDeletingId(id)
    try { await onDelete(id) } finally { setDeletingId(null) }
  }

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)' }}>
          <Receipt size={22} style={{ color: 'var(--day-text3)' }} />
        </div>
        <p className="text-[15px] font-bold" style={{ color: 'var(--day-text2)' }}>거래 내역이 없습니다</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--day-text3)' }}>상단 버튼으로 수입·지출을 추가하세요</p>
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
    <div className="space-y-6">
      {dates.map(date => {
        const items  = grouped[date]
        const dayIn  = items.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
        const dayOut = items.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)

        return (
          <div key={date}>
            {/* 날짜 구분선 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[12px] font-extrabold whitespace-nowrap" style={{ color: 'var(--day-text3)' }}>
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--day-border)' }} />
              <div className="flex items-center gap-3 flex-shrink-0">
                {dayIn > 0 && (
                  <span className="text-[12px] font-bold" style={{ color: '#059669' }}>
                    +{formatCurrency(dayIn)}
                  </span>
                )}
                {dayOut > 0 && (
                  <span className="text-[12px] font-bold" style={{ color: '#dc2626' }}>
                    -{formatCurrency(dayOut)}
                  </span>
                )}
              </div>
            </div>

            {/* 거래 항목들 */}
            <div className="space-y-2">
              {items.map(t => {
                const inc    = t.transaction_type === 'income'
                const open   = expandedId === t.id
                const color  = inc ? '#059669' : t.expense_type === 'office' ? '#2563eb' : '#ea580c'
                const soft   = inc ? '#ecfdf5' : t.expense_type === 'office' ? '#eff6ff' : '#fff7ed'
                const bar    = inc ? '#059669' : t.expense_type === 'office' ? '#2563eb' : '#ea580c'
                const Icon   = inc ? TrendingUp : t.expense_type === 'office' ? Building2 : User

                const name = t.description
                  || (inc ? t.income_sources?.name : t.expense_categories?.name)
                  || (inc ? '수입' : '지출')
                const sub  = inc
                  ? (t.income_sources?.name || '—')
                  : `${t.expense_type === 'office' ? '사무실' : '개인'} · ${t.expense_categories?.name || '—'}`

                return (
                  <div
                    key={t.id}
                    className={cn('overflow-hidden transition-all duration-200')}
                    style={{
                      background: 'var(--day-card)',
                      border: `1px solid ${open ? 'var(--day-border2)' : 'var(--day-border)'}`,
                      borderRadius: 14,
                      boxShadow: open ? 'var(--day-shadow-md)' : 'var(--day-shadow)',
                    }}
                  >
                    {/* 왼쪽 컬러 바 */}
                    <div className="flex">
                      <div style={{ width: 3, background: bar, flexShrink: 0 }} />

                      {/* 메인 행 */}
                      <div
                        className="flex-1 flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                        onClick={() => setExpandedId(open ? null : t.id)}
                      >
                        {/* 아이콘 */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: soft, color }}>
                          <Icon size={15} />
                        </div>

                        {/* 텍스트 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--day-text1)' }}>
                              {name}
                            </p>
                            {t.is_fixed && (
                              <span className="flex-shrink-0 flex items-center gap-1 badge"
                                style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                <Lock size={9} />고정
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--day-text3)' }}>{sub}</p>
                        </div>

                        {/* 금액 + 화살표 */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="text-[15px] font-extrabold" style={{ color: inc ? '#059669' : '#dc2626' }}>
                            {inc ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                          <ChevronDown
                            size={14}
                            style={{
                              color: 'var(--day-text3)',
                              transform: open ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 확장 영역 */}
                    {open && (
                      <div className="px-5 pb-4 pt-3 fade-in"
                        style={{ borderTop: '1px solid var(--day-border)', background: 'var(--day-card2)' }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            {t.memo && (
                              <p className="text-[13px]" style={{ color: 'var(--day-text2)' }}>
                                <span className="font-bold" style={{ color: 'var(--day-text3)' }}>메모 · </span>
                                {t.memo}
                              </p>
                            )}
                            {t.payment_method && (
                              <p className="text-[12px]" style={{ color: 'var(--day-text3)' }}>
                                결제 · {t.payment_method}
                              </p>
                            )}
                            <p className="text-[12px]" style={{ color: 'var(--day-text3)' }}>
                              등록일 · {new Date(t.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => onEdit(t)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
                              style={{ background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}
                            >
                              <Pencil size={12} />
                              수정
                            </button>
                            <button
                              onClick={() => del(t.id)}
                              disabled={deletingId === t.id}
                              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold', deletingId === t.id && 'opacity-50')}
                              style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}
                            >
                              <Trash2 size={12} />
                              {deletingId === t.id ? '삭제 중' : '삭제'}
                            </button>
                          </div>
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

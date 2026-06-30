'use client'

import { useState } from 'react'
import { Trash2, TrendingUp, TrendingDown, Building2, User, Lock, ChevronDown } from 'lucide-react'
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
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 text-[#3d4168]">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1d27] border border-[#252836] flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-7 h-7 opacity-30" />
        </div>
        <p className="text-sm font-medium text-[#6b7280]">거래 내역이 없습니다</p>
        <p className="text-xs text-[#3d4168] mt-1">상단의 버튼으로 거래를 추가하세요</p>
      </div>
    )
  }

  // 날짜별 그룹
  const grouped = transactions.reduce((acc, t) => {
    const date = t.transaction_date
    if (!acc[date]) acc[date] = []
    acc[date].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      {sortedDates.map(date => {
        const dayTransactions = grouped[date]
        const dayIncome = dayTransactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
        const dayExpense = dayTransactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)

        return (
          <div key={date} className="space-y-1">
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between px-1 py-1.5">
              <span className="text-xs font-semibold text-[#6b7280]">{formatDate(date)}</span>
              <div className="flex items-center gap-3 text-xs">
                {dayIncome > 0 && <span className="text-emerald-400">+{formatCurrency(dayIncome)}</span>}
                {dayExpense > 0 && <span className="text-red-400">-{formatCurrency(dayExpense)}</span>}
              </div>
            </div>

            {dayTransactions.map(t => (
              <div
                key={t.id}
                className={cn(
                  'bg-[#1a1d27] border rounded-xl overflow-hidden transition-all',
                  expandedId === t.id ? 'border-[#6c63ff50]' : 'border-[#252836]'
                )}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  {/* 타입 아이콘 */}
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    t.transaction_type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : t.expense_type === 'office'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-orange-500/20 text-orange-400'
                  )}>
                    {t.transaction_type === 'income'
                      ? <TrendingUp className="w-4 h-4" />
                      : t.expense_type === 'office'
                        ? <Building2 className="w-4 h-4" />
                        : <User className="w-4 h-4" />
                    }
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {t.description || (t.transaction_type === 'income'
                          ? (t.income_sources?.name || '수입')
                          : (t.expense_categories?.name || '지출'))}
                      </p>
                      {t.is_fixed && (
                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-slate-400 bg-slate-500/20 px-1.5 py-0.5 rounded-md">
                          <Lock className="w-2.5 h-2.5" />고정
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {t.transaction_type === 'income'
                        ? (t.income_sources?.name || '—')
                        : `${t.expense_type === 'office' ? '사무실' : '개인'} · ${t.expense_categories?.name || '—'}`
                      }
                    </p>
                  </div>

                  {/* 금액 */}
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-sm font-bold',
                      t.transaction_type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {t.transaction_type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>

                  <ChevronDown className={cn(
                    'w-4 h-4 text-[#3d4168] transition-transform flex-shrink-0',
                    expandedId === t.id && 'rotate-180'
                  )} />
                </div>

                {/* 확장 내용 */}
                {expandedId === t.id && (
                  <div className="px-4 pb-3 border-t border-[#252836] pt-3 slide-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        {t.memo && (
                          <p className="text-xs text-[#6b7280]">
                            <span className="text-[#4d5570]">메모: </span>{t.memo}
                          </p>
                        )}
                        <p className="text-xs text-[#4d5570]">
                          등록: {new Date(t.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

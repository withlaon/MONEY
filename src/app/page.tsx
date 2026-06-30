'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'
import { cn, formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { year: initYear, month: initMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('income')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)

  const openForm = (type: 'income' | 'expense') => {
    setFormType(type)
    setShowForm(true)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">대시보드</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">월별 수입/지출 현황</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            수입
          </button>
          <button
            onClick={() => openForm('expense')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6c63ff20] border border-[#6c63ff30] text-[#8b84ff] text-sm font-medium hover:bg-[#6c63ff30] transition-all"
          >
            <TrendingDown className="w-4 h-4" />
            지출
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#1a1d27] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      {/* 잔액 하이라이트 */}
      {!loading && (
        <div className={cn(
          'rounded-2xl p-5 flex items-center justify-between',
          stats.balance >= 0
            ? 'bg-gradient-to-r from-[#6c63ff15] to-[#22c55e10] border border-[#6c63ff20]'
            : 'bg-gradient-to-r from-[#ef444415] to-[#dc262610] border border-[#ef444420]'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              stats.balance >= 0 ? 'bg-[#6c63ff20] text-[#8b84ff]' : 'bg-red-500/20 text-red-400'
            )}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">{year}년 {month}월 최종 잔액</p>
              <p className={cn(
                'text-xl font-bold mt-0.5',
                stats.balance >= 0 ? 'text-white' : 'text-red-400'
              )}>
                {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6b7280]">수익률</p>
            <p className={cn(
              'text-lg font-semibold mt-0.5',
              stats.totalIncome > 0 && (stats.balance / stats.totalIncome) >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {stats.totalIncome > 0
                ? `${((stats.balance / stats.totalIncome) * 100).toFixed(1)}%`
                : '—'
              }
            </p>
          </div>
        </div>
      )}

      {/* 거래 내역 */}
      <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2130]">
          <h2 className="text-sm font-semibold text-white">
            거래 내역
            {!loading && (
              <span className="ml-2 text-xs text-[#6b7280] font-normal">
                총 {transactions.length}건
              </span>
            )}
          </h2>
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1.5 text-xs text-[#6c63ff] hover:text-[#8b84ff] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-[#1a1d27] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <TransactionList transactions={transactions} onDelete={deleteTransaction} />
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm
          defaultType={formType}
          onSubmit={addTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

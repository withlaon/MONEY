'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'
import { cn } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'

type FilterType = 'all' | 'income' | 'expense' | 'office' | 'personal' | 'fixed'

export default function TransactionsPage() {
  const { year: initYear, month: initMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('income')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)

  const openForm = (type: 'income' | 'expense') => {
    setFormType(type)
    setShowForm(true)
  }

  const filteredTransactions: Transaction[] = transactions.filter(t => {
    if (filter === 'income' && t.transaction_type !== 'income') return false
    if (filter === 'expense' && t.transaction_type !== 'expense') return false
    if (filter === 'office' && t.expense_type !== 'office') return false
    if (filter === 'personal' && t.expense_type !== 'personal') return false
    if (filter === 'fixed' && !t.is_fixed) return false
    if (search) {
      const q = search.toLowerCase()
      const desc = (t.description || '').toLowerCase()
      const memo = (t.memo || '').toLowerCase()
      const source = (t.income_sources?.name || '').toLowerCase()
      const cat = (t.expense_categories?.name || '').toLowerCase()
      if (!desc.includes(q) && !memo.includes(q) && !source.includes(q) && !cat.includes(q)) return false
    }
    return true
  })

  const filterButtons: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: '전체', color: 'text-white bg-[#252836]' },
    { key: 'income', label: '수입', color: 'text-emerald-400 bg-emerald-500/20' },
    { key: 'expense', label: '지출', color: 'text-red-400 bg-red-500/20' },
    { key: 'office', label: '사무실', color: 'text-blue-400 bg-blue-500/20' },
    { key: 'personal', label: '개인', color: 'text-orange-400 bg-orange-500/20' },
    { key: 'fixed', label: '고정비', color: 'text-slate-300 bg-slate-500/20' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">거래내역</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">수입/지출 상세 내역 관리</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            수입
          </button>
          <button
            onClick={() => openForm('expense')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#6c63ff20] border border-[#6c63ff30] text-[#8b84ff] text-sm font-medium hover:bg-[#6c63ff30] transition-all"
          >
            <TrendingDown className="w-4 h-4" />
            지출
          </button>
        </div>
      </div>

      {/* 월별 요약 바 */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1d27] border border-[#252836] rounded-xl p-4">
            <p className="text-xs text-[#6b7280]">총 수입</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#252836] rounded-xl p-4">
            <p className="text-xs text-[#6b7280]">총 지출</p>
            <p className="text-lg font-bold text-red-400 mt-1">{formatCurrency(stats.totalExpense)}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#252836] rounded-xl p-4">
            <p className="text-xs text-[#6b7280]">잔액</p>
            <p className={cn('text-lg font-bold mt-1', stats.balance >= 0 ? 'text-violet-400' : 'text-red-400')}>
              {formatCurrency(stats.balance)}
            </p>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            placeholder="내역, 메모, 카테고리 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1d27] border border-[#252836] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#3d4168] focus:border-[#6c63ff] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                filter === btn.key
                  ? `${btn.color} border-current/30`
                  : 'text-[#6b7280] bg-[#1a1d27] border-[#252836] hover:text-white'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#1a1d27] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {filteredTransactions.length !== transactions.length && (
              <p className="text-xs text-[#6b7280] mb-4">
                {filteredTransactions.length}건 표시 중 (전체 {transactions.length}건)
              </p>
            )}
            <TransactionList transactions={filteredTransactions} onDelete={deleteTransaction} />
          </>
        )}
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

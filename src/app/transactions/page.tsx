'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Search, SlidersHorizontal } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'
import { cn } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'

type FilterType = 'all' | 'income' | 'expense' | 'office' | 'personal' | 'fixed'

const filters: { key: FilterType; label: string; activeColor: string; activeBg: string; activeBorder: string }[] = [
  { key: 'all',      label: '전체',   activeColor: 'var(--text-primary)', activeBg: 'var(--bg-elevated)', activeBorder: 'var(--border-light)' },
  { key: 'income',   label: '수입',   activeColor: '#10b981', activeBg: 'rgba(16,185,129,0.1)',  activeBorder: 'rgba(16,185,129,0.25)' },
  { key: 'expense',  label: '지출',   activeColor: '#f43f5e', activeBg: 'rgba(244,63,94,0.1)',   activeBorder: 'rgba(244,63,94,0.25)' },
  { key: 'office',   label: '사무실', activeColor: '#3b82f6', activeBg: 'rgba(59,130,246,0.1)',  activeBorder: 'rgba(59,130,246,0.25)' },
  { key: 'personal', label: '개인',   activeColor: '#f97316', activeBg: 'rgba(249,115,22,0.1)',  activeBorder: 'rgba(249,115,22,0.25)' },
  { key: 'fixed',    label: '고정비', activeColor: '#94a3b8', activeBg: 'rgba(148,163,184,0.1)', activeBorder: 'rgba(148,163,184,0.25)' },
]

export default function TransactionsPage() {
  const { year: initYear, month: initMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('income')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)

  const openForm = (type: 'income' | 'expense') => { setFormType(type); setShowForm(true) }

  const filtered: Transaction[] = transactions.filter(t => {
    if (filter === 'income'   && t.transaction_type !== 'income') return false
    if (filter === 'expense'  && t.transaction_type !== 'expense') return false
    if (filter === 'office'   && t.expense_type !== 'office') return false
    if (filter === 'personal' && t.expense_type !== 'personal') return false
    if (filter === 'fixed'    && !t.is_fixed) return false
    if (search) {
      const q = search.toLowerCase()
      const fields = [t.description, t.memo, t.income_sources?.name, t.expense_categories?.name]
      if (!fields.some(f => f?.toLowerCase().includes(q))) return false
    }
    return true
  })

  const summaryCards = [
    { label: '총 수입', value: stats.totalIncome, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
    { label: '총 지출', value: stats.totalExpense, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.18)' },
    { label: '잔액',    value: stats.balance,       color: stats.balance >= 0 ? '#a78bfa' : '#f43f5e', bg: 'rgba(123,111,224,0.08)', border: 'rgba(123,111,224,0.18)' },
  ]

  return (
    <div className="min-h-full p-5 sm:p-7 max-w-[900px] mx-auto space-y-5">

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>거래내역</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>수입·지출 상세 관리</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
          >
            <TrendingUp size={13} /> 수입
          </button>
          <button
            onClick={() => openForm('expense')}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'rgba(123,111,224,0.12)', border: '1px solid rgba(123,111,224,0.25)', color: 'var(--primary-light)' }}
          >
            <TrendingDown size={13} /> 지출
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 fade-up">
          {summaryCards.map(c => (
            <div key={c.label} className="rounded-xl p-4 hover-card" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              <p className="text-[15px] font-bold" style={{ color: c.color }}>{formatCurrency(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* 검색 + 필터 */}
      <div className="space-y-2.5 fade-up">
        <div
          className="flex items-center gap-2 px-3.5 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', height: 40 }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="내역, 카테고리, 메모 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[13px] placeholder:text-[var(--text-muted)]"
            style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none' }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={13} style={{ color: 'var(--text-muted)' }} />
          {filters.map(f => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
                style={{
                  background: isActive ? f.activeBg : 'var(--bg-card)',
                  border: `1px solid ${isActive ? f.activeBorder : 'var(--border)'}`,
                  color: isActive ? f.activeColor : 'var(--text-muted)',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 목록 */}
      <div
        className="rounded-2xl overflow-hidden fade-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {filter !== 'all' || search
              ? `${filtered.length}건 필터됨`
              : `전체 ${transactions.length}건`}
          </p>
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1 text-[12px] font-medium"
            style={{ color: 'var(--primary-light)' }}
          >
            <Plus size={12} /> 추가
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-[62px] rounded-xl animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
              ))}
            </div>
          ) : (
            <TransactionList transactions={filtered} onDelete={deleteTransaction} />
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm defaultType={formType} onSubmit={addTransaction} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}

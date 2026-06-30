'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--day-card2)' }}>
      <div className="skeleton w-11 h-11 flex-shrink-0" style={{ borderRadius: 14 }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/5 rounded-lg" />
        <div className="skeleton h-3 w-2/5 rounded-lg" />
      </div>
      <div className="skeleton h-5 w-24 rounded-lg flex-shrink-0" />
    </div>
  )
}

export default function TransactionsPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear]     = useState(iy)
  const [month, setMonth]   = useState(im)
  const [showForm, setShowForm]  = useState(false)
  const [formType, setFormType]  = useState<'income'|'expense'>('income')
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all')

  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions(year, month)
  const openForm = (t: 'income'|'expense') => { setFormType(t); setShowForm(true) }

  const filtered = filterType === 'all' ? transactions
    : transactions.filter(t => t.transaction_type === filterType)

  const btn = (active: boolean) => ({
    padding: '7px 18px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    background: active ? 'var(--primary)' : 'var(--day-card2)',
    color: active ? '#fff' : 'var(--day-text2)',
    border: active ? 'none' : '1px solid var(--day-border)',
    transition: 'all 0.15s ease',
  })

  return (
    <div className="page-wrap space-y-6">

      {/* ── 헤더 ── */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold" style={{ color: 'var(--day-text1)' }}>거래 내역</h1>
            <p className="text-[14px] mt-1" style={{ color: 'var(--day-text3)' }}>{year}년 {month}월 전체 거래</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 pt-1">
            <button onClick={() => openForm('income')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[14px] font-bold"
              style={{ background: 'var(--income-soft)', border: '1px solid var(--income-border)', color: 'var(--income)' }}>
              <TrendingUp size={16} /> 수입 추가
            </button>
            <button onClick={() => openForm('expense')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[14px] font-bold"
              style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-light)' }}>
              <TrendingDown size={16} /> 지출 추가
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
          <div className="flex sm:hidden gap-2">
            <button onClick={() => openForm('income')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold"
              style={{ background:'var(--income-soft)', border:'1px solid var(--income-border)', color:'var(--income)' }}>
              <TrendingUp size={13}/> 수입
            </button>
            <button onClick={() => openForm('expense')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold"
              style={{ background:'var(--primary-soft)', border:'1px solid var(--primary-border)', color:'var(--primary-light)' }}>
              <TrendingDown size={13}/> 지출
            </button>
          </div>
        </div>
      </div>

      {/* ── 필터 탭 + 리스트 ── */}
      <div className="day-card overflow-hidden fade-up">
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5"
          style={{ borderBottom: '1px solid var(--day-border)' }}>
          <div className="flex gap-2">
            {(['all','income','expense'] as const).map(type => (
              <button key={type} onClick={() => setFilterType(type)} style={btn(filterType === type)}>
                {type === 'all' ? '전체' : type === 'income' ? '수입' : '지출'}
              </button>
            ))}
          </div>
          {!loading && (
            <span className="text-[13px] font-bold" style={{ color:'var(--day-text3)' }}>
              {filtered.length}건
            </span>
          )}
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          {loading && !transactions.length ? (
            <div className="space-y-3">
              {Array.from({length:6}).map((_,i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color:'var(--day-text3)' }}>
              <p className="text-[44px] mb-3">📋</p>
              <p className="text-[16px] font-bold">거래 내역이 없습니다</p>
              <p className="text-[13px] mt-1">위 버튼으로 수입 또는 지출을 추가해보세요</p>
            </div>
          ) : (
            <TransactionList transactions={filtered} onDelete={deleteTransaction} />
          )}
        </div>
      </div>

      <div className="sm:hidden fixed bottom-[calc(var(--nav-h)+16px)] right-5 z-40">
        <button onClick={() => openForm('income')}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
          style={{ background: 'var(--primary)' }}>
          <Plus size={24} color="#fff" />
        </button>
      </div>

      {showForm && <TransactionForm defaultType={formType} onSubmit={async (d) => { await addTransaction(d) }} onClose={() => setShowForm(false)} />}
    </div>
  )
}

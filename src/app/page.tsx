'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'

function SkeletonCard() {
  return <div className="skeleton h-[108px]" />
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--day-card2)' }}>
      <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" style={{ borderRadius: 14 }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/5 rounded-lg" />
        <div className="skeleton h-3 w-2/5 rounded-lg" />
      </div>
      <div className="skeleton h-5 w-24 rounded-lg flex-shrink-0" />
    </div>
  )
}

export default function DashboardPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear]   = useState(iy)
  const [month, setMonth] = useState(im)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income'|'expense'>('income')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)
  const openForm = (t: 'income'|'expense') => { setFormType(t); setShowForm(true) }
  const rate = stats.totalIncome > 0 ? ((stats.balance / stats.totalIncome) * 100).toFixed(1) : null

  return (
    <div className="page-wrap space-y-6">

      {/* ── 헤더 ── */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold" style={{ color: 'var(--day-text1)' }}>
              대시보드
            </h1>
            <p className="text-[14px] mt-1" style={{ color: 'var(--day-text3)' }}>
              {year}년 {month}월 수입 · 지출 현황
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 pt-1">
            <button
              onClick={() => openForm('income')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[14px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--income-soft)', border: '1px solid var(--income-border)', color: 'var(--income)' }}
            >
              <TrendingUp size={16} /> 수입 추가
            </button>
            <button
              onClick={() => openForm('expense')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[14px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-light)' }}
            >
              <TrendingDown size={16} /> 지출 추가
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => openForm('income')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold"
              style={{ background:'var(--income-soft)', border:'1px solid var(--income-border)', color:'var(--income)' }}>
              <TrendingUp size={14}/> 수입
            </button>
            <button onClick={() => openForm('expense')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold"
              style={{ background:'var(--primary-soft)', border:'1px solid var(--primary-border)', color:'var(--primary-light)' }}>
              <TrendingDown size={14}/> 지출
            </button>
          </div>
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      {loading && !transactions.length ? (
        <div className="stats-grid">
          {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : <StatsCards stats={stats} />}

      {/* ── 잔액 배너 ── */}
      {(loading && !transactions.length) ? (
        <div className="skeleton h-[100px] rounded-3xl" />
      ) : (
        <div
          className="rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-4 fade-up"
          style={{
            background: stats.balance >= 0
              ? 'linear-gradient(135deg, #ece9fd 0%, #edfcf4 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fff5f0 100%)',
            border: `1.5px solid ${stats.balance >= 0 ? 'rgba(80,70,228,0.2)' : 'var(--expense-border)'}`,
            boxShadow: 'var(--day-shadow-md)',
          }}
        >
          <div>
            <p className="text-[13px] font-bold" style={{ color: 'var(--day-text3)' }}>{year}년 {month}월 최종 잔액</p>
            <p className="text-[30px] sm:text-[38px] font-extrabold mt-1 leading-tight"
               style={{ color: stats.balance >= 0 ? 'var(--primary)' : 'var(--expense)' }}>
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </p>
          </div>
          {rate && (
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl"
              style={{
                background: Number(rate) >= 0 ? 'var(--income-soft)' : 'var(--expense-soft)',
                border: `1px solid ${Number(rate) >= 0 ? 'var(--income-border)' : 'var(--expense-border)'}`,
              }}>
              <ArrowUpRight size={18} style={{ color: Number(rate) >= 0 ? 'var(--income)' : 'var(--expense)' }} />
              <div>
                <p className="text-[12px] font-bold" style={{ color:'var(--day-text3)' }}>수익률</p>
                <p className="text-[22px] sm:text-[26px] font-extrabold leading-tight"
                   style={{ color: Number(rate) >= 0 ? 'var(--income)' : 'var(--expense)' }}>{rate}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 거래 내역 ── */}
      <div className="day-card overflow-hidden fade-up">
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5"
          style={{ borderBottom: '1px solid var(--day-border)' }}>
          <div className="flex items-center gap-3">
            <p className="text-[16px] sm:text-[18px] font-extrabold" style={{ color: 'var(--day-text1)' }}>거래 내역</p>
            {!loading && (
              <span className="text-[12px] font-bold px-3 py-1 rounded-xl"
                style={{ background: 'var(--day-card2)', color: 'var(--day-text3)', border: '1px solid var(--day-border)' }}>
                {transactions.length}건
              </span>
            )}
          </div>
          <button onClick={() => openForm('income')}
            className="flex items-center gap-2 text-[13px] font-bold px-4 py-2 rounded-xl"
            style={{ color: 'var(--primary-light)', background: 'var(--primary-soft)', border: '1px solid var(--primary-border)' }}>
            <Plus size={14} /> 추가
          </button>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          {loading && !transactions.length ? (
            <div className="space-y-3">
              {Array.from({length:5}).map((_,i) => <SkeletonRow key={i} />)}
            </div>
          ) : <TransactionList transactions={transactions} onDelete={deleteTransaction} />}
        </div>
      </div>

      {showForm && (
        <TransactionForm defaultType={formType} onSubmit={async (d) => { await addTransaction(d) }} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'

export default function DashboardPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear] = useState(iy)
  const [month, setMonth] = useState(im)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('income')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)

  const openForm = (t: 'income' | 'expense') => { setFormType(t); setShowForm(true) }
  const profitRate = stats.totalIncome > 0
    ? ((stats.balance / stats.totalIncome) * 100).toFixed(1)
    : null

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 max-w-[1280px] mx-auto space-y-4 sm:space-y-5">

      {/* ── 헤더 ── */}
      <div className="fade-up">
        {/* 모바일: 타이틀 + 버튼 세로 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
              대시보드
            </h1>
            <p className="text-[12px] sm:text-[13px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              {year}년 {month}월 현황
            </p>
          </div>
          {/* 데스크탑 버튼 */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => openForm('income')}
              className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'var(--income-soft)', border: '1px solid var(--income-border)', color: 'var(--income)' }}
            >
              <TrendingUp size={14} /> 수입
            </button>
            <button
              onClick={() => openForm('expense')}
              className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'var(--primary-glow)', border: '1px solid rgba(124,111,224,0.25)', color: 'var(--primary-light)' }}
            >
              <TrendingDown size={14} /> 지출
            </button>
          </div>
        </div>

        {/* 월 선택 + 모바일 버튼 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
          {/* 모바일 버튼 */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => openForm('income')}
              className="flex items-center gap-1 text-[12px] font-bold px-3 py-2 rounded-xl"
              style={{ background: 'var(--income-soft)', border: '1px solid var(--income-border)', color: 'var(--income)' }}
            >
              <TrendingUp size={13} /> 수입
            </button>
            <button
              onClick={() => openForm('expense')}
              className="flex items-center gap-1 text-[12px] font-bold px-3 py-2 rounded-xl"
              style={{ background: 'var(--primary-glow)', border: '1px solid rgba(124,111,224,0.25)', color: 'var(--primary-light)' }}
            >
              <TrendingDown size={13} /> 지출
            </button>
          </div>
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      {loading ? (
        <div className="stats-grid">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="h-[80px] sm:h-[88px] rounded-2xl animate-pulse" style={{ background:'var(--bg-card)' }} />
          ))}
        </div>
      ) : <StatsCards stats={stats} />}

      {/* ── 잔액 배너 ── */}
      {!loading && (
        <div
          className="rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 fade-up"
          style={{
            background: stats.balance >= 0
              ? 'linear-gradient(135deg, rgba(124,111,224,0.09), rgba(16,185,129,0.05))'
              : 'linear-gradient(135deg, rgba(244,63,94,0.09), rgba(244,63,94,0.03))',
            border: `1px solid ${stats.balance >= 0 ? 'rgba(124,111,224,0.18)' : 'rgba(244,63,94,0.18)'}`,
          }}
        >
          <div>
            <p className="text-[11px] sm:text-[12px] font-medium" style={{ color: 'var(--text-3)' }}>
              {year}년 {month}월 최종 잔액
            </p>
            <p className="text-[22px] sm:text-[28px] font-bold mt-0.5 tracking-tight"
               style={{ color: stats.balance >= 0 ? '#b8acff' : '#f43f5e' }}>
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </p>
          </div>
          {profitRate && (
            <div className="text-right">
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>수익률</p>
              <p className="text-[18px] sm:text-[22px] font-bold mt-0.5"
                 style={{ color: Number(profitRate) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                {profitRate}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 거래 내역 ── */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-3.5"
          style={{ borderBottom:'1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold" style={{ color:'var(--text-1)' }}>거래 내역</p>
            {!loading && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background:'var(--bg-elevated)', color:'var(--text-3)' }}>
                {transactions.length}건
              </span>
            )}
          </div>
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1 text-[12px] font-semibold"
            style={{ color:'var(--primary-light)' }}
          >
            <Plus size={13} /> 추가
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({length:5}).map((_,i) => (
                <div key={i} className="h-[58px] rounded-xl animate-pulse" style={{ background:'var(--bg-elevated)', animationDelay:`${i*50}ms` }} />
              ))}
            </div>
          ) : <TransactionList transactions={transactions} onDelete={deleteTransaction} />}
        </div>
      </div>

      {showForm && (
        <TransactionForm defaultType={formType} onSubmit={addTransaction} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}

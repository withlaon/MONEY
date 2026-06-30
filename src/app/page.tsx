'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'

function SkeletonCard() {
  return <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background: 'var(--day-card2)' }}>
      <div className="skeleton flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 12 }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 rounded-lg" style={{ width: '55%' }} />
        <div className="skeleton h-3 rounded-md" style={{ width: '35%' }} />
      </div>
      <div className="skeleton h-4 rounded-lg flex-shrink-0" style={{ width: 80 }} />
    </div>
  )
}

export default function DashboardPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear]   = useState(iy)
  const [month, setMonth] = useState(im)
  const [showForm, setShowForm]   = useState(false)
  const [formType, setFormType]   = useState<'income'|'expense'>('income')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)
  const openForm = (t: 'income'|'expense') => { setFormType(t); setShowForm(true) }

  const rate = stats.totalIncome > 0
    ? ((stats.balance / stats.totalIncome) * 100).toFixed(1)
    : null

  return (
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 헤더 ── */}
      <div className="fade-up">
        {/* 타이틀 + 버튼 */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-extrabold" style={{ fontSize: 26, color: 'var(--day-text1)' }}>대시보드</h1>
            <p style={{ fontSize: 13, color: 'var(--day-text3)', marginTop: 3 }}>
              {year}년 {month}월 수입 · 지출 현황
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 pt-1">
            <button onClick={() => openForm('income')}
              className="flex items-center gap-2 font-bold transition-opacity hover:opacity-80"
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}>
              <TrendingUp size={15} /> 수입 추가
            </button>
            <button onClick={() => openForm('expense')}
              className="flex items-center gap-2 font-bold transition-opacity hover:opacity-80"
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 12, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
              <TrendingDown size={15} /> 지출 추가
            </button>
          </div>
        </div>

        {/* 월 선택 + 모바일 버튼 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => openForm('income')} className="flex items-center gap-1.5 font-bold"
              style={{ fontSize: 13, padding: '7px 13px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}>
              <TrendingUp size={13}/> 수입
            </button>
            <button onClick={() => openForm('expense')} className="flex items-center gap-1.5 font-bold"
              style={{ fontSize: 13, padding: '7px 13px', borderRadius: 10, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
              <TrendingDown size={13}/> 지출
            </button>
          </div>
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      {loading && !transactions.length ? (
        <div className="stats-grid">
          {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      {/* ── 잔액 배너 ── */}
      {!(loading && !transactions.length) && (
        <div
          className="fade-up flex items-center justify-between gap-4 flex-wrap"
          style={{
            borderRadius: 20,
            padding: '20px 28px',
            background: stats.balance >= 0
              ? 'linear-gradient(120deg, #f5f3ff 0%, #ecfdf5 100%)'
              : 'linear-gradient(120deg, #fef2f2 0%, #fff7ed 100%)',
            border: `1px solid ${stats.balance >= 0 ? '#c7c3fa' : '#fca5a5'}`,
            boxShadow: 'var(--day-shadow)',
          }}
        >
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--day-text3)' }}>
              {year}년 {month}월 최종 잔액
            </p>
            <p style={{
              fontSize: 'clamp(26px, 5vw, 36px)',
              fontWeight: 800,
              marginTop: 4,
              lineHeight: 1.1,
              color: stats.balance >= 0 ? '#4f46e5' : '#dc2626',
            }}>
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </p>
          </div>
          {rate && (
            <div
              className="flex items-center gap-3 flex-shrink-0"
              style={{
                padding: '12px 20px',
                borderRadius: 14,
                background: Number(rate) >= 0 ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${Number(rate) >= 0 ? '#a7f3d0' : '#fca5a5'}`,
              }}
            >
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--day-text3)' }}>수익률</p>
                <p style={{
                  fontSize: 28, fontWeight: 800, lineHeight: 1.1,
                  color: Number(rate) >= 0 ? '#059669' : '#dc2626',
                }}>
                  {rate}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 거래 내역 ── */}
      <div className="fade-up" style={{
        background: 'var(--day-card)', border: '1px solid var(--day-border)',
        borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--day-shadow)',
      }}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between"
          style={{ padding: '16px 24px', borderBottom: '1px solid var(--day-border)' }}>
          <div className="flex items-center gap-2.5">
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--day-text1)' }}>거래 내역</p>
            {!loading && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: 'var(--day-card2)', color: 'var(--day-text3)', border: '1px solid var(--day-border)',
              }}>
                {transactions.length}건
              </span>
            )}
          </div>
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1.5 font-bold transition-opacity hover:opacity-80"
            style={{ fontSize: 13, padding: '7px 14px', borderRadius: 10, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}
          >
            <Plus size={13} /> 추가
          </button>
        </div>

        {/* 리스트 */}
        <div style={{ padding: '20px 24px' }}>
          {loading && !transactions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({length:5}).map((_,i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <TransactionList transactions={transactions} onDelete={deleteTransaction} />
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm
          defaultType={formType}
          onSubmit={async (d) => { await addTransaction(d) }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

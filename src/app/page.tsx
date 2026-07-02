'use client'

import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import MonthlyCharts from '@/components/MonthlyCharts'

function SkeletonCard() {
  return <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'var(--day-card2)' }}>
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

  const { transactions, loading, stats, deleteTransaction } = useTransactions(year, month)

  const rate = stats.totalIncome > 0
    ? ((stats.balance / stats.totalIncome) * 100).toFixed(1)
    : null

  return (
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── 헤더 ── */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--day-text1)' }}>대시보드</h1>
            <p style={{ fontSize: 13, color: 'var(--day-text3)', marginTop: 3 }}>
              {year}년 {month}월 수입 · 지출 현황
            </p>
          </div>
        </div>
        <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
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
            borderRadius: 16,
            padding: '18px 24px',
            background: stats.balance >= 0
              ? 'linear-gradient(120deg, #f5f3ff 0%, #ecfdf5 100%)'
              : 'linear-gradient(120deg, #fef2f2 0%, #fff7ed 100%)',
            border: `1px solid ${stats.balance >= 0 ? '#c7c3fa' : '#fca5a5'}`,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--day-text3)' }}>
              {year}년 {month}월 최종 잔액
            </p>
            <p style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 800,
              marginTop: 4,
              lineHeight: 1.1,
              color: stats.balance >= 0 ? '#4f46e5' : '#dc2626',
            }}>
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </p>
          </div>
          {rate && (
            <div style={{
              padding: '10px 18px', borderRadius: 12,
              background: Number(rate) >= 0 ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${Number(rate) >= 0 ? '#a7f3d0' : '#fca5a5'}`,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--day-text3)' }}>수익률</p>
              <p style={{
                fontSize: 24, fontWeight: 800, lineHeight: 1.1,
                color: Number(rate) >= 0 ? '#059669' : '#dc2626',
              }}>{rate}%</p>
            </div>
          )}
        </div>
      )}

      {/* ── 월간 시각화 차트 ── */}
      {!loading && transactions.length > 0 && (
        <div className="fade-up">
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--day-text1)', marginBottom: 12 }}>
            월간 분석
          </p>
          <MonthlyCharts
            transactions={transactions}
            stats={stats}
            year={year}
            month={month}
          />
        </div>
      )}

      {/* ── 거래 내역 ── */}
      <div className="fade-up" style={{
        background: 'var(--day-card)', border: '1px solid var(--day-border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--day-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--day-text1)' }}>거래 내역</p>
            {!loading && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: 'var(--day-card2)', color: 'var(--day-text3)', border: '1px solid var(--day-border)',
              }}>
                {transactions.length}건
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {loading && !transactions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({length:5}).map((_,i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <TransactionList transactions={transactions} onDelete={deleteTransaction} onEdit={() => {}} />
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'

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

  const profitRate = stats.totalIncome > 0
    ? ((stats.balance / stats.totalIncome) * 100).toFixed(1)
    : null

  return (
    <div className="min-h-full p-5 sm:p-7 max-w-[1280px] mx-auto space-y-6">

      {/* ── 헤더 ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            대시보드
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {year}년 {month}월 수입 · 지출 현황
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
          >
            <TrendingUp size={14} />
            수입 추가
          </button>
          <button
            onClick={() => openForm('expense')}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'rgba(123,111,224,0.12)', border: '1px solid rgba(123,111,224,0.25)', color: 'var(--primary-light)' }}
          >
            <TrendingDown size={14} />
            지출 추가
          </button>
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      {loading ? (
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      {/* ── 잔액 배너 ── */}
      {!loading && (
        <div
          className="rounded-2xl p-5 flex items-center justify-between gap-4 fade-up"
          style={{
            background: stats.balance >= 0
              ? 'linear-gradient(135deg, rgba(123,111,224,0.1), rgba(16,185,129,0.06))'
              : 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(244,63,94,0.04))',
            border: `1px solid ${stats.balance >= 0 ? 'rgba(123,111,224,0.2)' : 'rgba(244,63,94,0.2)'}`,
          }}
        >
          <div className="min-w-0">
            <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              {year}년 {month}월 최종 잔액
            </p>
            <p
              className="text-[26px] font-bold tracking-tight"
              style={{ color: stats.balance >= 0 ? '#a78bfa' : '#f43f5e' }}
            >
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {profitRate !== null && (
              <div
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-semibold"
                style={{
                  background: Number(profitRate) >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  color: Number(profitRate) >= 0 ? '#10b981' : '#f43f5e',
                  border: `1px solid ${Number(profitRate) >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                }}
              >
                {Number(profitRate) >= 0
                  ? <ArrowUpRight size={14} />
                  : <ArrowDownRight size={14} />
                }
                수익률 {profitRate}%
              </div>
            )}
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              총 {transactions.length}건
            </p>
          </div>
        </div>
      )}

      {/* ── 거래 내역 ── */}
      <div
        className="rounded-2xl overflow-hidden fade-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              거래 내역
            </h2>
            {!loading && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {transactions.length}건
              </span>
            )}
          </div>
          <button
            onClick={() => openForm('income')}
            className="flex items-center gap-1 text-[12px] font-medium transition-colors"
            style={{ color: 'var(--primary-light)' }}
          >
            <Plus size={13} />
            추가
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[62px] rounded-xl animate-pulse"
                  style={{ background: 'var(--bg-elevated)', animationDelay: `${i * 60}ms` }}
                />
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

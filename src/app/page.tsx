'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import StatsCards from '@/components/StatsCards'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'

export default function DashboardPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear]   = useState(iy)
  const [month, setMonth] = useState(im)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income'|'expense'>('income')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)
  const openForm = (t: 'income'|'expense') => { setFormType(t); setShowForm(true) }
  const rate = stats.totalIncome > 0 ? ((stats.balance / stats.totalIncome) * 100).toFixed(1) : null

  /* ── 버튼 공통 스타일 ── */
  const incBtn: React.CSSProperties = {
    display:'flex', alignItems:'center', gap:8, padding:'9px 18px',
    borderRadius:14, border:'1px solid var(--income-border)',
    background:'var(--income-soft)', color:'var(--income)',
    fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
  }
  const expBtn: React.CSSProperties = {
    ...incBtn, border:'1px solid var(--primary-border)',
    background:'var(--primary-soft)', color:'var(--primary-light)',
  }

  return (
    <div className="w-full px-5 py-6 sm:px-8 sm:py-8 lg:px-10 space-y-5 sm:space-y-6">

      {/* ── 헤더 ── */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-extrabold tracking-tight" style={{ color:'var(--day-text1)' }}>
              대시보드
            </h1>
            <p className="text-[14px] sm:text-[15px] mt-1" style={{ color:'var(--day-text3)' }}>
              {year}년 {month}월 수입 · 지출 현황
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
            <button style={incBtn} onClick={() => openForm('income')}>
              <TrendingUp size={15}/> 수입 추가
            </button>
            <button style={expBtn} onClick={() => openForm('expense')}>
              <TrendingDown size={15}/> 지출 추가
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }}/>
          <div className="flex sm:hidden items-center gap-2">
            <button style={{ ...incBtn, padding:'8px 14px', fontSize:13 }} onClick={() => openForm('income')}>
              <TrendingUp size={14}/> 수입
            </button>
            <button style={{ ...expBtn, padding:'8px 14px', fontSize:13 }} onClick={() => openForm('expense')}>
              <TrendingDown size={14}/> 지출
            </button>
          </div>
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      {loading ? (
        <div className="stats-grid">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ background:'var(--day-card)' }}/>
          ))}
        </div>
      ) : <StatsCards stats={stats}/>}

      {/* ── 잔액 배너 ── */}
      {!loading && (
        <div
          className="rounded-3xl p-5 sm:p-7 flex items-center justify-between gap-4 fade-up"
          style={{
            background: stats.balance >= 0
              ? 'linear-gradient(135deg, #eef0ff 0%, #f0fdf8 100%)'
              : 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
            border: `1.5px solid ${stats.balance >= 0 ? 'var(--primary-border)' : 'var(--expense-border)'}`,
            boxShadow: 'var(--day-shadow-lg)',
          }}
        >
          <div>
            <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color:'var(--day-text3)' }}>
              {year}년 {month}월 최종 잔액
            </p>
            <p className="text-[28px] sm:text-[36px] font-extrabold mt-1 tracking-tight"
              style={{ color: stats.balance >= 0 ? 'var(--primary)' : 'var(--expense)' }}>
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </p>
          </div>
          {rate && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-shrink-0"
              style={{
                background: Number(rate) >= 0 ? 'var(--income-soft)' : 'var(--expense-soft)',
                border: `1px solid ${Number(rate) >= 0 ? 'var(--income-border)' : 'var(--expense-border)'}`,
              }}
            >
              <ArrowUpRight size={16} style={{ color: Number(rate) >= 0 ? 'var(--income)' : 'var(--expense)' }}/>
              <div>
                <p className="text-[11px] sm:text-[12px]" style={{ color:'var(--day-text3)' }}>수익률</p>
                <p className="text-[18px] sm:text-[22px] font-extrabold leading-tight"
                  style={{ color: Number(rate) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {rate}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 거래 내역 ── */}
      <div
        className="rounded-3xl overflow-hidden fade-up"
        style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5"
          style={{ borderBottom:'1px solid var(--day-border)' }}>
          <div className="flex items-center gap-3">
            <p className="text-[16px] sm:text-[17px] font-extrabold" style={{ color:'var(--day-text1)' }}>거래 내역</p>
            {!loading && (
              <span className="text-[12px] sm:text-[13px] font-bold px-2.5 py-1 rounded-xl"
                style={{ background:'var(--day-card2)', color:'var(--day-text3)', border:'1px solid var(--day-border)' }}>
                {transactions.length}건
              </span>
            )}
          </div>
          <button onClick={() => openForm('income')}
            className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-bold px-3 py-2 rounded-xl transition-all"
            style={{ color:'var(--primary-light)', background:'var(--primary-soft)', border:'1px solid var(--primary-border)' }}>
            <Plus size={14}/> 추가
          </button>
        </div>
        <div className="p-5 sm:p-7">
          {loading ? (
            <div className="space-y-3">
              {Array.from({length:5}).map((_,i) => (
                <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ background:'var(--day-card2)', animationDelay:`${i*60}ms`}}/>
              ))}
            </div>
          ) : <TransactionList transactions={transactions} onDelete={deleteTransaction}/>}
        </div>
      </div>

      {showForm && <TransactionForm defaultType={formType} onSubmit={addTransaction} onClose={() => setShowForm(false)}/>}
    </div>
  )
}

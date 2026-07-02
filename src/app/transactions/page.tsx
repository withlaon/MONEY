'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'
import { Transaction } from '@/lib/supabase'

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

type Filter = 'all' | 'income' | 'expense'

export default function TransactionsPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear]   = useState(iy)
  const [month, setMonth] = useState(im)
  const [showForm, setShowForm]   = useState(false)
  const [formType, setFormType]   = useState<'income'|'expense'>('income')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [filter, setFilter]       = useState<Filter>('all')

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(year, month)
  const openForm = (t: 'income'|'expense') => { setFormType(t); setShowForm(true) }
  const openEdit = (tx: Transaction) => { setEditingTx(tx) }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.transaction_type === filter)

  const filterTabs: { key: Filter; label: string }[] = [
    { key: 'all',     label: '전체' },
    { key: 'income',  label: '수입' },
    { key: 'expense', label: '지출' },
  ]

  return (
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 헤더 ── */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-extrabold" style={{ fontSize: 26, color: 'var(--day-text1)' }}>거래 내역</h1>
            <p style={{ fontSize: 13, color: 'var(--day-text3)', marginTop: 3 }}>
              {year}년 {month}월 전체 거래 기록
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 pt-1">
            <button onClick={() => openForm('income')}
              className="flex items-center gap-2 font-bold"
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}>
              <TrendingUp size={15}/> 수입 추가
            </button>
            <button onClick={() => openForm('expense')}
              className="flex items-center gap-2 font-bold"
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 12, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
              <TrendingDown size={15}/> 지출 추가
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
          <div className="flex sm:hidden gap-2">
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

      {/* ── 리스트 카드 ── */}
      <div className="fade-up" style={{
        background: 'var(--day-card)', border: '1px solid var(--day-border)',
        borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--day-shadow)',
      }}>
        {/* 필터 탭 */}
        <div className="flex items-center justify-between"
          style={{ padding: '14px 24px', borderBottom: '1px solid var(--day-border)' }}>
          <div className="flex items-center gap-1.5">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="font-bold transition-all"
                style={{
                  fontSize: 13, padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
                  background: filter === tab.key ? '#4f46e5' : 'transparent',
                  color: filter === tab.key ? '#fff' : 'var(--day-text3)',
                  border: filter === tab.key ? 'none' : '1px solid transparent',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          {!loading && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--day-text3)' }}>
              {filtered.length}건
            </span>
          )}
        </div>

        {/* 리스트 */}
        <div style={{ padding: '20px 24px' }}>
          {loading && !transactions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({length:6}).map((_,i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--day-text2)' }}>거래 내역이 없습니다</p>
              <p style={{ fontSize: 13, marginTop: 4, color: 'var(--day-text3)' }}>위 버튼으로 추가하세요</p>
            </div>
          ) : (
            <TransactionList transactions={filtered} onDelete={deleteTransaction} onEdit={openEdit} />
          )}
        </div>
      </div>

      {/* 모바일 FAB */}
      <div className="sm:hidden fixed z-40" style={{ bottom: 'calc(var(--nav-h) + 16px)', right: 20 }}>
        <button onClick={() => openForm('income')}
          className="flex items-center justify-center rounded-full shadow-xl"
          style={{ width: 52, height: 52, background: '#4f46e5' }}>
          <Plus size={22} color="#fff" />
        </button>
      </div>

      {showForm && (
        <TransactionForm
          defaultType={formType}
          onSubmit={async (d) => { await addTransaction(d) }}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingTx && (
        <TransactionForm
          initialValues={editingTx}
          defaultType={editingTx.transaction_type}
          onSubmit={async (d) => { await updateTransaction(editingTx.id, d) }}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  )
}

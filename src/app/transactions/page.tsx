'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionForm from '@/components/TransactionForm'
import { Transaction } from '@/lib/supabase'

const DOW_KR = ['일', '월', '화', '수', '목', '금', '토']

function pad2(n: number) { return String(n).padStart(2, '0') }

export default function TransactionsPage() {
  const { year: iy, month: im } = getCurrentYearMonth()
  const [year, setYear]   = useState(iy)
  const [month, setMonth] = useState(im)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions(year, month)

  /* 날짜별 수입/지출 집계 */
  const byDate = transactions.reduce((acc, t) => {
    const d = t.transaction_date
    if (!acc[d]) acc[d] = { income: 0, expense: 0, items: [] }
    if (t.transaction_type === 'income') acc[d].income += t.amount
    else acc[d].expense += t.amount
    acc[d].items.push(t)
    return acc
  }, {} as Record<string, { income: number; expense: number; items: Transaction[] }>)

  /* 캘린더 셀 생성 */
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow    = new Date(year, month - 1, 1).getDay() // 0=일
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  /* 금액 축약 */
  const fmtShort = (v: number) =>
    v >= 100000000 ? `${(v / 100000000).toFixed(0)}억`
    : v >= 10000   ? `${(v / 10000).toFixed(0)}만`
    : v >= 1000    ? `${(v / 1000).toFixed(0)}천`
    : `${v}`

  const todayStr = new Date().toISOString().split('T')[0]

  const selectedTxs = selectedDate ? (byDate[selectedDate]?.items || []) : []
  const selectedDay = selectedDate?.split('-')[2]

  return (
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 헤더 */}
      <div className="fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--day-text1)' }}>거래 내역</h1>
        <p style={{ fontSize: 13, color: 'var(--day-text3)', marginTop: 3 }}>
          {year}년 {month}월 · 날짜를 클릭하면 세부내역을 확인할 수 있습니다
        </p>
        <div style={{ marginTop: 14 }}>
          <MonthSelector year={year} month={month}
            onChange={(y, m) => { setYear(y); setMonth(m); setSelectedDate(null) }} />
        </div>
      </div>

      {/* 캘린더 + 상세 패널 */}
      <div className="cal-layout fade-up">

        {/* ── 캘린더 ── */}
        <div style={{ background: '#fff', border: '1px solid var(--day-border)', overflow: 'hidden' }}>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8faff', borderBottom: '1px solid var(--day-border)' }}>
            {DOW_KR.map((d, i) => (
              <div key={d} style={{
                padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700,
                color: i === 0 ? '#dc2626' : i === 6 ? '#2563eb' : '#6b7280',
              }}>{d}</div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {loading && !transactions.length
              ? Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ minHeight: 72, margin: 1 }} />
                ))
              : cells.map((day, idx) => {
                  if (day === null) return (
                    <div key={`e-${idx}`} style={{ minHeight: 72, borderBottom: '1px solid #f3f4f6', borderLeft: idx % 7 !== 0 ? '1px solid #f3f4f6' : 'none' }} />
                  )

                  const ds    = `${year}-${pad2(month)}-${pad2(day)}`
                  const data  = byDate[ds]
                  const isSel = selectedDate === ds
                  const isTod = todayStr === ds
                  const dow   = (firstDow + day - 1) % 7

                  return (
                    <div key={day}
                      onClick={() => setSelectedDate(isSel ? null : ds)}
                      style={{
                        minHeight: 72, padding: '6px 5px', cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        borderLeft: idx % 7 !== 0 ? '1px solid #f3f4f6' : 'none',
                        background: isSel ? '#eef0fe' : data ? '#fafbff' : '#fff',
                        transition: 'background 0.1s',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = '#f5f7ff' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSel ? '#eef0fe' : data ? '#fafbff' : '#fff' }}
                    >
                      {/* 오늘 강조 */}
                      <div style={{
                        width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isTod ? '#4f46e5' : 'transparent',
                        borderRadius: '50%',
                        fontSize: 12, fontWeight: isTod ? 800 : 600,
                        color: isTod ? '#fff' : dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#374151',
                        marginBottom: 3,
                      }}>{day}</div>

                      {data?.income > 0 && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          +{fmtShort(data.income)}
                        </div>
                      )}
                      {data?.expense > 0 && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          -{fmtShort(data.expense)}
                        </div>
                      )}

                      {/* 선택 인디케이터 */}
                      {isSel && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#4f46e5' }} />
                      )}
                    </div>
                  )
                })}
          </div>

          {/* 하단 범례 */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 16 }}>
            {[{ c: '#059669', l: '수입' }, { c: '#dc2626', l: '지출' }].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: x.c }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 세부 내역 패널 ── */}
        <div style={{ background: '#fff', border: '1px solid var(--day-border)', overflow: 'hidden' }}>
          {!selectedDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
              <span style={{ fontSize: 40 }}>📅</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af' }}>날짜를 선택하세요</p>
              <p style={{ fontSize: 12, color: '#d1d5db' }}>캘린더에서 날짜를 클릭하면<br />해당일 거래 내역이 표시됩니다</p>
            </div>
          ) : (
            <>
              {/* 패널 헤더 */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--day-border)', background: '#f8faff' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                  {year}년 {month}월 {selectedDay}일
                </p>
                {byDate[selectedDate] ? (
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    {byDate[selectedDate].income > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                        수입 {formatCurrency(byDate[selectedDate].income)}원
                      </span>
                    )}
                    {byDate[selectedDate].expense > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                        지출 {formatCurrency(byDate[selectedDate].expense)}원
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>거래 없음</p>
                )}
              </div>

              {/* 거래 목록 */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedTxs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>이 날의 거래 내역이 없습니다</p>
                  </div>
                ) : selectedTxs
                    .sort((a, b) => (a.transaction_type === 'income' ? -1 : 1) - (b.transaction_type === 'income' ? -1 : 1))
                    .map(tx => (
                      <div key={tx.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px',
                        background: tx.transaction_type === 'income' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${tx.transaction_type === 'income' ? '#d1fae5' : '#fee2e2'}`,
                      }}>
                        {/* 타입 인디케이터 */}
                        <div style={{
                          width: 4, alignSelf: 'stretch',
                          background: tx.transaction_type === 'income' ? '#059669' : '#dc2626',
                          flexShrink: 0,
                        }} />

                        {/* 내용 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || (tx.transaction_type === 'income' ? '수입' : '지출')}
                          </p>
                          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                            {tx.transaction_type === 'income'
                              ? (tx.income_sources?.name || '수입')
                              : (tx.expense_categories?.name || '지출')}
                            {tx.payment_method ? ` · ${tx.payment_method}` : ''}
                            {tx.is_fixed ? ' · 고정비' : ''}
                          </p>
                          {tx.memo && (
                            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{tx.memo}</p>
                          )}
                        </div>

                        {/* 금액 */}
                        <span style={{
                          fontSize: 14, fontWeight: 800, flexShrink: 0,
                          color: tx.transaction_type === 'income' ? '#059669' : '#dc2626',
                        }}>
                          {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>

                        {/* 수정/삭제 */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => setEditingTx(tx)}
                            style={{ width: 28, height: 28, background: '#fff', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={async () => { await deleteTransaction(tx.id); if (byDate[selectedDate]?.items.length <= 1) setSelectedDate(null) }}
                            style={{ width: 28, height: 28, background: '#fef2f2', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
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

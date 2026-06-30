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

type F = 'all'|'income'|'expense'|'office'|'personal'|'fixed'

const filters: {key:F; label:string; c:string; bg:string; bd:string}[] = [
  {key:'all',      label:'전체',   c:'var(--text-1)', bg:'var(--bg-elevated)',     bd:'var(--border-hi)'},
  {key:'income',   label:'수입',   c:'var(--income)', bg:'var(--income-soft)',     bd:'var(--income-border)'},
  {key:'expense',  label:'지출',   c:'var(--expense)',bg:'var(--expense-soft)',    bd:'var(--expense-border)'},
  {key:'office',   label:'사무실', c:'var(--office)', bg:'var(--office-soft)',     bd:'rgba(59,130,246,0.25)'},
  {key:'personal', label:'개인',   c:'var(--personal)',bg:'var(--personal-soft)', bd:'rgba(249,115,22,0.25)'},
  {key:'fixed',    label:'고정비', c:'var(--fixed)',  bg:'var(--fixed-soft)',      bd:'rgba(148,163,184,0.25)'},
]

export default function TransactionsPage() {
  const { year:iy, month:im } = getCurrentYearMonth()
  const [year, setYear]   = useState(iy)
  const [month, setMonth] = useState(im)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income'|'expense'>('income')
  const [filter, setFilter] = useState<F>('all')
  const [search, setSearch] = useState('')

  const { transactions, loading, stats, addTransaction, deleteTransaction } = useTransactions(year, month)
  const openForm = (t: 'income'|'expense') => { setFormType(t); setShowForm(true) }

  const filtered: Transaction[] = transactions.filter(t => {
    if (filter==='income'   && t.transaction_type!=='income')  return false
    if (filter==='expense'  && t.transaction_type!=='expense') return false
    if (filter==='office'   && t.expense_type!=='office')      return false
    if (filter==='personal' && t.expense_type!=='personal')    return false
    if (filter==='fixed'    && !t.is_fixed)                    return false
    if (search) {
      const q = search.toLowerCase()
      if (![t.description, t.memo, t.income_sources?.name, t.expense_categories?.name]
          .some(f => f?.toLowerCase().includes(q))) return false
    }
    return true
  })

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 max-w-[900px] mx-auto space-y-4 sm:space-y-5">

      {/* 헤더 */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight" style={{ color:'var(--text-1)' }}>거래내역</h1>
            <p className="text-[12px] sm:text-[13px] mt-0.5" style={{ color:'var(--text-3)' }}>수입·지출 상세 관리</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => openForm('income')} className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl"
              style={{ background:'var(--income-soft)', border:'1px solid var(--income-border)', color:'var(--income)' }}>
              <TrendingUp size={13}/> 수입
            </button>
            <button onClick={() => openForm('expense')} className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl"
              style={{ background:'var(--primary-glow)', border:'1px solid rgba(124,111,224,0.25)', color:'var(--primary-light)' }}>
              <TrendingDown size={13}/> 지출
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <MonthSelector year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => openForm('income')} className="flex items-center gap-1 text-[12px] font-bold px-3 py-2 rounded-xl"
              style={{ background:'var(--income-soft)', border:'1px solid var(--income-border)', color:'var(--income)' }}>
              <TrendingUp size={12}/> 수입
            </button>
            <button onClick={() => openForm('expense')} className="flex items-center gap-1 text-[12px] font-bold px-3 py-2 rounded-xl"
              style={{ background:'var(--primary-glow)', border:'1px solid rgba(124,111,224,0.25)', color:'var(--primary-light)' }}>
              <TrendingDown size={12}/> 지출
            </button>
          </div>
        </div>
      </div>

      {/* 요약 */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 fade-up">
          {[
            { label:'수입', v:stats.totalIncome,  c:'var(--income)',  bg:'var(--income-soft)',  bd:'var(--income-border)' },
            { label:'지출', v:stats.totalExpense, c:'var(--expense)', bg:'var(--expense-soft)', bd:'var(--expense-border)' },
            { label:'잔액', v:stats.balance, c:stats.balance>=0?'#b8acff':'var(--expense)', bg:'var(--primary-glow)', bd:'rgba(124,111,224,0.2)' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-3 sm:p-4 hover-card" style={{ background:c.bg, border:`1px solid ${c.bd}` }}>
              <p className="text-[10px] sm:text-[12px] font-semibold" style={{ color:'var(--text-3)' }}>{c.label}</p>
              <p className="text-[13px] sm:text-[15px] font-bold mt-1 truncate" style={{ color:c.c }}>{formatCurrency(c.v)}</p>
            </div>
          ))}
        </div>
      )}

      {/* 검색 */}
      <div className="space-y-2 fade-up">
        <div className="flex items-center gap-2 px-3.5 rounded-xl" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', height:40 }}>
          <Search size={13} style={{ color:'var(--text-3)', flexShrink:0 }}/>
          <input type="text" placeholder="내역, 카테고리 검색..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[13px]"
            style={{ background:'transparent', color:'var(--text-1)', border:'none', outline:'none' }} />
        </div>
        {/* 필터 - 가로 스크롤 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
          <SlidersHorizontal size={12} style={{ color:'var(--text-3)', flexShrink:0 }}/>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold border whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: filter===f.key ? f.bg : 'var(--bg-card)',
                border: `1px solid ${filter===f.key ? f.bd : 'var(--border)'}`,
                color: filter===f.key ? f.c : 'var(--text-3)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
          <p className="text-[13px] font-semibold" style={{ color:'var(--text-1)' }}>
            {filter!=='all'||search ? `${filtered.length}건 필터됨` : `전체 ${transactions.length}건`}
          </p>
          <button onClick={() => openForm('income')} className="flex items-center gap-1 text-[12px] font-semibold" style={{ color:'var(--primary-light)' }}>
            <Plus size={12}/> 추가
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({length:7}).map((_,i) => <div key={i} className="h-[58px] rounded-xl animate-pulse" style={{ background:'var(--bg-elevated)' }}/>)}
            </div>
          ) : <TransactionList transactions={filtered} onDelete={deleteTransaction}/>}
        </div>
      </div>

      {showForm && <TransactionForm defaultType={formType} onSubmit={addTransaction} onClose={() => setShowForm(false)}/>}
    </div>
  )
}

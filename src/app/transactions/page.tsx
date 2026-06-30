'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Search, SlidersHorizontal } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionList from '@/components/TransactionList'
import TransactionForm from '@/components/TransactionForm'
import { Transaction } from '@/lib/supabase'

type F = 'all'|'income'|'expense'|'office'|'personal'|'fixed'
const FILTERS: {key:F;label:string;c:string;bg:string;bd:string}[] = [
  {key:'all',      label:'전체',   c:'var(--day-text1)',  bg:'var(--day-card)',      bd:'var(--day-border2)'},
  {key:'income',   label:'수입',   c:'var(--income)',     bg:'var(--income-soft)',   bd:'var(--income-border)'},
  {key:'expense',  label:'지출',   c:'var(--expense)',    bg:'var(--expense-soft)',  bd:'var(--expense-border)'},
  {key:'office',   label:'사무실', c:'var(--office)',     bg:'var(--office-soft)',   bd:'var(--office-border)'},
  {key:'personal', label:'개인',   c:'var(--personal)',   bg:'var(--personal-soft)', bd:'var(--personal-border)'},
  {key:'fixed',    label:'고정비', c:'var(--fixed)',      bg:'var(--fixed-soft)',    bd:'var(--fixed-border)'},
]

export default function TransactionsPage() {
  const {year:iy,month:im} = getCurrentYearMonth()
  const [year,setYear]    = useState(iy)
  const [month,setMonth]  = useState(im)
  const [showForm,setShowForm] = useState(false)
  const [formType,setFormType] = useState<'income'|'expense'>('income')
  const [filter,setFilter] = useState<F>('all')
  const [search,setSearch] = useState('')

  const {transactions,loading,stats,addTransaction,deleteTransaction} = useTransactions(year,month)
  const open = (t:'income'|'expense') => {setFormType(t);setShowForm(true)}

  const filtered: Transaction[] = transactions.filter(t => {
    if (filter==='income'   && t.transaction_type!=='income')  return false
    if (filter==='expense'  && t.transaction_type!=='expense') return false
    if (filter==='office'   && t.expense_type!=='office')      return false
    if (filter==='personal' && t.expense_type!=='personal')    return false
    if (filter==='fixed'    && !t.is_fixed)                    return false
    if (search) {
      const q=search.toLowerCase()
      if (![t.description,t.memo,t.income_sources?.name,t.expense_categories?.name].some(f=>f?.toLowerCase().includes(q))) return false
    }
    return true
  })

  const incBtn: React.CSSProperties = { display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:14,border:'1px solid var(--income-border)',background:'var(--income-soft)',color:'var(--income)',fontSize:14,fontWeight:700,cursor:'pointer' }
  const expBtn: React.CSSProperties = { ...incBtn, border:'1px solid var(--primary-border)',background:'var(--primary-soft)',color:'var(--primary-light)' }

  return (
    <div className="w-full px-5 py-6 sm:px-8 sm:py-8 lg:px-10 space-y-5 sm:space-y-6">

      {/* 헤더 */}
      <div className="fade-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight" style={{ color:'var(--day-text1)' }}>거래내역</h1>
            <p className="text-[14px] mt-1" style={{ color:'var(--day-text3)' }}>수입 · 지출 상세 관리</p>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
            <button style={incBtn} onClick={() => open('income')}><TrendingUp size={15}/> 수입 추가</button>
            <button style={expBtn} onClick={() => open('expense')}><TrendingDown size={15}/> 지출 추가</button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <MonthSelector year={year} month={month} onChange={(y,m)=>{setYear(y);setMonth(m)}}/>
          <div className="flex sm:hidden items-center gap-2">
            <button style={{...incBtn,padding:'8px 14px',fontSize:13}} onClick={() => open('income')}><TrendingUp size={14}/> 수입</button>
            <button style={{...expBtn,padding:'8px 14px',fontSize:13}} onClick={() => open('expense')}><TrendingDown size={14}/> 지출</button>
          </div>
        </div>
      </div>

      {/* 요약 */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 fade-up">
          {[
            {label:'총 수입', v:stats.totalIncome,  c:'var(--income)',  bg:'var(--income-soft)',  bd:'var(--income-border)'},
            {label:'총 지출', v:stats.totalExpense, c:'var(--expense)', bg:'var(--expense-soft)', bd:'var(--expense-border)'},
            {label:'잔액',    v:stats.balance, c:stats.balance>=0?'var(--primary)':'var(--expense)', bg:'var(--primary-soft)', bd:'var(--primary-border)'},
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 sm:p-5"
              style={{ background:c.bg, border:`1.5px solid ${c.bd}`, boxShadow:'var(--day-shadow)' }}>
              <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color:'var(--day-text2)' }}>{c.label}</p>
              <p className="text-[15px] sm:text-[18px] font-extrabold mt-1.5 truncate" style={{ color:c.c }}>{formatCurrency(c.v)}</p>
            </div>
          ))}
        </div>
      )}

      {/* 검색 + 필터 */}
      <div className="space-y-2.5 fade-up">
        <div className="flex items-center gap-3 px-4 rounded-2xl"
          style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', height:46, boxShadow:'var(--day-shadow)' }}>
          <Search size={16} style={{ color:'var(--day-text3)', flexShrink:0 }}/>
          <input type="text" placeholder="내역, 카테고리, 메모 검색..." value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 text-[14px] sm:text-[15px]"
            style={{ background:'transparent', color:'var(--day-text1)', border:'none', outline:'none' }}/>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
          <SlidersHorizontal size={14} style={{ color:'var(--day-text3)', flexShrink:0 }}/>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3.5 py-2 rounded-xl text-[13px] font-bold border whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: filter===f.key ? f.bg : 'var(--day-card)',
                border: `1px solid ${filter===f.key ? f.bd : 'var(--day-border)'}`,
                color: filter===f.key ? f.c : 'var(--day-text3)',
                boxShadow: filter===f.key ? 'var(--day-shadow)' : 'none',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="rounded-3xl overflow-hidden fade-up"
        style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}>
        <div className="flex items-center justify-between px-5 sm:px-7 py-4"
          style={{ borderBottom:'1px solid var(--day-border)' }}>
          <p className="text-[15px] sm:text-[16px] font-extrabold" style={{ color:'var(--day-text1)' }}>
            {filter!=='all'||search ? `${filtered.length}건 필터됨` : `전체 ${transactions.length}건`}
          </p>
          <button onClick={() => open('income')} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-bold px-3 py-2 rounded-xl"
            style={{ color:'var(--primary-light)', background:'var(--primary-soft)', border:'1px solid var(--primary-border)' }}>
            <Plus size={14}/> 추가
          </button>
        </div>
        <div className="p-5 sm:p-7">
          {loading
            ? <div className="space-y-3">{Array.from({length:7}).map((_,i) => <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ background:'var(--day-card2)'}}/>)}</div>
            : <TransactionList transactions={filtered} onDelete={deleteTransaction}/>}
        </div>
      </div>

      {showForm && <TransactionForm defaultType={formType} onSubmit={addTransaction} onClose={() => setShowForm(false)}/>}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp, AlertCircle, Lightbulb, Target,
  ChevronRight, ArrowDownRight, Printer,
} from 'lucide-react'
import { useMonthlyStats, useTransactions } from '@/hooks/useTransactions'
import { getCurrentYearMonth, getPreviousMonths, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MonthlyStats, Transaction } from '@/lib/supabase'

const MERGE_CATS = ['매입원가', '물류비']
const MERGED_LABEL = '매입원가·물류비'
const CAT_COLORS = ['#4f46e5','#059669','#dc2626','#ea580c','#2563eb','#d97706','#7c3aed','#0891b2','#db2777','#16a34a']

function coach(stats: MonthlyStats[], cur?: MonthlyStats) {
  const tips: {type:'good'|'warn'|'tip';text:string}[] = []
  if (!cur || cur.totalIncome===0) { tips.push({type:'tip',text:'이번 달 거래 내역을 입력하면 맞춤 코칭을 받을 수 있어요.'}); return tips }
  const r = cur.balance/cur.totalIncome
  if (r>=0.3)      tips.push({type:'good',text:`수익률 ${(r*100).toFixed(1)}%로 우수합니다!`})
  else if (r>=0.1) tips.push({type:'warn',text:`수익률 ${(r*100).toFixed(1)}%. 30% 이상을 목표로 지출을 줄여보세요.`})
  else if (r<0)    tips.push({type:'warn',text:'지출이 수입을 초과했습니다. 지출 구조를 점검하세요.'})
  if (cur.totalExpense>0) {
    const fr=cur.fixedExpense/cur.totalExpense
    if (fr>0.6) tips.push({type:'warn',text:`고정비가 지출의 ${(fr*100).toFixed(0)}%입니다. 절감을 검토해보세요.`})
    const pr=cur.personalExpense/cur.totalExpense
    if (pr>0.4) tips.push({type:'tip',text:`개인 지출이 ${(pr*100).toFixed(0)}%입니다. 사업비와 개인비 분리 시 절세에 유리해요.`})
  }
  if (stats.length>=3) {
    const inc=stats.slice(-3).map(s=>s.totalIncome)
    if (inc.every((v,i)=>i===0||v>=inc[i-1])) tips.push({type:'good',text:'최근 3개월 수입이 꾸준히 성장 중입니다!'})
  }
  tips.push({type:'tip',text:'수입의 20~30%를 저축/비상금으로 매달 적립하는 습관을 권장합니다.'})
  return tips
}

function predict(stats: MonthlyStats[]) {
  if (!stats.length) return {income:0,expense:0,balance:0}
  const r=stats.slice(-3)
  const ai=r.reduce((s,m)=>s+m.totalIncome,0)/r.length
  const ae=r.reduce((s,m)=>s+m.totalExpense,0)/r.length
  if (r.length>=2) {
    const gi=(r[r.length-1].totalIncome-r[0].totalIncome)/(r.length-1)
    const ge=(r[r.length-1].totalExpense-r[0].totalExpense)/(r.length-1)
    const pi=Math.max(0,ai+gi*0.5),pe=Math.max(0,ae+ge*0.5)
    return {income:Math.round(pi),expense:Math.round(pe),balance:Math.round(pi-pe)}
  }
  return {income:Math.round(ai),expense:Math.round(ae),balance:Math.round(ai-ae)}
}

/* ── 카테고리별 지출 집계 ── */
function toCatMap(txs: Transaction[]): Record<string, number> {
  const m: Record<string, number> = {}
  txs.filter(t => t.transaction_type === 'expense').forEach(t => {
    const raw = t.expense_categories?.name || '기타'
    const name = MERGE_CATS.includes(raw) ? MERGED_LABEL : raw
    m[name] = (m[name] || 0) + t.amount
  })
  return m
}

/* ── 내역 그룹화 ── */
function groupByDesc(txs: Transaction[]) {
  const map: Record<string, number> = {}
  txs.forEach(t => {
    const d = t.description || '—'
    map[d] = (map[d] || 0) + t.amount
  })
  return Object.entries(map).map(([desc, amount]) => ({ desc, amount })).sort((a, b) => b.amount - a.amount)
}

/* ══════════════════════════════
   월별 리포트
══════════════════════════════ */
function MonthlyReport({ year, month, allStats }: {
  year: number; month: number; allStats: MonthlyStats[]
}) {
  const { transactions, loading } = useTransactions(year, month)
  const prevM = month === 1 ? 12 : month - 1
  const prevY = month === 1 ? year - 1 : year
  const { transactions: prevTxs } = useTransactions(prevY, prevM)

  const income  = transactions.filter(t => t.transaction_type === 'income')
  const expense = transactions.filter(t => t.transaction_type === 'expense')

  const totalIncome   = income.reduce((s, t) => s + t.amount, 0)
  const totalExpense  = expense.reduce((s, t) => s + t.amount, 0)
  const net           = totalIncome - totalExpense
  const profitRate    = totalIncome > 0 ? (net / totalIncome) * 100 : 0
  const officeExp     = expense.filter(t => t.expense_type === 'office').reduce((s, t) => s + t.amount, 0)
  const personalExp   = expense.filter(t => t.expense_type === 'personal').reduce((s, t) => s + t.amount, 0)
  const fixedExp      = expense.filter(t => t.is_fixed).reduce((s, t) => s + t.amount, 0)
  const varExp        = expense.filter(t => !t.is_fixed).reduce((s, t) => s + t.amount, 0)

  const prevIncome  = prevTxs.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevExpense = prevTxs.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevNet     = prevIncome - prevExpense

  const incomeGroups = Object.entries(
    income.reduce((acc, t) => {
      const src = t.income_sources?.name || '기타'
      if (!acc[src]) acc[src] = { total: 0, txs: [] }
      acc[src].total += t.amount
      acc[src].txs.push(t)
      return acc
    }, {} as Record<string, { total: number; txs: Transaction[] }>)
  ).map(([name, d]) => ({ name, total: d.total, items: groupByDesc(d.txs) })).sort((a, b) => b.total - a.total)

  const expenseGroups = Object.entries(
    expense.reduce((acc, t) => {
      const raw = t.expense_categories?.name || '기타'
      const catName = MERGE_CATS.includes(raw) ? MERGED_LABEL : raw
      if (!acc[catName]) acc[catName] = { total: 0, txs: [] }
      acc[catName].total += t.amount
      acc[catName].txs.push(t)
      return acc
    }, {} as Record<string, { total: number; txs: Transaction[] }>)
  ).map(([name, d]) => ({ name, total: d.total, items: groupByDesc(d.txs) })).sort((a, b) => b.total - a.total)

  const relevantStats = allStats.filter(s => s.year < year || (s.year === year && s.month <= month))
  const pred = predict(relevantStats.length > 0 ? relevantStats : allStats)
  const nextM = month === 12 ? 1 : month + 1
  const nextY = month === 12 ? year + 1 : year

  const diff = (cur: number, prev: number) => {
    const d = cur - prev
    const pct = prev > 0 ? (d / prev * 100) : 0
    return { d, str: `${d >= 0 ? '+' : ''}${formatCurrency(Math.abs(d))} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`, pos: d >= 0 }
  }

  const thStyle: React.CSSProperties = { padding:'8px 14px', fontWeight:800, fontSize:11, color:'#6b7280', background:'#f9fafb', borderBottom:'1px solid #e4e9f5' }
  const tdStyle: React.CSSProperties = { padding:'9px 14px', fontSize:12, borderBottom:'1px solid #f3f4f6' }

  if (loading) return <div style={{ padding:32, textAlign:'center', color:'#9ca3af', fontSize:13 }}>리포트 로딩 중...</div>

  return (
    <div id="monthly-report" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="report-print-header" style={{ justifyContent:'space-between', alignItems:'flex-end', borderBottom:'2px solid #111827', paddingBottom:12, marginBottom:4 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#111827' }}>월별 재무 리포트</h1>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{year}년 {month}월</p>
        </div>
        <p style={{ fontSize:11, color:'#9ca3af' }}>출력일: {new Date().toLocaleDateString('ko-KR')}</p>
      </div>

      {/* 요약 */}
      <div style={{ background:'#fff', border:'1px solid #e4e9f5', boxShadow:'0 1px 3px rgba(17,24,39,0.06)', padding:'20px 22px' }}>
        <p style={{ fontSize:13, fontWeight:800, color:'#374151', marginBottom:14, borderBottom:'2px solid #4f46e5', paddingBottom:6 }}>요약</p>
        <div className="report-summary-grid">
          {[
            { label:'총 수입', value:totalIncome, color:'#059669', bg:'#f0fdf4', bd:'#a7f3d0' },
            { label:'총 지출', value:totalExpense, color:'#dc2626', bg:'#fef2f2', bd:'#fca5a5' },
            { label:'순수익', value:net, color:net>=0?'#4f46e5':'#dc2626', bg:net>=0?'#f5f3ff':'#fef2f2', bd:net>=0?'#c7c3fa':'#fca5a5' },
            { label:'수익률', value:null, str:`${profitRate.toFixed(1)}%`, color:profitRate>=0?'#059669':'#dc2626', bg:'#f9fafb', bd:'#e5e7eb' },
          ].map(c => (
            <div key={c.label} style={{ padding:'14px 16px', background:c.bg, border:`1px solid ${c.bd}` }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>{c.label}</p>
              <p style={{ fontSize:20, fontWeight:800, color:c.color, marginTop:4 }}>{c.value!==null?`${formatCurrency(c.value)}원`:c.str}</p>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:8 }}>
          {[
            { label:'사무실 지출', value:officeExp, color:'#2563eb' },
            { label:'개인 지출',   value:personalExp, color:'#ea580c' },
            { label:'고정비',      value:fixedExp, color:'#6b7280' },
            { label:'변동비',      value:varExp, color:'#4f46e5' },
          ].map(c => (
            <div key={c.label} style={{ padding:'10px 12px', background:'#f9fafb', border:'1px solid #e5e7eb' }}>
              <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af' }}>{c.label}</p>
              <p style={{ fontSize:13, fontWeight:800, color:c.color, marginTop:2 }}>{formatCurrency(c.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 수입 + 상세 지출 */}
      <div className="report-detail-grid">
        <div style={{ background:'#fff', border:'1px solid #e4e9f5', boxShadow:'0 1px 3px rgba(17,24,39,0.06)', padding:'20px 22px' }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#374151', marginBottom:14, borderBottom:'2px solid #059669', paddingBottom:6 }}>상세 수입 내역</p>
          {incomeGroups.length===0 ? <p style={{ fontSize:12, color:'#9ca3af' }}>수입 내역 없음</p> : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {incomeGroups.map(src => (
                <div key={src.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, padding:'6px 10px', background:'#f0fdf4', border:'1px solid #a7f3d0' }}>
                    <span style={{ fontSize:12, fontWeight:800, color:'#374151' }}>{src.name}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:'#059669' }}>{formatCurrency(src.total)}원</span>
                  </div>
                  {src.items.map(item => (
                    <div key={item.desc} style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px 5px 20px', borderBottom:'1px solid #f9fafb' }}>
                      <span style={{ fontSize:11, color:'#6b7280' }}>└ {item.desc}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#059669' }}>{formatCurrency(item.amount)}원</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ borderTop:'2px solid #e4e9f5', paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, fontWeight:800, color:'#111827' }}>합계</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#059669' }}>{formatCurrency(totalIncome)}원</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ background:'#fff', border:'1px solid #e4e9f5', boxShadow:'0 1px 3px rgba(17,24,39,0.06)', padding:'20px 22px' }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#374151', marginBottom:14, borderBottom:'2px solid #dc2626', paddingBottom:6 }}>상세 지출 내역</p>
          {expenseGroups.length===0 ? <p style={{ fontSize:12, color:'#9ca3af' }}>지출 내역 없음</p> : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {expenseGroups.map(cat => (
                <div key={cat.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, padding:'6px 10px', background:'#fef2f2', border:'1px solid #fca5a5' }}>
                    <span style={{ fontSize:12, fontWeight:800, color:'#374151' }}>{cat.name}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:'#dc2626' }}>{formatCurrency(cat.total)}원</span>
                  </div>
                  {cat.items.map(item => (
                    <div key={item.desc} style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px 5px 20px', borderBottom:'1px solid #f9fafb' }}>
                      <span style={{ fontSize:11, color:'#6b7280' }}>└ {item.desc}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#dc2626' }}>{formatCurrency(item.amount)}원</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ borderTop:'2px solid #e4e9f5', paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, fontWeight:800, color:'#111827' }}>합계</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#dc2626' }}>{formatCurrency(totalExpense)}원</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 전월 비교 */}
      <div style={{ background:'#fff', border:'1px solid #e4e9f5', boxShadow:'0 1px 3px rgba(17,24,39,0.06)', padding:'20px 22px' }}>
        <p style={{ fontSize:13, fontWeight:800, color:'#374151', marginBottom:14, borderBottom:'2px solid #2563eb', paddingBottom:6 }}>
          전월 비교 <span style={{ fontWeight:600, color:'#9ca3af', fontSize:11 }}>({prevY}년 {prevM}월 대비)</span>
        </p>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['항목','전월','이번 달','증감'].map((h,i) => <th key={h} style={{ ...thStyle, textAlign:i===0?'left':'right' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { label:'수입', prev:prevIncome, cur:totalIncome, color:'#059669' },
              { label:'지출', prev:prevExpense, cur:totalExpense, color:'#dc2626' },
              { label:'순수익', prev:prevNet, cur:net, color:net>=0?'#4f46e5':'#dc2626' },
            ].map(row => {
              const d = diff(row.cur, row.prev)
              return (
                <tr key={row.label}>
                  <td style={{ ...tdStyle, fontWeight:800, color:'#374151' }}>{row.label}</td>
                  <td style={{ ...tdStyle, textAlign:'right', color:'#9ca3af' }}>{formatCurrency(row.prev)}원</td>
                  <td style={{ ...tdStyle, textAlign:'right', fontWeight:800, color:row.color }}>{formatCurrency(row.cur)}원</td>
                  <td style={{ ...tdStyle, textAlign:'right', fontWeight:800, color:d.pos?'#059669':'#dc2626' }}>{d.str}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 다음달 예측 */}
      <div style={{ background:'linear-gradient(120deg,#f5f3ff,#eff6ff)', border:'1px solid #c7c3fa', padding:'20px 22px' }}>
        <p style={{ fontSize:13, fontWeight:800, color:'#374151', marginBottom:14, borderBottom:'2px solid #7c3aed', paddingBottom:6 }}>
          {nextY}년 {nextM}월 예측
          <span style={{ fontWeight:600, color:'#9ca3af', fontSize:11, marginLeft:8 }}>최근 {Math.min(3,allStats.length)}개월 추세 기반</span>
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { label:'예상 수입', value:pred.income, color:'#059669', bg:'#f0fdf4', bd:'#a7f3d0' },
            { label:'예상 지출', value:pred.expense, color:'#dc2626', bg:'#fef2f2', bd:'#fca5a5' },
            { label:'예상 순수익', value:pred.balance, color:pred.balance>=0?'#4f46e5':'#dc2626', bg:pred.balance>=0?'#f5f3ff':'#fef2f2', bd:pred.balance>=0?'#c7c3fa':'#fca5a5' },
          ].map(c => (
            <div key={c.label} style={{ padding:16, background:c.bg, border:`1px solid ${c.bd}` }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>{c.label}</p>
              <p style={{ fontSize:18, fontWeight:800, color:c.color, marginTop:6 }}>{formatCurrency(c.value)}원</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════
   분석/비교 메인 페이지
══════════════════════════════ */
export default function AnalysisPage() {
  const { year, month } = getCurrentYearMonth()
  const [n, setN] = useState(6)
  const months = useMemo(() => getPreviousMonths(year, month, n), [year, month, n])
  const { stats, loading } = useMonthlyStats(months)

  // 리포트 월 선택
  const [reportYear,  setReportYear]  = useState(year)
  const [reportMonth, setReportMonth] = useState(month)

  // 지출 예상 분석표용 데이터
  const prevM = month === 1 ? 12 : month - 1
  const prevY = month === 1 ? year - 1 : year
  const { transactions: curTxs,  loading: curLoading  } = useTransactions(year,  month)
  const { transactions: prevTxs, loading: prevLoading } = useTransactions(prevY, prevM)
  const [targets, setTargets] = useState<Record<string, number>>({})

  const prevCatMap = useMemo(() => toCatMap(prevTxs), [prevTxs])
  const curCatMap  = useMemo(() => toCatMap(curTxs),  [curTxs])
  const allForecastCats = useMemo(() => {
    const s = new Set([...Object.keys(prevCatMap), ...Object.keys(curCatMap)])
    return Array.from(s).sort((a, b) => (prevCatMap[b] || 0) - (prevCatMap[a] || 0))
  }, [prevCatMap, curCatMap])

  const getTarget = (cat: string) => targets[cat] !== undefined ? targets[cat] : (prevCatMap[cat] || 0)

  const cur  = stats[stats.length-1]
  const pred = predict(stats)
  const tips = coach(stats, cur)
  const nm   = month===12?1:month+1
  const ny   = month===12?year+1:year

  const monthOptions = Array.from({ length:13 }, (_, i) => {
    const d = new Date(year, month-1-i, 1)
    return { year: d.getFullYear(), month: d.getMonth()+1 }
  })

  /* ── 합계 계산 ── */
  const totalPrev   = Object.values(prevCatMap).reduce((s,v)=>s+v,0)
  const totalTarget = allForecastCats.reduce((s,c)=>s+getTarget(c),0)
  const totalCur    = Object.values(curCatMap).reduce((s,v)=>s+v,0)
  const totalPct    = totalTarget > 0 ? (totalCur / totalTarget) * 100 : 0

  /* ── 공통 스타일 ── */
  const thS: React.CSSProperties = {
    padding:'10px 14px', textAlign:'right', fontSize:12, fontWeight:700,
    color:'var(--day-text3)', background:'var(--day-card2)',
    borderBottom:'2px solid var(--day-border)',
  }

  return (
    <div className="page-wrap space-y-5 sm:space-y-6">

      {/* ══ 기존 분석 영역 (인쇄 시 숨김) ══ */}
      <div className="no-print">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up">
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight" style={{ color:'var(--day-text1)' }}>분석 / 비교</h1>
            <p className="text-[14px] mt-1" style={{ color:'var(--day-text3)' }}>월별 수입·지출 추이 분석</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ color:'var(--day-text3)' }}>기간</span>
            {[3,6,12].map(v => (
              <button key={v} onClick={()=>setN(v)}
                className="px-4 py-2 rounded-xl text-[13px] sm:text-[14px] font-bold border transition-all"
                style={{
                  background: n===v?'var(--primary-soft)':'var(--day-card)',
                  border: `1px solid ${n===v?'var(--primary-border)':'var(--day-border)'}`,
                  color: n===v?'var(--primary)':'var(--day-text3)',
                  boxShadow: n===v?'var(--day-shadow)':'none',
                }}>
                {v}개월
              </button>
            ))}
          </div>
        </div>

        {/* ══ 지출 예상 분석표 ══ */}
        <div className="fade-up" style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', borderRadius:16, boxShadow:'var(--day-shadow)' }}>
          {/* 헤더 */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--day-border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div>
              <p style={{ fontSize:16, fontWeight:800, color:'var(--day-text1)' }}>지출 예상 분석표</p>
              <p style={{ fontSize:12, color:'var(--day-text3)', marginTop:2 }}>
                {prevY}년 {prevM}월 실적 기준 → {year}년 {month}월 목표 관리
              </p>
            </div>
            <span style={{
              fontSize:11, color:'var(--day-text3)', background:'var(--day-card2)',
              padding:'5px 12px', borderRadius:8, border:'1px solid var(--day-border)',
            }}>
              목표 금액을 클릭하여 수정 가능
            </span>
          </div>

          {curLoading || prevLoading ? (
            <div style={{ padding:24 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:44, marginBottom:8, borderRadius:6 }} />)}
            </div>
          ) : allForecastCats.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--day-text3)', fontSize:13 }}>
              지출 내역이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
                <thead>
                  <tr>
                    <th style={{ ...thS, textAlign:'left', width:'22%' }}>카테고리</th>
                    <th style={{ ...thS, width:'20%' }}>전월({prevM}월) 실적</th>
                    <th style={{ ...thS, width:'22%' }}>예상 목표 (수정가능)</th>
                    <th style={{ ...thS, width:'20%' }}>{month}월 현재</th>
                    <th style={{ ...thS, textAlign:'left', width:'16%' }}>달성률</th>
                  </tr>
                </thead>
                <tbody>
                  {allForecastCats.map((cat, i) => {
                    const prev   = prevCatMap[cat] || 0
                    const target = getTarget(cat)
                    const cur2   = curCatMap[cat]  || 0
                    const pct    = target > 0 ? (cur2 / target) * 100 : (cur2 > 0 ? 999 : 0)
                    const barColor = pct < 80 ? '#10b981' : pct <= 100 ? '#f59e0b' : '#dc2626'
                    const barW   = Math.min(pct, 100)
                    const isOver = pct > 100

                    return (
                      <tr key={cat} style={{ borderBottom:'1px solid var(--day-border)', background: i%2===0?'transparent':'var(--day-card2)' }}>
                        {/* 카테고리 */}
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:8, height:8, background:CAT_COLORS[i%CAT_COLORS.length], flexShrink:0 }} />
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--day-text1)' }}>{cat}</span>
                          </div>
                        </td>
                        {/* 전월 */}
                        <td style={{ padding:'12px 16px', textAlign:'right', fontSize:13, color:'var(--day-text3)' }}>
                          {prev > 0 ? `${formatCurrency(prev)}` : '—'}
                        </td>
                        {/* 목표 (편집 가능) */}
                        <td style={{ padding:'8px 12px', textAlign:'right' }}>
                          <input
                            type="number"
                            value={targets[cat] !== undefined ? targets[cat] : prev}
                            min={0}
                            onChange={e => setTargets(t => ({ ...t, [cat]: Math.max(0, Number(e.target.value)||0) }))}
                            style={{
                              width:'100%', textAlign:'right', fontSize:13, fontWeight:700,
                              padding:'7px 10px', border:'1.5px solid var(--day-border)',
                              borderRadius:8, background:'var(--day-card)', color:'var(--primary)',
                              outline:'none', appearance:'textfield',
                            }}
                            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                            onBlur={e  => (e.target.style.borderColor = 'var(--day-border)')}
                          />
                        </td>
                        {/* 현재 */}
                        <td style={{ padding:'12px 16px', textAlign:'right', fontSize:13, fontWeight:700, color: isOver ? '#dc2626' : 'var(--day-text1)' }}>
                          {cur2 > 0 ? formatCurrency(cur2) : '—'}
                          {isOver && <span style={{ fontSize:10, color:'#dc2626', marginLeft:4 }}>초과</span>}
                        </td>
                        {/* 달성률 */}
                        <td style={{ padding:'12px 16px' }}>
                          {target > 0 || cur2 > 0 ? (
                            <div>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                                <span style={{ fontSize:12, fontWeight:800, color:barColor }}>
                                  {pct >= 999 ? '—' : `${Math.round(pct)}%`}
                                </span>
                                {isOver && (
                                  <span style={{ fontSize:10, background:'#fef2f2', color:'#dc2626', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>초과</span>
                                )}
                              </div>
                              <div style={{ height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                                <div style={{ height:'100%', width:`${barW}%`, background:barColor, borderRadius:3, transition:'width 0.4s ease' }} />
                              </div>
                            </div>
                          ) : <span style={{ color:'var(--day-text3)', fontSize:12 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* 합계 */}
                <tfoot>
                  <tr style={{ background:'var(--primary-soft)', borderTop:'2px solid var(--primary-border)' }}>
                    <td style={{ padding:'12px 16px', fontSize:13, fontWeight:800, color:'var(--day-text1)' }}>합계</td>
                    <td style={{ padding:'12px 16px', textAlign:'right', fontSize:13, fontWeight:800, color:'var(--day-text3)' }}>
                      {formatCurrency(totalPrev)}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'right', fontSize:13, fontWeight:800, color:'var(--primary)' }}>
                      {formatCurrency(totalTarget)}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'right', fontSize:13, fontWeight:800, color: totalCur > totalTarget ? '#dc2626' : 'var(--day-text1)' }}>
                      {formatCurrency(totalCur)}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:13, fontWeight:800, color: totalPct<80?'#10b981':totalPct<=100?'#f59e0b':'#dc2626' }}>
                        {Math.round(totalPct)}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ══ 코칭·예측·비교표 ══ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({length:2}).map((_,i)=><div key={i} className="skeleton" style={{ height:200, borderRadius:16 }}/>)}
          </div>
        ) : (
          <>
            {/* 예측 */}
            <div className="fade-up" style={{ background:'linear-gradient(120deg,#f5f3ff,#eff6ff)', border:'1px solid #c7c3fa', borderRadius:16, boxShadow:'var(--day-shadow)', padding:'20px 24px' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background:'var(--primary-soft)', border:'1px solid var(--primary-border)' }}>
                  <Target size={18} style={{ color:'var(--primary)' }}/>
                </div>
                <div>
                  <p className="text-[16px] sm:text-[17px] font-extrabold" style={{ color:'var(--day-text1)' }}>{ny}년 {nm}월 예측</p>
                  <p className="text-[12px] sm:text-[13px]" style={{ color:'var(--day-text3)' }}>최근 {Math.min(3,stats.length)}개월 추세 기반</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  {l:'예상 수입',v:pred.income, c:'var(--income)',  bg:'var(--income-soft)', bd:'var(--income-border)'},
                  {l:'예상 지출',v:pred.expense,c:'var(--expense)', bg:'var(--expense-soft)',bd:'var(--expense-border)'},
                  {l:'예상 잔액',v:pred.balance,c:pred.balance>=0?'var(--primary)':'var(--expense)',bg:'var(--primary-soft)',bd:'var(--primary-border)'},
                ].map(c=>(
                  <div key={c.l} className="rounded-2xl p-4 sm:p-5" style={{ background:c.bg, border:`1.5px solid ${c.bd}` }}>
                    <p className="text-[12px] sm:text-[13px] font-semibold" style={{ color:'var(--day-text3)' }}>{c.l}</p>
                    <p className="text-[15px] sm:text-[18px] font-extrabold mt-1.5 truncate" style={{ color:c.c }}>{formatCurrency(c.v)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 코칭 */}
            <div className="fade-up" style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', borderRadius:16, boxShadow:'var(--day-shadow)', padding:'20px 24px' }}>
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
                  <Lightbulb size={18} style={{ color:'#d97706' }}/>
                </div>
                <p className="text-[16px] sm:text-[17px] font-extrabold" style={{ color:'var(--day-text1)' }}>재무 코칭</p>
              </div>
              <div className="space-y-2.5">
                {tips.map((t,i)=>(
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{
                      background: t.type==='good'?'#f0fdf4':t.type==='warn'?'#fffbeb':'var(--day-card2)',
                      border:`1px solid ${t.type==='good'?'var(--income-border)':t.type==='warn'?'rgba(245,158,11,0.22)':'var(--day-border)'}`,
                    }}>
                    {t.type==='good'?<TrendingUp size={16} style={{ color:'var(--income)',flexShrink:0,marginTop:2}}/>
                     :t.type==='warn'?<AlertCircle size={16} style={{ color:'#d97706',flexShrink:0,marginTop:2}}/>
                     :<ChevronRight size={16} style={{ color:'var(--primary)',flexShrink:0,marginTop:2}}/>}
                    <p className="text-[13px] sm:text-[14px] leading-relaxed"
                      style={{ color:t.type==='good'?'#065f46':t.type==='warn'?'#92400e':'var(--day-text2)' }}>
                      {t.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 월별 상세 비교표 */}
            <div className="fade-up overflow-hidden"
              style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', borderRadius:16, boxShadow:'var(--day-shadow)' }}>
              <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--day-border)' }}>
                <p style={{ fontSize:15, fontWeight:800, color:'var(--day-text1)' }}>월별 상세 비교</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--day-border)', background:'var(--day-card2)' }}>
                      {['기간','수입','지출','잔액','수익률','고정비'].map(h=>(
                        <th key={h} className={cn('py-3.5 text-[12px] font-bold', h==='기간'?'text-left px-6':'text-right px-4')}
                          style={{ color:'var(--day-text3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats].reverse().map((s,i)=>(
                      <tr key={i} style={{ borderBottom:i<stats.length-1?'1px solid var(--day-border)':'none', background:i===0?'#f5f3ff':'transparent' }}>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--day-text1)' }}>{s.year}년 {s.month}월</span>
                            {i===0&&<span style={{ fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:5, background:'#eef0fe', color:'#4f46e5' }}>이번달</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right" style={{ fontSize:13, fontWeight:700, color:'#059669' }}>{formatCurrency(s.totalIncome)}</td>
                        <td className="px-4 py-3.5 text-right" style={{ fontSize:13, fontWeight:700, color:'#dc2626' }}>{formatCurrency(s.totalExpense)}</td>
                        <td className="px-4 py-3.5 text-right" style={{ fontSize:13, fontWeight:800, color:s.balance>=0?'#4f46e5':'#dc2626' }}>{formatCurrency(s.balance)}</td>
                        <td className="px-4 py-3.5 text-right" style={{ fontSize:12, fontWeight:700 }}>
                          {s.totalIncome>0
                            ?<span className="flex items-center justify-end gap-0.5" style={{ color:s.balance>=0?'#059669':'#dc2626' }}>
                              {s.balance<0&&<ArrowDownRight size={12}/>}{((s.balance/s.totalIncome)*100).toFixed(1)}%
                            </span>
                            :<span style={{ color:'var(--day-text3)' }}>—</span>}
                        </td>
                        <td className="px-6 py-3.5 text-right" style={{ fontSize:13, color:'var(--day-text2)' }}>{formatCurrency(s.fixedExpense)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ 월별 리포트 섹션 ══ */}
      <div>
        {/* 리포트 헤더 (화면에서만) */}
        <div className="no-print fade-up" style={{
          background:'var(--day-card)', border:'1px solid var(--day-border)',
          borderRadius:16, boxShadow:'var(--day-shadow)', padding:'20px 24px', marginBottom:16,
        }}>
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Printer size={18} style={{ color:'#7c3aed' }} />
              </div>
              <div>
                <p style={{ fontSize:16, fontWeight:800, color:'var(--day-text1)' }}>월별 리포트</p>
                <p style={{ fontSize:12, color:'var(--day-text3)', marginTop:1 }}>상세 수입·지출 내역 및 전월 비교</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <select
                value={`${reportYear}-${reportMonth}`}
                onChange={e => {
                  const [y,m] = e.target.value.split('-').map(Number)
                  setReportYear(y); setReportMonth(m)
                }}
                style={{ padding:'8px 14px', fontSize:13, fontWeight:700, border:'1px solid var(--day-border)', borderRadius:10, background:'var(--day-card)', color:'var(--day-text1)', cursor:'pointer' }}
              >
                {monthOptions.map(o => (
                  <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
                    {o.year}년 {o.month}월
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'8px 18px', fontSize:13, fontWeight:800,
                  background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                  color:'#fff', border:'none', borderRadius:10, cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(79,70,229,0.25)',
                }}
              >
                <Printer size={14} />출력
              </button>
            </div>
          </div>
        </div>

        <MonthlyReport year={reportYear} month={reportMonth} allStats={stats} />
      </div>
    </div>
  )
}

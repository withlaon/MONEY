'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, AlertCircle, Lightbulb, Target, ChevronRight, ArrowDownRight } from 'lucide-react'
import { useMonthlyStats } from '@/hooks/useTransactions'
import { getCurrentYearMonth, getPreviousMonths, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

const PIE_C = ['#7c6fe0','#10b981','#f43f5e','#3b82f6','#f97316','#ec4899']

function coaching(stats: MonthlyStats[], cur?: MonthlyStats) {
  const tips: {type:'good'|'warn'|'tip'; text:string}[] = []
  if (!cur || cur.totalIncome === 0) {
    tips.push({type:'tip', text:'이번 달 거래 내역을 입력하면 맞춤 코칭을 받을 수 있어요.'})
    return tips
  }
  const r = cur.balance / cur.totalIncome
  if (r >= 0.3)     tips.push({type:'good', text:`수익률 ${(r*100).toFixed(1)}%로 우수합니다!`})
  else if (r >= 0.1)tips.push({type:'warn', text:`수익률 ${(r*100).toFixed(1)}%. 30% 이상을 목표로 해보세요.`})
  else if (r < 0)   tips.push({type:'warn', text:'지출이 수입을 초과했습니다. 지출 구조를 점검하세요.'})
  if (cur.totalExpense > 0) {
    const fr = cur.fixedExpense / cur.totalExpense
    if (fr > 0.6) tips.push({type:'warn', text:`고정비가 지출의 ${(fr*100).toFixed(0)}%입니다. 절감을 검토해보세요.`})
    const pr = cur.personalExpense / cur.totalExpense
    if (pr > 0.4) tips.push({type:'tip', text:`개인 지출이 ${(pr*100).toFixed(0)}%입니다. 사업비와 개인비 분리 시 절세에 유리해요.`})
  }
  if (stats.length >= 3) {
    const inc = stats.slice(-3).map(s => s.totalIncome)
    if (inc.every((v,i) => i===0 || v >= inc[i-1]))
      tips.push({type:'good', text:'최근 3개월 수입이 꾸준히 성장 중입니다!'})
  }
  tips.push({type:'tip', text:'수입의 20~30%를 저축/비상금으로 적립하는 습관을 권장합니다.'})
  return tips
}

function predict(stats: MonthlyStats[]) {
  if (!stats.length) return {income:0,expense:0,balance:0}
  const r = stats.slice(-3)
  const ai = r.reduce((s,m) => s+m.totalIncome, 0) / r.length
  const ae = r.reduce((s,m) => s+m.totalExpense, 0) / r.length
  if (r.length >= 2) {
    const gi = (r[r.length-1].totalIncome  - r[0].totalIncome)  / (r.length-1)
    const ge = (r[r.length-1].totalExpense - r[0].totalExpense) / (r.length-1)
    const pi = Math.max(0, ai + gi*0.5), pe = Math.max(0, ae + ge*0.5)
    return {income:Math.round(pi), expense:Math.round(pe), balance:Math.round(pi-pe)}
  }
  return {income:Math.round(ai), expense:Math.round(ae), balance:Math.round(ai-ae)}
}

const Tip = ({active,payload,label}: {active?:boolean;payload?:Array<{name:string;value:number;color:string}>;label?:string}) => {
  if (!active||!payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-[11px] sm:text-[12px] shadow-xl" style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-mid)' }}>
      <p className="font-semibold mb-1.5" style={{ color:'var(--text-3)' }}>{label}</p>
      {payload.map((e,i) => <p key={i} className="font-semibold" style={{ color:e.color }}>{e.name}: {formatCurrency(e.value)}</p>)}
    </div>
  )
}

export default function AnalysisPage() {
  const { year, month } = getCurrentYearMonth()
  const [n, setN] = useState(6)
  const months = useMemo(() => getPreviousMonths(year, month, n), [year, month, n])
  const { stats, loading } = useMonthlyStats(months)

  const cur  = stats[stats.length-1]
  const pred = predict(stats)
  const tips = coaching(stats, cur)
  const nm   = month===12 ? 1 : month+1
  const ny   = month===12 ? year+1 : year

  const data = stats.map(s => ({
    name:`${s.month}월`, 수입:s.totalIncome, 지출:s.totalExpense,
    잔액:s.balance, 사무실:s.officeExpense, 개인:s.personalExpense,
  }))

  const pieData   = cur ? [{name:'사무실',value:cur.officeExpense},{name:'개인',value:cur.personalExpense}].filter(d=>d.value>0) : []
  const fixedData = cur ? [{name:'고정비',value:cur.fixedExpense},{name:'변동비',value:cur.variableExpense}].filter(d=>d.value>0) : []

  const ax = {fill:'var(--text-3)', fontSize:10}
  const grid = {stroke:'var(--border)', strokeDasharray:'4 4'}

  const yFmt = (v: number) => v>=1000000 ? `${(v/1000000).toFixed(0)}M` : v>=1000 ? `${(v/1000).toFixed(0)}K` : `${v}`

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 max-w-[1280px] mx-auto space-y-4 sm:space-y-5">

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-up">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight" style={{ color:'var(--text-1)' }}>분석 / 비교</h1>
          <p className="text-[12px] sm:text-[13px] mt-0.5" style={{ color:'var(--text-3)' }}>월별 수입·지출 추이 분석</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] sm:text-[12px]" style={{ color:'var(--text-3)' }}>기간</span>
          {[3,6,12].map(v => (
            <button key={v} onClick={() => setN(v)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold border transition-all"
              style={{
                background: n===v ? 'var(--primary-glow)' : 'var(--bg-card)',
                border: `1px solid ${n===v ? 'rgba(124,111,224,0.3)' : 'var(--border)'}`,
                color: n===v ? 'var(--primary-light)' : 'var(--text-3)',
              }}>
              {v}개월
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({length:4}).map((_,i) => <div key={i} className="h-52 sm:h-64 rounded-2xl animate-pulse" style={{ background:'var(--bg-card)' }}/>)}
        </div>
      ) : (
        <>
          {/* 수입/지출 막대 */}
          <div className="rounded-2xl p-4 sm:p-5 fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <p className="text-[13px] sm:text-[14px] font-semibold mb-3 sm:mb-4" style={{ color:'var(--text-1)' }}>월별 수입 · 지출</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} barGap={3} barCategoryGap="30%">
                <CartesianGrid vertical={false} {...grid}/>
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={yFmt} width={36}/>
                <Tooltip content={<Tip/>}/>
                <Legend wrapperStyle={{fontSize:'11px', color:'var(--text-3)'}}/>
                <Bar dataKey="수입" fill="var(--income)"  radius={[4,4,0,0]} opacity={0.85}/>
                <Bar dataKey="지출" fill="var(--expense)" radius={[4,4,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 잔액 추이 */}
          <div className="rounded-2xl p-4 sm:p-5 fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <p className="text-[13px] sm:text-[14px] font-semibold mb-3 sm:mb-4" style={{ color:'var(--text-1)' }}>순수익 추이</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data}>
                <CartesianGrid vertical={false} {...grid}/>
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={yFmt} width={36}/>
                <Tooltip content={<Tip/>}/>
                <Line type="monotone" dataKey="잔액" stroke="var(--primary-light)" strokeWidth={2.5}
                  dot={{fill:'var(--primary-light)',r:3,strokeWidth:0}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 파이 2개 */}
          {(pieData.length > 0 || fixedData.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {pieData.length > 0 && (
                <div className="rounded-2xl p-4 sm:p-5 fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <p className="text-[13px] sm:text-[14px] font-semibold mb-3" style={{ color:'var(--text-1)' }}>{year}년 {month}월 지출 구성</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        {pieData.map((_,i) => <Cell key={i} fill={PIE_C[i]} opacity={0.88}/>)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))}/>
                      <Legend wrapperStyle={{fontSize:'11px', color:'var(--text-3)'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {fixedData.length > 0 && (
                <div className="rounded-2xl p-4 sm:p-5 fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <p className="text-[13px] sm:text-[14px] font-semibold mb-3" style={{ color:'var(--text-1)' }}>{year}년 {month}월 고정비 · 변동비</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={fixedData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        <Cell fill="var(--primary)" opacity={0.88}/>
                        <Cell fill="#f59e0b" opacity={0.88}/>
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))}/>
                      <Legend wrapperStyle={{fontSize:'11px', color:'var(--text-3)'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* 사무실 vs 개인 */}
          <div className="rounded-2xl p-4 sm:p-5 fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <p className="text-[13px] sm:text-[14px] font-semibold mb-3 sm:mb-4" style={{ color:'var(--text-1)' }}>사무실 vs 개인 지출</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} barGap={3} barCategoryGap="30%">
                <CartesianGrid vertical={false} {...grid}/>
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={yFmt} width={36}/>
                <Tooltip content={<Tip/>}/>
                <Legend wrapperStyle={{fontSize:'11px', color:'var(--text-3)'}}/>
                <Bar dataKey="사무실" fill="var(--office)"    radius={[4,4,0,0]} opacity={0.85}/>
                <Bar dataKey="개인"   fill="var(--personal)"  radius={[4,4,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 예측 */}
          <div className="rounded-2xl p-4 sm:p-5 fade-up"
            style={{ background:'linear-gradient(135deg, rgba(124,111,224,0.07), rgba(59,130,246,0.04))', border:'1px solid rgba(124,111,224,0.18)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(124,111,224,0.15)' }}>
                <Target size={14} style={{ color:'var(--primary-light)' }}/>
              </div>
              <div>
                <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color:'var(--text-1)' }}>{ny}년 {nm}월 예측</p>
                <p className="text-[10px] sm:text-[11px]" style={{ color:'var(--text-3)' }}>최근 {Math.min(3,stats.length)}개월 추세 기반</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {l:'예상 수입', v:pred.income,  c:'var(--income)'},
                {l:'예상 지출', v:pred.expense, c:'var(--expense)'},
                {l:'예상 잔액', v:pred.balance, c:pred.balance>=0?'#b8acff':'var(--expense)'},
              ].map(c => (
                <div key={c.l} className="rounded-xl p-3 sm:p-4" style={{ background:'var(--bg-base)', border:'1px solid var(--border)' }}>
                  <p className="text-[10px] sm:text-[11px] mb-1" style={{ color:'var(--text-3)' }}>{c.l}</p>
                  <p className="text-[12px] sm:text-[15px] font-bold truncate" style={{ color:c.c }}>{formatCurrency(c.v)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 코칭 */}
          <div className="rounded-2xl p-4 sm:p-5 fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(245,158,11,0.15)' }}>
                <Lightbulb size={14} style={{ color:'#f59e0b' }}/>
              </div>
              <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color:'var(--text-1)' }}>재무 코칭</p>
            </div>
            <div className="space-y-2">
              {tips.map((t,i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl"
                  style={{
                    background: t.type==='good'?'rgba(16,185,129,0.07)':t.type==='warn'?'rgba(245,158,11,0.07)':'var(--bg-elevated)',
                    border:`1px solid ${t.type==='good'?'rgba(16,185,129,0.16)':t.type==='warn'?'rgba(245,158,11,0.16)':'var(--border)'}`,
                  }}>
                  {t.type==='good'?<TrendingUp size={13} style={{ color:'var(--income)', flexShrink:0, marginTop:2}}/>
                   :t.type==='warn'?<AlertCircle size={13} style={{ color:'#f59e0b', flexShrink:0, marginTop:2}}/>
                   :<ChevronRight size={13} style={{ color:'var(--primary-light)', flexShrink:0, marginTop:2}}/>}
                  <p className="text-[12px] sm:text-[13px] leading-relaxed"
                    style={{ color:t.type==='good'?'#6ee7b7':t.type==='warn'?'#fcd34d':'var(--text-2)' }}>
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 비교표 */}
          <div className="rounded-2xl overflow-hidden fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div className="px-4 sm:px-5 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
              <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color:'var(--text-1)' }}>월별 상세 비교</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                    {['기간','수입','지출','잔액','수익률','고정비'].map(h => (
                      <th key={h} className={cn('py-3 text-[11px] font-bold', h==='기간'?'text-left px-5':'text-right px-3 sm:px-4')}
                        style={{ color:'var(--text-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...stats].reverse().map((s,i) => (
                    <tr key={i} style={{ borderBottom:i<stats.length-1?'1px solid var(--border)':'none', background:i===0?'rgba(124,111,224,0.04)':'transparent' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] sm:text-[13px] font-semibold" style={{ color:'var(--text-1)' }}>{s.year}년 {s.month}월</span>
                          {i===0&&<span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background:'var(--primary-glow)', color:'var(--primary-light)' }}>이번달</span>}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-[12px] sm:text-[13px] font-semibold" style={{ color:'var(--income)' }}>{formatCurrency(s.totalIncome)}</td>
                      <td className="px-3 sm:px-4 py-3 text-right text-[12px] sm:text-[13px] font-semibold" style={{ color:'var(--expense)' }}>{formatCurrency(s.totalExpense)}</td>
                      <td className="px-3 sm:px-4 py-3 text-right text-[12px] sm:text-[13px] font-bold" style={{ color:s.balance>=0?'#b8acff':'var(--expense)' }}>{formatCurrency(s.balance)}</td>
                      <td className="px-3 sm:px-4 py-3 text-right text-[11px] sm:text-[12px] font-semibold">
                        {s.totalIncome>0
                          ? <span className="flex items-center justify-end gap-0.5" style={{ color:s.balance>=0?'var(--income)':'var(--expense)' }}>
                              {s.balance<0&&<ArrowDownRight size={11}/>}
                              {((s.balance/s.totalIncome)*100).toFixed(1)}%
                            </span>
                          : <span style={{ color:'var(--text-3)' }}>—</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-[12px] sm:text-[13px]" style={{ color:'var(--text-2)' }}>{formatCurrency(s.fixedExpense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

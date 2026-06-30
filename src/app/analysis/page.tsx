'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, AlertCircle, Lightbulb, Target, ChevronRight, ArrowDownRight } from 'lucide-react'
import { useMonthlyStats } from '@/hooks/useTransactions'
import { getCurrentYearMonth, getPreviousMonths, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

const PIE_C = ['#5b4dd4','#059669','#dc2626','#2563eb','#ea580c','#ec4899']

function coach(stats: MonthlyStats[], cur?: MonthlyStats) {
  const tips: {type:'good'|'warn'|'tip';text:string}[] = []
  if (!cur || cur.totalIncome===0) { tips.push({type:'tip',text:'이번 달 거래 내역을 입력하면 맞춤 코칭을 받을 수 있어요.'}); return tips }
  const r = cur.balance/cur.totalIncome
  if (r>=0.3)     tips.push({type:'good',text:`수익률 ${(r*100).toFixed(1)}%로 우수합니다!`})
  else if (r>=0.1)tips.push({type:'warn',text:`수익률 ${(r*100).toFixed(1)}%. 30% 이상을 목표로 지출을 줄여보세요.`})
  else if (r<0)   tips.push({type:'warn',text:'지출이 수입을 초과했습니다. 지출 구조를 점검하세요.'})
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

const CT = ({active,payload,label}:{active?:boolean;payload?:Array<{name:string;value:number;color:string}>;label?:string}) => {
  if (!active||!payload?.length) return null
  return (
    <div className="rounded-2xl p-4 text-[13px] sm:text-[14px]"
      style={{ background:'var(--day-card)', border:'1px solid var(--day-border2)', boxShadow:'var(--day-shadow-lg)' }}>
      <p className="font-bold mb-2" style={{ color:'var(--day-text2)' }}>{label}</p>
      {payload.map((e,i) => <p key={i} className="font-semibold" style={{ color:e.color }}>{e.name}: {formatCurrency(e.value)}</p>)}
    </div>
  )
}

export default function AnalysisPage() {
  const {year,month} = getCurrentYearMonth()
  const [n,setN] = useState(6)
  const months = useMemo(()=>getPreviousMonths(year,month,n),[year,month,n])
  const {stats,loading} = useMonthlyStats(months)

  const cur=stats[stats.length-1], pred=predict(stats), tips=coach(stats,cur)
  const nm=month===12?1:month+1, ny=month===12?year+1:year

  const data=stats.map(s=>({name:`${s.month}월`,수입:s.totalIncome,지출:s.totalExpense,잔액:s.balance,사무실:s.officeExpense,개인:s.personalExpense}))
  const pieData  =cur?[{name:'사무실',value:cur.officeExpense},{name:'개인',value:cur.personalExpense}].filter(d=>d.value>0):[]
  const fixedData=cur?[{name:'고정비',value:cur.fixedExpense},{name:'변동비',value:cur.variableExpense}].filter(d=>d.value>0):[]

  const ax={fill:'var(--day-text3)',fontSize:12}
  const grid={stroke:'var(--day-border)',strokeDasharray:'4 4'}
  const yf=(v:number)=>v>=1000000?`${(v/1000000).toFixed(0)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:`${v}`

  const Card = ({children,className=''}:{children:React.ReactNode;className?:string}) => (
    <div className={`rounded-3xl p-5 sm:p-7 fade-up ${className}`}
      style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}>
      {children}
    </div>
  )
  const Title = ({t}:{t:string}) => (
    <p className="text-[15px] sm:text-[17px] font-extrabold mb-4 sm:mb-5" style={{ color:'var(--day-text1)' }}>{t}</p>
  )

  return (
    <div className="page-wrap space-y-5 sm:space-y-6">

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

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({length:4}).map((_,i)=><div key={i} className="h-64 rounded-3xl animate-pulse" style={{ background:'var(--day-card)'}}/>)}
        </div>
      ) : (
        <>
          <Card><Title t="월별 수입 · 지출"/>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} barGap={4} barCategoryGap="30%">
                <CartesianGrid vertical={false} {...grid}/>
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={yf} width={42}/>
                <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:'13px',color:'var(--day-text2)'}}/>
                <Bar dataKey="수입" fill="var(--income-light)" radius={[6,6,0,0]} opacity={0.85}/>
                <Bar dataKey="지출" fill="var(--expense-light)" radius={[6,6,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card><Title t="순수익 추이"/>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <CartesianGrid vertical={false} {...grid}/>
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={yf} width={42}/>
                <Tooltip content={<CT/>}/>
                <Line type="monotone" dataKey="잔액" stroke="var(--primary)" strokeWidth={3}
                  dot={{fill:'var(--primary)',r:4,strokeWidth:0}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {(pieData.length>0||fixedData.length>0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {pieData.length>0&&<Card><Title t={`${year}년 ${month}월 지출 구성`}/>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={5} dataKey="value">
                    {pieData.map((_,i)=><Cell key={i} fill={PIE_C[i]} opacity={0.9}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>formatCurrency(Number(v))}/><Legend wrapperStyle={{fontSize:'13px',color:'var(--day-text2)'}}/></PieChart>
                </ResponsiveContainer>
              </Card>}
              {fixedData.length>0&&<Card><Title t={`${year}년 ${month}월 고정비 · 변동비`}/>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={fixedData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={5} dataKey="value">
                    <Cell fill="var(--primary)" opacity={0.9}/><Cell fill="#f59e0b" opacity={0.9}/>
                  </Pie>
                  <Tooltip formatter={(v)=>formatCurrency(Number(v))}/><Legend wrapperStyle={{fontSize:'13px',color:'var(--day-text2)'}}/></PieChart>
                </ResponsiveContainer>
              </Card>}
            </div>
          )}

          <Card><Title t="사무실 vs 개인 지출"/>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} barGap={4} barCategoryGap="30%">
                <CartesianGrid vertical={false} {...grid}/>
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={yf} width={42}/>
                <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:'13px',color:'var(--day-text2)'}}/>
                <Bar dataKey="사무실" fill="var(--office)" radius={[6,6,0,0]} opacity={0.85}/>
                <Bar dataKey="개인"   fill="var(--personal)" radius={[6,6,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 예측 */}
          <div className="rounded-3xl p-5 sm:p-7 fade-up"
            style={{ background:'linear-gradient(135deg,#eef0ff,#f0f7ff)', border:'1.5px solid var(--primary-border)', boxShadow:'var(--day-shadow-lg)' }}>
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
          <Card>
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
          </Card>

          {/* 비교표 */}
          <div className="rounded-3xl overflow-hidden fade-up"
            style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}>
            <div className="px-5 sm:px-7 py-4 sm:py-5" style={{ borderBottom:'1px solid var(--day-border)' }}>
              <p className="text-[15px] sm:text-[17px] font-extrabold" style={{ color:'var(--day-text1)' }}>월별 상세 비교</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--day-border)', background:'var(--day-card2)' }}>
                    {['기간','수입','지출','잔액','수익률','고정비'].map(h=>(
                      <th key={h} className={cn('py-4 text-[12px] sm:text-[13px] font-bold', h==='기간'?'text-left px-5 sm:px-7':'text-right px-4')}
                        style={{ color:'var(--day-text3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...stats].reverse().map((s,i)=>(
                    <tr key={i} style={{ borderBottom:i<stats.length-1?'1px solid var(--day-border)':'none', background:i===0?'#f5f3ff':'transparent' }}>
                      <td className="px-5 sm:px-7 py-3.5 sm:py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] sm:text-[14px] font-bold" style={{ color:'var(--day-text1)' }}>{s.year}년 {s.month}월</span>
                          {i===0&&<span className="text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg" style={{ background:'var(--primary-soft)', color:'var(--primary)' }}>이번달</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] sm:text-[14px] font-bold" style={{ color:'var(--income)' }}>{formatCurrency(s.totalIncome)}</td>
                      <td className="px-4 py-3.5 text-right text-[13px] sm:text-[14px] font-bold" style={{ color:'var(--expense)' }}>{formatCurrency(s.totalExpense)}</td>
                      <td className="px-4 py-3.5 text-right text-[13px] sm:text-[14px] font-extrabold" style={{ color:s.balance>=0?'var(--primary)':'var(--expense)' }}>{formatCurrency(s.balance)}</td>
                      <td className="px-4 py-3.5 text-right text-[12px] sm:text-[13px] font-bold">
                        {s.totalIncome>0
                          ?<span className="flex items-center justify-end gap-0.5" style={{ color:s.balance>=0?'var(--income)':'var(--expense)' }}>
                            {s.balance<0&&<ArrowDownRight size={12}/>}{((s.balance/s.totalIncome)*100).toFixed(1)}%
                          </span>
                          :<span style={{ color:'var(--day-text3)' }}>—</span>}
                      </td>
                      <td className="px-5 sm:px-7 py-3.5 text-right text-[13px] sm:text-[14px]" style={{ color:'var(--day-text2)' }}>{formatCurrency(s.fixedExpense)}</td>
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

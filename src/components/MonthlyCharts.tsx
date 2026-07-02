'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Transaction, MonthlyStats } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Props {
  transactions: Transaction[]
  stats: MonthlyStats
  year: number
  month: number
}

const COLORS = ['#4f46e5','#059669','#dc2626','#ea580c','#2563eb','#d97706','#7c3aed','#0891b2']

const CT = ({ active, payload, label }: { active?: boolean; payload?: Array<{name:string;value:number;color:string}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e9f5', padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', fontSize:12 }}>
      <p style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>{label}</p>
      {payload.map((e,i) => (
        <p key={i} style={{ fontWeight:700, color:e.color, marginTop:2 }}>
          {e.name}: {formatCurrency(e.value)}
        </p>
      ))}
    </div>
  )
}

/* 박스 공통 스타일 — borderRadius 제거 */
const BOX: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e4e9f5',
  borderRadius: 0,
  boxShadow: '0 1px 3px rgba(17,24,39,0.06)',
  padding: '18px 16px 14px',
}

const TITLE: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 14,
}

export default function MonthlyCharts({ transactions, stats, year, month }: Props) {
  /* 일별 데이터 */
  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const ds  = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const txs = transactions.filter(t => t.transaction_date === ds)
    return {
      day: `${day}`,
      수입: txs.filter(t => t.transaction_type==='income').reduce((s,t)=>s+t.amount,0),
      지출: txs.filter(t => t.transaction_type==='expense').reduce((s,t)=>s+t.amount,0),
    }
  }).filter(d => d.수입>0 || d.지출>0)

  /* 지출 파이 */
  const expTypePie = [
    { name:'사무실', value:stats.officeExpense },
    { name:'개인',   value:stats.personalExpense },
  ].filter(d=>d.value>0)

  const fixedPie = [
    { name:'고정비', value:stats.fixedExpense },
    { name:'변동비', value:stats.variableExpense },
  ].filter(d=>d.value>0)

  /* 입금처별 수입 (판매대금은 하위 거래 표시) */
  const incomeBySource = Object.entries(
    transactions
      .filter(t => t.transaction_type==='income')
      .reduce((acc, t) => {
        const src = t.income_sources?.name || '기타'
        if (!acc[src]) acc[src] = { total:0, items:[] }
        acc[src].total += t.amount
        acc[src].items.push({ desc: t.description || '—', amount: t.amount })
        return acc
      }, {} as Record<string,{ total:number; items:{desc:string;amount:number}[] }>)
  ).map(([name,d])=>({ name, ...d })).sort((a,b)=>b.total-a.total)

  /* 카테고리별 지출 */
  const expenseByCat = Object.entries(
    transactions
      .filter(t => t.transaction_type==='expense')
      .reduce((acc, t) => {
        const n = t.expense_categories?.name || '기타'
        acc[n] = (acc[n]||0) + t.amount
        return acc
      }, {} as Record<string,number>)
  ).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8)

  const yf = (v:number) =>
    v>=1000000 ? `${(v/1000000).toFixed(0)}M`
    : v>=1000  ? `${(v/1000).toFixed(0)}K`
    : `${v}`

  const axStyle = { fill:'#9ca3af', fontSize:11, fontFamily:'Nanum Gothic, sans-serif' }
  const gridStyle = { stroke:'#e4e9f5', strokeDasharray:'3 3' }

  if (!transactions.length) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* 3열 레이아웃: 입금처별 수입 | 일별 차트 | 카테고리별 지출 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14 }}
        className="charts-3col">
        <style>{`
          @media(min-width:900px){
            .charts-3col{ grid-template-columns: 1fr 1.8fr 1fr !important; }
          }
        `}</style>

        {/* ── 왼쪽: 입금처별 수입 ── */}
        <div style={BOX}>
          <p style={TITLE}>입금처별 수입</p>
          {incomeBySource.length === 0 ? (
            <p style={{ fontSize:12, color:'#9ca3af' }}>수입 내역 없음</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {incomeBySource.map((src, i) => {
                const pct = stats.totalIncome>0 ? (src.total/stats.totalIncome)*100 : 0
                return (
                  <div key={src.name}>
                    {/* 소스 헤더 */}
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'#374151' }}>{src.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#059669' }}>
                        {formatCurrency(src.total)}
                        <span style={{ color:'#9ca3af', fontWeight:600, marginLeft:4 }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    {/* 바 */}
                    <div style={{ height:5, background:'#f3f4f6', overflow:'hidden', marginBottom:4 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:COLORS[i%COLORS.length], transition:'width 0.6s ease' }} />
                    </div>
                    {/* 판매대금 하위 항목 */}
                    {src.name==='판매대금' && src.items.length>0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:3, paddingLeft:10, borderLeft:'2px solid #a7f3d0', marginTop:6 }}>
                        {src.items
                          .reduce((acc:{desc:string;amount:number}[], item) => {
                            const ex = acc.find(a=>a.desc===item.desc)
                            if (ex) ex.amount+=item.amount
                            else acc.push({...item})
                            return acc
                          },[])
                          .sort((a,b)=>b.amount-a.amount)
                          .map(item => (
                            <div key={item.desc} style={{ display:'flex', justifyContent:'space-between' }}>
                              <span style={{ fontSize:11, color:'#6b7280' }}>{item.desc}</span>
                              <span style={{ fontSize:11, fontWeight:700, color:'#059669' }}>{formatCurrency(item.amount)}</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 중앙: 월간분석 (일별 바 + 파이 차트) ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* 일별 수입/지출 */}
          {dailyData.length>0 && (
            <div style={BOX}>
              <p style={TITLE}>일별 수입 · 지출</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyData} barGap={2} barCategoryGap="35%">
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="day" tick={axStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axStyle} axisLine={false} tickLine={false} tickFormatter={yf} width={36} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="수입" fill="#059669" radius={[3,3,0,0]} />
                  <Bar dataKey="지출" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6" style={{ marginTop:8 }}>
                {[{c:'#059669',l:'수입'},{c:'#ef4444',l:'지출'}].map(i=>(
                  <div key={i.l} className="flex items-center gap-1.5">
                    <div style={{ width:10, height:10, background:i.c }} />
                    <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af' }}>{i.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 지출 파이 */}
          {stats.totalExpense>0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {expTypePie.length>0 && (
                <div style={BOX}>
                  <p style={{ ...TITLE, fontSize:12 }}>지출 구성</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={expTypePie} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value">
                        <Cell fill="#2563eb"/><Cell fill="#ea580c"/>
                      </Pie>
                      <Tooltip formatter={(v)=>formatCurrency(Number(v))} />
                      <Legend wrapperStyle={{ fontSize:11, fontWeight:700, fontFamily:'Nanum Gothic, sans-serif' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {fixedPie.length>0 && (
                <div style={BOX}>
                  <p style={{ ...TITLE, fontSize:12 }}>고정 · 변동</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={fixedPie} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value">
                        <Cell fill="#6b7280"/><Cell fill="#4f46e5"/>
                      </Pie>
                      <Tooltip formatter={(v)=>formatCurrency(Number(v))} />
                      <Legend wrapperStyle={{ fontSize:11, fontWeight:700, fontFamily:'Nanum Gothic, sans-serif' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 오른쪽: 카테고리별 지출 ── */}
        <div style={BOX}>
          <p style={TITLE}>카테고리별 지출</p>
          {expenseByCat.length===0 ? (
            <p style={{ fontSize:12, color:'#9ca3af' }}>지출 내역 없음</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {expenseByCat.map((item,i)=>{
                const pct = stats.totalExpense>0 ? (item.value/stats.totalExpense)*100 : 0
                return (
                  <div key={item.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{item.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:COLORS[i%COLORS.length] }}>
                        {formatCurrency(item.value)}
                        <span style={{ color:'#9ca3af', fontWeight:600, marginLeft:3 }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div style={{ height:5, background:'#f3f4f6', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:COLORS[i%COLORS.length], transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

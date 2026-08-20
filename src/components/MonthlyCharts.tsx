'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import { Transaction, MonthlyStats } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Props {
  transactions: Transaction[]
  stats: MonthlyStats
  year: number
  month: number
  monthlyStats?: MonthlyStats[]
}

const COLORS = ['#4f46e5','#059669','#dc2626','#ea580c','#2563eb','#d97706','#7c3aed','#0891b2']

/* 합산할 카테고리 목록 */
const MERGE_CATS = ['매입원가', '물류비']
const MERGED_LABEL = '매입원가·물류비'

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

export default function MonthlyCharts({ transactions, stats, year, month, monthlyStats = [] }: Props) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [expandedPie, setExpandedPie] = useState<'expType' | 'fixed' | null>(null)

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

  /* 카테고리별 지출 — 매입원가·물류비 합산, 세부 거래 보관 */
  const expenseByCatMap: Record<string, { value: number; items: Transaction[] }> = {}
  transactions
    .filter(t => t.transaction_type === 'expense')
    .forEach(t => {
      const rawName = t.expense_categories?.name || '기타'
      const name = MERGE_CATS.includes(rawName) ? MERGED_LABEL : rawName
      if (!expenseByCatMap[name]) expenseByCatMap[name] = { value: 0, items: [] }
      expenseByCatMap[name].value += t.amount
      expenseByCatMap[name].items.push(t)
    })

  const expenseByCat = Object.entries(expenseByCatMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.value - a.value)

  const yf = (v:number) =>
    v>=1000000 ? `${(v/1000000).toFixed(0)}M`
    : v>=1000  ? `${(v/1000).toFixed(0)}K`
    : `${v}`

  const axStyle = { fill:'#9ca3af', fontSize:11 }
  const gridStyle = { stroke:'#e4e9f5', strokeDasharray:'3 3' }

  /* 월별 추이 데이터 */
  const monthlyChartData = monthlyStats.map(s => ({
    name: `${s.month}월`,
    수입: s.totalIncome,
    지출: s.totalExpense,
  }))

  if (!transactions.length) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── 월별 수입·지출 추이 ── */}
      {monthlyChartData.length > 1 && (
        <div style={BOX}>
          <p style={TITLE}>월별 수입 · 지출 추이</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyChartData} barGap={2} barCategoryGap="35%">
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis dataKey="name" tick={axStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axStyle} axisLine={false} tickLine={false} tickFormatter={yf} width={36} />
              <Tooltip content={<CT />} />
              <Bar dataKey="수입" fill="#059669" radius={[3,3,0,0]} />
              <Bar dataKey="지출" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:8 }}>
            {[{c:'#059669',l:'수입'},{c:'#ef4444',l:'지출'}].map(i=>(
              <div key={i.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, background:i.c }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af' }}>{i.l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3열 레이아웃 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14 }} className="charts-3col">
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
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'#374151' }}>{src.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#059669' }}>
                        {formatCurrency(src.total)}
                        <span style={{ color:'#9ca3af', fontWeight:600, marginLeft:4 }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div style={{ height:5, background:'#f3f4f6', overflow:'hidden', marginBottom:4 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:COLORS[i%COLORS.length], transition:'width 0.6s ease' }} />
                    </div>
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

        {/* ── 중앙: 월간분석 ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
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

          {stats.totalExpense>0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

              {/* ── 지출 구성 (사무실/개인) ── */}
              {expTypePie.length>0 && (() => {
                const isOpen = expandedPie === 'expType'
                /* 사무실/개인별 → 카테고리별 합계 */
                const groups = (['office','personal'] as const).map(type => {
                  const label = type === 'office' ? '사무실' : '개인'
                  const color = type === 'office' ? '#2563eb' : '#ea580c'
                  const rows = transactions
                    .filter(t => t.transaction_type==='expense' && t.expense_type===type)
                    .reduce((acc: {name:string;amount:number}[], t) => {
                      const n = t.expense_categories?.name || '기타'
                      const ex = acc.find(a => a.name===n)
                      if (ex) ex.amount += t.amount
                      else acc.push({ name:n, amount:t.amount })
                      return acc
                    }, [])
                    .sort((a,b)=>b.amount-a.amount)
                  const total = rows.reduce((s,r)=>s+r.amount,0)
                  return { label, color, rows, total }
                }).filter(g=>g.total>0)
                return (
                  <div style={{ ...BOX, cursor:'pointer', userSelect:'none' }}
                    onClick={() => setExpandedPie(isOpen ? null : 'expType')}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', ...TITLE }}>
                      <span>지출 구성</span>
                      <ChevronDown size={13} style={{ color:'#9ca3af', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'0.2s', flexShrink:0 }} />
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={expTypePie} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value">
                          <Cell fill="#2563eb"/><Cell fill="#ea580c"/>
                        </Pie>
                        <Tooltip formatter={(v)=>formatCurrency(Number(v))} />
                        <Legend wrapperStyle={{ fontSize:11, fontWeight:700 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {isOpen && (
                      <div style={{ borderTop:'1px solid #f3f4f6', marginTop:10, paddingTop:10, display:'flex', flexDirection:'column', gap:10 }}>
                        {groups.map(g => (
                          <div key={g.label}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:800, color:g.color }}>{g.label}</span>
                              <span style={{ fontSize:11, fontWeight:800, color:g.color }}>{formatCurrency(g.total)}</span>
                            </div>
                            {g.rows.map(r => (
                              <div key={r.name} style={{ display:'flex', justifyContent:'space-between', paddingLeft:8, marginTop:3 }}>
                                <span style={{ fontSize:10, color:'#6b7280' }}>{r.name}</span>
                                <span style={{ fontSize:10, fontWeight:700, color:'#374151' }}>{formatCurrency(r.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── 고정 · 변동 ── */}
              {fixedPie.length>0 && (() => {
                const isOpen = expandedPie === 'fixed'
                /* 고정/변동별 → 카테고리별 합계 */
                const groups = ([true, false] as const).map(isFixed => {
                  const label = isFixed ? '고정비' : '변동비'
                  const color = isFixed ? '#6b7280' : '#4f46e5'
                  const rows = transactions
                    .filter(t => t.transaction_type==='expense' && t.is_fixed===isFixed)
                    .reduce((acc: {name:string;amount:number}[], t) => {
                      const n = t.expense_categories?.name || '기타'
                      const ex = acc.find(a => a.name===n)
                      if (ex) ex.amount += t.amount
                      else acc.push({ name:n, amount:t.amount })
                      return acc
                    }, [])
                    .sort((a,b)=>b.amount-a.amount)
                  const total = rows.reduce((s,r)=>s+r.amount,0)
                  return { label, color, rows, total }
                }).filter(g=>g.total>0)
                return (
                  <div style={{ ...BOX, cursor:'pointer', userSelect:'none' }}
                    onClick={() => setExpandedPie(isOpen ? null : 'fixed')}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', ...TITLE }}>
                      <span>고정 · 변동</span>
                      <ChevronDown size={13} style={{ color:'#9ca3af', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'0.2s', flexShrink:0 }} />
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={fixedPie} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value">
                          <Cell fill="#6b7280"/><Cell fill="#4f46e5"/>
                        </Pie>
                        <Tooltip formatter={(v)=>formatCurrency(Number(v))} />
                        <Legend wrapperStyle={{ fontSize:11, fontWeight:700 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {isOpen && (
                      <div style={{ borderTop:'1px solid #f3f4f6', marginTop:10, paddingTop:10, display:'flex', flexDirection:'column', gap:10 }}>
                        {groups.map(g => (
                          <div key={g.label}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:800, color:g.color }}>{g.label}</span>
                              <span style={{ fontSize:11, fontWeight:800, color:g.color }}>{formatCurrency(g.total)}</span>
                            </div>
                            {g.rows.map(r => (
                              <div key={r.name} style={{ display:'flex', justifyContent:'space-between', paddingLeft:8, marginTop:3 }}>
                                <span style={{ fontSize:10, color:'#6b7280' }}>{r.name}</span>
                                <span style={{ fontSize:10, fontWeight:700, color:'#374151' }}>{formatCurrency(r.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* ── 오른쪽: 카테고리별 지출 ── */}
        <div style={BOX}>
          <p style={TITLE}>카테고리별 지출</p>
          {expenseByCat.length===0 ? (
            <p style={{ fontSize:12, color:'#9ca3af' }}>지출 내역 없음</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {expenseByCat.map((item,i) => {
                const pct = stats.totalExpense>0 ? (item.value/stats.totalExpense)*100 : 0
                const color = COLORS[i%COLORS.length]
                const isOpen = expandedCat === item.name
                const isMerged = item.name === MERGED_LABEL

                /* 세부 내역: 내용(desc)+원본카테고리별 합계 */
                const details = item.items
                  .reduce((acc: { desc: string; origCat: string; amount: number; count: number }[], t) => {
                    const desc = t.description || '—'
                    const origCat = t.expense_categories?.name || ''
                    const key = `${desc}__${origCat}`
                    const ex = acc.find(a => `${a.desc}__${a.origCat}` === key)
                    if (ex) { ex.amount += t.amount; ex.count++ }
                    else acc.push({ desc, origCat, amount: t.amount, count: 1 })
                    return acc
                  }, [])
                  .sort((a, b) => b.amount - a.amount)

                return (
                  <div key={item.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {/* 카테고리 행 — 클릭 가능 */}
                    <div
                      onClick={() => setExpandedCat(isOpen ? null : item.name)}
                      style={{
                        padding: '10px 0',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {/* 색상 점 */}
                          <div style={{ width:8, height:8, background:color, flexShrink:0 }} />
                          <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>
                            {item.name}
                          </span>
                          {isMerged && (
                            <span style={{ fontSize:10, color:'#9ca3af', background:'#f3f4f6', padding:'1px 5px' }}>합산</span>
                          )}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:12, fontWeight:700, color }}>
                            {formatCurrency(item.value)}
                            <span style={{ color:'#9ca3af', fontWeight:600, marginLeft:3 }}>({pct.toFixed(0)}%)</span>
                          </span>
                          <ChevronDown
                            size={14}
                            style={{
                              color:'#9ca3af',
                              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                              flexShrink: 0,
                            }}
                          />
                        </div>
                      </div>
                      {/* 바 */}
                      <div style={{ height:4, background:'#f3f4f6', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:color, transition:'width 0.6s ease' }} />
                      </div>
                    </div>

                    {/* 세부 내역 펼침 */}
                    {isOpen && (
                      <div style={{
                        borderLeft: `3px solid ${color}`,
                        marginLeft: 8,
                        marginBottom: 8,
                        paddingLeft: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}>
                        {/* 합산 카테고리는 원본 카테고리명 소제목 표시 */}
                        {isMerged && (
                          <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', marginBottom:2 }}>
                            매입원가 + 물류비 합산
                          </p>
                        )}
                        {details.length === 0 ? (
                          <p style={{ fontSize:11, color:'#9ca3af' }}>세부 내역 없음</p>
                        ) : (
                          details.map((d, di) => (
                            <div key={di} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:4, minWidth:0, overflow:'hidden' }}>
                                <span style={{ fontSize:11, color:'#374151', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {d.desc}
                                </span>
                                {isMerged && d.origCat && (
                                  <span style={{ fontSize:10, color:'#9ca3af', flexShrink:0 }}>({d.origCat})</span>
                                )}
                                {d.count > 1 && (
                                  <span style={{ fontSize:10, color:'#9ca3af', background:'#f3f4f6', padding:'1px 4px', flexShrink:0 }}>{d.count}건</span>
                                )}
                              </div>
                              <span style={{ fontSize:11, fontWeight:700, color, flexShrink:0 }}>
                                {formatCurrency(d.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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

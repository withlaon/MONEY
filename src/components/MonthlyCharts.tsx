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

const COLORS = ['#4f46e5', '#059669', '#dc2626', '#ea580c', '#2563eb', '#d97706', '#7c3aed', '#0891b2']

/* 툴팁 */
const CT = ({ active, payload, label }: { active?: boolean; payload?: Array<{name:string;value:number;color:string}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e4e9f5', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12,
    }}>
      <p style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ fontWeight: 700, color: e.color, marginTop: 2 }}>
          {e.name}: {formatCurrency(e.value)}
        </p>
      ))}
    </div>
  )
}

export default function MonthlyCharts({ transactions, stats, year, month }: Props) {
  /* ── 일별 데이터 ── */
  const daysInMonth = new Date(year, month, 0).getDate()
  const allDailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const ds  = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const txs = transactions.filter(t => t.transaction_date === ds)
    return {
      day: `${day}`,
      수입: txs.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0),
      지출: txs.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })
  const dailyData = allDailyData.filter(d => d.수입 > 0 || d.지출 > 0)

  /* ── 지출 구성 (사무실/개인) ── */
  const expTypePie = [
    { name: '사무실', value: stats.officeExpense },
    { name: '개인', value: stats.personalExpense },
  ].filter(d => d.value > 0)

  /* ── 고정비/변동비 ── */
  const fixedPie = [
    { name: '고정비', value: stats.fixedExpense },
    { name: '변동비', value: stats.variableExpense },
  ].filter(d => d.value > 0)

  /* ── 입금처별 수입 ── */
  const incomeBySource = Object.entries(
    transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((acc, t) => {
        const n = t.income_sources?.name || '기타'
        acc[n] = (acc[n] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  /* ── 카테고리별 지출 ── */
  const expenseByCat = Object.entries(
    transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((acc, t) => {
        const n = t.expense_categories?.name || '기타'
        acc[n] = (acc[n] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const yf = (v: number) =>
    v >= 1000000 ? `${(v/1000000).toFixed(0)}M`
    : v >= 1000  ? `${(v/1000).toFixed(0)}K`
    : `${v}`

  const axStyle = { fill: '#9ca3af', fontSize: 11 }
  const gridStyle = { stroke: '#e4e9f5', strokeDasharray: '3 3' }

  const noData = transactions.length === 0

  if (noData) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── 일별 수입/지출 막대 ── */}
      {dailyData.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e4e9f5', borderRadius: 16,
          boxShadow: '0 1px 2px rgba(17,24,39,0.04)', padding: '18px 20px 14px',
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
            일별 수입 · 지출
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} barGap={2} barCategoryGap="35%">
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis dataKey="day" tick={axStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axStyle} axisLine={false} tickLine={false} tickFormatter={yf} width={36} />
              <Tooltip content={<CT />} />
              <Bar dataKey="수입" fill="#059669" radius={[4,4,0,0]} />
              <Bar dataKey="지출" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6" style={{ marginTop: 10 }}>
            {[{ c:'#059669', l:'수입' },{ c:'#ef4444', l:'지출' }].map(i => (
              <div key={i.l} className="flex items-center gap-1.5">
                <div style={{ width:10, height:10, borderRadius:3, background: i.c }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af' }}>{i.l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 지출 분석 (2칼럼) ── */}
      {stats.totalExpense > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* 사무실/개인 */}
          {expTypePie.length > 0 && (
            <div style={{
              background: '#fff', border: '1px solid #e4e9f5', borderRadius: 16,
              boxShadow: '0 1px 2px rgba(17,24,39,0.04)', padding: '18px 16px 14px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}>지출 구성</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={expTypePie} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                    <Cell fill="#2563eb" />
                    <Cell fill="#ea580c" />
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 고정/변동 */}
          {fixedPie.length > 0 && (
            <div style={{
              background: '#fff', border: '1px solid #e4e9f5', borderRadius: 16,
              boxShadow: '0 1px 2px rgba(17,24,39,0.04)', padding: '18px 16px 14px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}>고정 · 변동</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={fixedPie} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                    <Cell fill="#6b7280" />
                    <Cell fill="#4f46e5" />
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── 카테고리별 지출 (가로 바) ── */}
      {expenseByCat.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e4e9f5', borderRadius: 16,
          boxShadow: '0 1px 2px rgba(17,24,39,0.04)', padding: '18px 20px 14px',
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 16 }}>카테고리별 지출</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expenseByCat.map((item, i) => {
              const pct = stats.totalExpense > 0 ? (item.value / stats.totalExpense) * 100 : 0
              return (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{item.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                      {formatCurrency(item.value)} <span style={{ color: '#9ca3af', fontWeight: 600 }}>({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${pct}%`,
                      background: COLORS[i % COLORS.length],
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 입금처별 수입 ── */}
      {incomeBySource.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e4e9f5', borderRadius: 16,
          boxShadow: '0 1px 2px rgba(17,24,39,0.04)', padding: '18px 20px 14px',
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 16 }}>입금처별 수입</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incomeBySource.map((item, i) => {
              const pct = stats.totalIncome > 0 ? (item.value / stats.totalIncome) * 100 : 0
              return (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{item.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                      {formatCurrency(item.value)} <span style={{ color: '#9ca3af', fontWeight: 600 }}>({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${pct}%`,
                      background: '#059669',
                      opacity: 0.7 + (i * 0.05),
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

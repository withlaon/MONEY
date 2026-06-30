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

const PIE_COLORS = ['#7b6fe0', '#10b981', '#f43f5e', '#3b82f6', '#f97316', '#ec4899']

function generateCoaching(stats: MonthlyStats[], cur?: MonthlyStats) {
  const tips: { type: 'good' | 'warn' | 'tip'; text: string }[] = []
  if (!cur || cur.totalIncome === 0) {
    tips.push({ type: 'tip', text: '이번 달 거래 내역을 입력하면 맞춤 코칭을 받을 수 있어요.' })
    return tips
  }
  const rate = cur.balance / cur.totalIncome
  if (rate >= 0.3)       tips.push({ type: 'good', text: `수익률 ${(rate*100).toFixed(1)}%로 우수합니다. 이 추세를 유지하세요!` })
  else if (rate >= 0.1)  tips.push({ type: 'warn', text: `수익률 ${(rate*100).toFixed(1)}%. 지출 절감으로 30% 이상을 목표로 해보세요.` })
  else if (rate < 0)     tips.push({ type: 'warn', text: '지출이 수입을 초과했습니다. 지출 구조를 점검하세요.' })

  if (cur.totalExpense > 0) {
    const fixR = cur.fixedExpense / cur.totalExpense
    if (fixR > 0.6) tips.push({ type: 'warn', text: `고정비가 지출의 ${(fixR*100).toFixed(0)}%입니다. 고정비 절감을 검토해보세요.` })
    const perR = cur.personalExpense / cur.totalExpense
    if (perR > 0.4) tips.push({ type: 'tip', text: `개인 지출이 ${(perR*100).toFixed(0)}%입니다. 사업비와 개인비를 명확히 분리하면 절세에 유리해요.` })
  }
  if (stats.length >= 3) {
    const inc = stats.slice(-3).map(s => s.totalIncome)
    if (inc.every((v,i) => i===0 || v >= inc[i-1]))
      tips.push({ type: 'good', text: '최근 3개월 수입이 꾸준히 성장 중입니다!' })
  }
  tips.push({ type: 'tip', text: '수입의 20~30%를 저축/비상금으로 적립하는 습관을 추천합니다.' })
  return tips
}

function predictNext(stats: MonthlyStats[]) {
  if (!stats.length) return { income: 0, expense: 0, balance: 0 }
  const r = stats.slice(-3)
  const avgI = r.reduce((s,m) => s+m.totalIncome, 0) / r.length
  const avgE = r.reduce((s,m) => s+m.totalExpense, 0) / r.length
  if (r.length >= 2) {
    const gi = (r[r.length-1].totalIncome  - r[0].totalIncome)  / (r.length-1)
    const ge = (r[r.length-1].totalExpense - r[0].totalExpense) / (r.length-1)
    const pi = Math.max(0, avgI + gi*0.5)
    const pe = Math.max(0, avgE + ge*0.5)
    return { income: Math.round(pi), expense: Math.round(pe), balance: Math.round(pi-pe) }
  }
  return { income: Math.round(avgI), expense: Math.round(avgE), balance: Math.round(avgI-avgE) }
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{name:string;value:number;color:string}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-[12px] shadow-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
      <p className="font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((e,i) => (
        <p key={i} className="font-medium" style={{ color: e.color }}>{e.name}: {formatCurrency(e.value)}</p>
      ))}
    </div>
  )
}

export default function AnalysisPage() {
  const { year, month } = getCurrentYearMonth()
  const [monthCount, setMonthCount] = useState(6)
  const months = useMemo(() => getPreviousMonths(year, month, monthCount), [year, month, monthCount])
  const { stats, loading } = useMonthlyStats(months)

  const cur = stats[stats.length-1]
  const pred = predictNext(stats)
  const coaching = generateCoaching(stats, cur)
  const nextMonth = month===12 ? 1 : month+1
  const nextYear  = month===12 ? year+1 : year

  const chartData = stats.map(s => ({
    name: `${s.month}월`,
    수입: s.totalIncome,
    지출: s.totalExpense,
    잔액: s.balance,
    사무실: s.officeExpense,
    개인: s.personalExpense,
  }))

  const pieData = cur ? [
    { name: '사무실', value: cur.officeExpense },
    { name: '개인', value: cur.personalExpense },
  ].filter(d => d.value > 0) : []

  const fixedData = cur ? [
    { name: '고정비', value: cur.fixedExpense },
    { name: '변동비', value: cur.variableExpense },
  ].filter(d => d.value > 0) : []

  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 }
  const gridStyle = { stroke: 'var(--border)', strokeDasharray: '4 4' }

  return (
    <div className="min-h-full p-5 sm:p-7 max-w-[1280px] mx-auto space-y-5">

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>분석 / 비교</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>월별 수입·지출 추이 분석</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>분석 기간</span>
          {[3,6,12].map(n => (
            <button
              key={n}
              onClick={() => setMonthCount(n)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
              style={{
                background: monthCount===n ? 'rgba(123,111,224,0.12)' : 'var(--bg-card)',
                border: `1px solid ${monthCount===n ? 'rgba(123,111,224,0.3)' : 'var(--border)'}`,
                color: monthCount===n ? 'var(--primary-light)' : 'var(--text-muted)',
              }}
            >
              {n}개월
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* 수입/지출 막대 차트 */}
          <div className="rounded-2xl p-5 fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>월별 수입 · 지출</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4} barCategoryGap="32%">
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v>=1000000 ? `${(v/1000000).toFixed(0)}M` : v>=1000 ? `${(v/1000).toFixed(0)}K` : `${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize:'12px', color:'var(--text-muted)' }} />
                <Bar dataKey="수입" fill="#10b981" radius={[5,5,0,0]} opacity={0.85} />
                <Bar dataKey="지출" fill="#f43f5e" radius={[5,5,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 잔액 라인 차트 */}
          <div className="rounded-2xl p-5 fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>순수익 추이</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v>=1000000 ? `${(v/1000000).toFixed(0)}M` : v>=1000 ? `${(v/1000).toFixed(0)}K` : `${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="잔액" stroke="var(--primary-light)" strokeWidth={2.5}
                  dot={{ fill:'var(--primary-light)', r:4, strokeWidth:0 }}
                  activeDot={{ r:6, fill:'var(--primary-light)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 파이 차트 2개 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pieData.length > 0 && (
              <div className="rounded-2xl p-5 fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {year}년 {month}월 지출 구성
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} opacity={0.88} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend wrapperStyle={{ fontSize:'12px', color:'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {fixedData.length > 0 && (
              <div className="rounded-2xl p-5 fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {year}년 {month}월 고정비 · 변동비
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fixedData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                      <Cell fill="var(--primary)" opacity={0.88} />
                      <Cell fill="#f59e0b" opacity={0.88} />
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend wrapperStyle={{ fontSize:'12px', color:'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 사무실 vs 개인 */}
          <div className="rounded-2xl p-5 fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>사무실 vs 개인 지출 비교</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4} barCategoryGap="32%">
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v>=1000000 ? `${(v/1000000).toFixed(0)}M` : `${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize:'12px', color:'var(--text-muted)' }} />
                <Bar dataKey="사무실" fill="#3b82f6" radius={[5,5,0,0]} opacity={0.85} />
                <Bar dataKey="개인"   fill="#f97316" radius={[5,5,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 예측 */}
          <div
            className="rounded-2xl p-5 fade-up"
            style={{ background: 'linear-gradient(135deg, rgba(123,111,224,0.08), rgba(59,130,246,0.04))', border: '1px solid rgba(123,111,224,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,111,224,0.15)' }}>
                <Target size={15} style={{ color: 'var(--primary-light)' }} />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {nextYear}년 {nextMonth}월 예측
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  최근 {Math.min(3, stats.length)}개월 추세 기반
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '예상 수입', value: pred.income,  color: '#10b981' },
                { label: '예상 지출', value: pred.expense, color: '#f43f5e' },
                { label: '예상 잔액', value: pred.balance, color: pred.balance >= 0 ? '#a78bfa' : '#f43f5e' },
              ].map(c => (
                <div key={c.label} className="rounded-xl p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
                  <p className="text-[15px] font-bold" style={{ color: c.color }}>{formatCurrency(c.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 코칭 */}
          <div className="rounded-2xl p-5 fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <Lightbulb size={15} style={{ color: '#f59e0b' }} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>재무 코칭</p>
            </div>
            <div className="space-y-2.5">
              {coaching.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{
                    background: tip.type==='good' ? 'rgba(16,185,129,0.07)'  : tip.type==='warn' ? 'rgba(245,158,11,0.07)' : 'var(--bg-elevated)',
                    border: `1px solid ${tip.type==='good' ? 'rgba(16,185,129,0.18)' : tip.type==='warn' ? 'rgba(245,158,11,0.18)' : 'var(--border)'}`,
                  }}
                >
                  {tip.type==='good'
                    ? <TrendingUp size={14} style={{ color:'#10b981', flexShrink:0, marginTop:2 }} />
                    : tip.type==='warn'
                    ? <AlertCircle size={14} style={{ color:'#f59e0b', flexShrink:0, marginTop:2 }} />
                    : <ChevronRight size={14} style={{ color:'var(--primary-light)', flexShrink:0, marginTop:2 }} />
                  }
                  <p className="text-[13px] leading-relaxed" style={{ color: tip.type==='good' ? '#6ee7b7' : tip.type==='warn' ? '#fcd34d' : 'var(--text-secondary)' }}>
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 월별 비교표 */}
          <div className="rounded-2xl overflow-hidden fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>월별 상세 비교</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {['기간','수입','지출','잔액','수익률','고정비'].map(h => (
                      <th key={h} className={cn('py-3 text-[11px] font-semibold', h==='기간' ? 'text-left px-5' : 'text-right px-4')} style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...stats].reverse().map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < stats.length-1 ? '1px solid var(--border)' : 'none',
                        background: i===0 ? 'rgba(123,111,224,0.04)' : 'transparent',
                      }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {s.year}년 {s.month}월
                          </span>
                          {i===0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(123,111,224,0.15)', color: 'var(--primary-light)' }}>
                              이번달
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold" style={{ color: '#10b981' }}>
                        {formatCurrency(s.totalIncome)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold" style={{ color: '#f43f5e' }}>
                        {formatCurrency(s.totalExpense)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold" style={{ color: s.balance>=0 ? '#a78bfa' : '#f43f5e' }}>
                        {formatCurrency(s.balance)}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-semibold">
                        {s.totalIncome > 0 ? (
                          <span className="flex items-center justify-end gap-0.5" style={{ color: s.balance>=0 ? '#10b981' : '#f43f5e' }}>
                            {s.balance < 0 && <ArrowDownRight size={12} />}
                            {((s.balance/s.totalIncome)*100).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(s.fixedExpense)}
                      </td>
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

'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target, ChevronRight } from 'lucide-react'
import { useMonthlyStats } from '@/hooks/useTransactions'
import { getCurrentYearMonth, getPreviousMonths, formatCurrency, getMonthName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

const COLORS = ['#6c63ff', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899']

function generateCoaching(stats: MonthlyStats[], currentStats: MonthlyStats | undefined) {
  const tips: { type: 'good' | 'warn' | 'tip'; text: string }[] = []
  if (!currentStats || currentStats.totalIncome === 0) {
    tips.push({ type: 'tip', text: '이번 달 거래 내역을 입력하면 코칭을 받을 수 있어요.' })
    return tips
  }

  const profitRate = currentStats.totalIncome > 0 ? currentStats.balance / currentStats.totalIncome : 0

  if (profitRate >= 0.3) {
    tips.push({ type: 'good', text: `수익률 ${(profitRate * 100).toFixed(1)}%로 양호합니다. 꾸준히 유지하세요!` })
  } else if (profitRate >= 0.1) {
    tips.push({ type: 'warn', text: `수익률이 ${(profitRate * 100).toFixed(1)}%입니다. 지출을 조금 더 줄여보세요.` })
  } else if (profitRate < 0) {
    tips.push({ type: 'warn', text: `이번 달 지출이 수입을 초과했습니다. 수입 대비 지출을 점검하세요.` })
  }

  if (currentStats.totalExpense > 0) {
    const fixedRatio = currentStats.fixedExpense / currentStats.totalExpense
    if (fixedRatio > 0.6) {
      tips.push({ type: 'warn', text: `고정비가 전체 지출의 ${(fixedRatio * 100).toFixed(0)}%를 차지합니다. 고정비 절감을 검토해보세요.` })
    }
    const personalRatio = currentStats.personalExpense / currentStats.totalExpense
    if (personalRatio > 0.4) {
      tips.push({ type: 'tip', text: `개인 지출이 전체의 ${(personalRatio * 100).toFixed(0)}%입니다. 사업 비용과 개인 지출을 명확히 구분하면 절세에 도움돼요.` })
    }
  }

  if (stats.length >= 3) {
    const recentIncome = stats.slice(-3).map(s => s.totalIncome)
    const isIncomeGrowing = recentIncome.every((val, i) => i === 0 || val >= recentIncome[i - 1])
    if (isIncomeGrowing) {
      tips.push({ type: 'good', text: '최근 3개월 수입이 꾸준히 증가하고 있어요. 좋은 추세입니다!' })
    }
  }

  tips.push({ type: 'tip', text: '매달 수입의 20-30%를 저축/비상금으로 적립하는 것을 권장합니다.' })
  return tips
}

function predictNextMonth(stats: MonthlyStats[]): { income: number; expense: number; balance: number } {
  if (stats.length === 0) return { income: 0, expense: 0, balance: 0 }
  if (stats.length === 1) return {
    income: stats[0].totalIncome,
    expense: stats[0].totalExpense,
    balance: stats[0].balance
  }

  const recent = stats.slice(-3)
  const avgIncome = recent.reduce((s, m) => s + m.totalIncome, 0) / recent.length
  const avgExpense = recent.reduce((s, m) => s + m.totalExpense, 0) / recent.length

  // 추세 반영
  if (recent.length >= 2) {
    const incomeGrowth = (recent[recent.length - 1].totalIncome - recent[0].totalIncome) / (recent.length - 1)
    const expenseGrowth = (recent[recent.length - 1].totalExpense - recent[0].totalExpense) / (recent.length - 1)
    const predictedIncome = Math.max(0, avgIncome + incomeGrowth * 0.5)
    const predictedExpense = Math.max(0, avgExpense + expenseGrowth * 0.5)
    return {
      income: Math.round(predictedIncome),
      expense: Math.round(predictedExpense),
      balance: Math.round(predictedIncome - predictedExpense)
    }
  }

  return {
    income: Math.round(avgIncome),
    expense: Math.round(avgExpense),
    balance: Math.round(avgIncome - avgExpense)
  }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#13151f] border border-[#252836] rounded-xl p-3 shadow-xl">
        <p className="text-xs text-[#6b7280] mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalysisPage() {
  const { year, month } = getCurrentYearMonth()
  const [monthCount, setMonthCount] = useState(6)

  const months = useMemo(() => getPreviousMonths(year, month, monthCount), [year, month, monthCount])
  const { stats, loading } = useMonthlyStats(months)

  const currentStats = stats[stats.length - 1]
  const predictions = predictNextMonth(stats)
  const coaching = generateCoaching(stats, currentStats)

  const chartData = stats.map(s => ({
    name: `${s.month}월`,
    수입: s.totalIncome,
    지출: s.totalExpense,
    잔액: s.balance,
    사무실지출: s.officeExpense,
    개인지출: s.personalExpense,
  }))

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const pieData = currentStats ? [
    { name: '사무실 지출', value: currentStats.officeExpense },
    { name: '개인 지출', value: currentStats.personalExpense },
  ].filter(d => d.value > 0) : []

  const fixedVarData = currentStats ? [
    { name: '고정비', value: currentStats.fixedExpense },
    { name: '변동비', value: currentStats.variableExpense },
  ].filter(d => d.value > 0) : []

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">분석 / 비교</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">월별 수입·지출 추이 분석</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6b7280]">기간:</span>
          {[3, 6, 12].map(n => (
            <button
              key={n}
              onClick={() => setMonthCount(n)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                monthCount === n
                  ? 'bg-[#6c63ff20] text-[#8b84ff] border-[#6c63ff30]'
                  : 'bg-[#1a1d27] text-[#6b7280] border-[#252836] hover:text-white'
              )}
            >
              {n}개월
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#1a1d27] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* 수입/지출 막대 차트 */}
          <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">월별 수입 · 지출</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                <Bar dataKey="수입" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 잔액 추이 라인 차트 */}
          <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">순수익(잔액) 추이</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="잔액" stroke="#6c63ff" strokeWidth={2.5} dot={{ fill: '#6c63ff', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 지출 구성 파이차트 */}
            {currentStats && pieData.length > 0 && (
              <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">
                  {year}년 {month}월 지출 구성
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 고정비/변동비 */}
            {currentStats && fixedVarData.length > 0 && (
              <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">
                  {year}년 {month}월 고정비 · 변동비
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fixedVarData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      <Cell fill="#6c63ff" opacity={0.85} />
                      <Cell fill="#f59e0b" opacity={0.85} />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 사무실 vs 개인 지출 비교 */}
          <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">사무실 vs 개인 지출 비교</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                <Bar dataKey="사무실지출" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="개인지출" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 다음 달 예측 */}
          <div className="bg-gradient-to-r from-[#6c63ff15] to-[#4f46e510] border border-[#6c63ff20] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#6c63ff]" />
              <h2 className="text-sm font-semibold text-white">{nextYear}년 {nextMonth}월 예측</h2>
              <span className="text-xs text-[#6b7280] ml-auto">최근 {Math.min(3, stats.length)}개월 추세 기반</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0f1117] rounded-xl p-4">
                <p className="text-xs text-[#6b7280] mb-1">예상 수입</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(predictions.income)}</p>
              </div>
              <div className="bg-[#0f1117] rounded-xl p-4">
                <p className="text-xs text-[#6b7280] mb-1">예상 지출</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(predictions.expense)}</p>
              </div>
              <div className="bg-[#0f1117] rounded-xl p-4">
                <p className="text-xs text-[#6b7280] mb-1">예상 잔액</p>
                <p className={cn('text-lg font-bold', predictions.balance >= 0 ? 'text-violet-400' : 'text-red-400')}>
                  {formatCurrency(predictions.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* AI 코칭 */}
          <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#f59e0b]" />
              <h2 className="text-sm font-semibold text-white">재무 코칭</h2>
            </div>
            <div className="space-y-3">
              {coaching.map((tip, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl',
                    tip.type === 'good' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                    tip.type === 'warn' ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-[#1a1d27] border border-[#252836]'
                  )}
                >
                  {tip.type === 'good' ? <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> :
                   tip.type === 'warn' ? <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> :
                   <ChevronRight className="w-4 h-4 text-[#6c63ff] flex-shrink-0 mt-0.5" />}
                  <p className={cn(
                    'text-sm',
                    tip.type === 'good' ? 'text-emerald-300' :
                    tip.type === 'warn' ? 'text-amber-300' :
                    'text-[#a0a8c0]'
                  )}>
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 월별 비교표 */}
          <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e2130]">
              <h2 className="text-sm font-semibold text-white">월별 상세 비교</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2130]">
                    <th className="text-left px-5 py-3 text-xs text-[#6b7280] font-medium">기간</th>
                    <th className="text-right px-4 py-3 text-xs text-[#6b7280] font-medium">수입</th>
                    <th className="text-right px-4 py-3 text-xs text-[#6b7280] font-medium">지출</th>
                    <th className="text-right px-4 py-3 text-xs text-[#6b7280] font-medium">잔액</th>
                    <th className="text-right px-4 py-3 text-xs text-[#6b7280] font-medium">수익률</th>
                    <th className="text-right px-5 py-3 text-xs text-[#6b7280] font-medium">고정비</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats].reverse().map((s, i) => (
                    <tr key={i} className={cn(
                      'border-b border-[#1e2130] last:border-0',
                      i === 0 && 'bg-[#6c63ff08]'
                    )}>
                      <td className="px-5 py-3 text-white font-medium">
                        {s.year}년 {s.month}월
                        {i === 0 && <span className="ml-2 text-[10px] text-[#6c63ff] bg-[#6c63ff20] px-1.5 py-0.5 rounded">이번달</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(s.totalIncome)}</td>
                      <td className="px-4 py-3 text-right text-red-400">{formatCurrency(s.totalExpense)}</td>
                      <td className={cn('px-4 py-3 text-right font-medium', s.balance >= 0 ? 'text-violet-400' : 'text-red-400')}>
                        {formatCurrency(s.balance)}
                      </td>
                      <td className={cn('px-4 py-3 text-right text-xs', s.totalIncome > 0 && s.balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {s.totalIncome > 0 ? `${((s.balance / s.totalIncome) * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300">{formatCurrency(s.fixedExpense)}</td>
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

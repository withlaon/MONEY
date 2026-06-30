'use client'

import { TrendingUp, TrendingDown, Wallet, Building2, User, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

interface Props { stats: MonthlyStats }

const CARDS = [
  { key: 'totalIncome',    label: '총 수입',    icon: TrendingUp,  color: '#10b981', soft: 'rgba(16,185,129,0.09)',  border: 'rgba(16,185,129,0.2)'  },
  { key: 'totalExpense',   label: '총 지출',    icon: TrendingDown,color: '#f43f5e', soft: 'rgba(244,63,94,0.09)',   border: 'rgba(244,63,94,0.2)'   },
  { key: 'balance',        label: '순수익',     icon: Wallet,      color: '#9d91f5', soft: 'rgba(124,111,224,0.09)', border: 'rgba(124,111,224,0.22)', dynamic: true },
  { key: 'officeExpense',  label: '사무실 지출', icon: Building2,  color: '#3b82f6', soft: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.18)' },
  { key: 'personalExpense',label: '개인 지출',  icon: User,        color: '#f97316', soft: 'rgba(249,115,22,0.07)',  border: 'rgba(249,115,22,0.18)' },
  { key: 'fixedExpense',   label: '고정비',     icon: Lock,        color: '#94a3b8', soft: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.18)' },
] as const

export default function StatsCards({ stats }: Props) {
  return (
    <div className="stats-grid">
      {CARDS.map(c => {
        const Icon = c.icon
        const val  = stats[c.key as keyof MonthlyStats] as number
        const neg  = 'dynamic' in c && val < 0
        const color  = neg ? '#f43f5e' : c.color
        const soft   = neg ? 'rgba(244,63,94,0.09)'  : c.soft
        const border = neg ? 'rgba(244,63,94,0.2)'   : c.border

        return (
          <div
            key={c.key}
            className="hover-card fade-up rounded-2xl p-3 sm:p-4"
            style={{ background: soft, border: `1px solid ${border}` }}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-[11px] sm:text-[12px] font-medium leading-tight" style={{ color: 'var(--text-2)' }}>
                {c.label}
              </p>
              <div
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22`, color }}
              >
                <Icon size={13} />
              </div>
            </div>
            <p className="text-[13px] sm:text-[15px] font-bold leading-tight truncate" style={{ color }}>
              {formatCurrency(val)}
            </p>
            {c.key === 'balance' && stats.totalIncome > 0 && (
              <p className="text-[10px] sm:text-[11px] mt-1 font-semibold" style={{ color: neg ? '#f4435e88' : '#10b98180' }}>
                {((val / stats.totalIncome) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

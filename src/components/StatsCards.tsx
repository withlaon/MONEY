'use client'

import { TrendingUp, TrendingDown, Wallet, Building2, User, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

interface StatsCardsProps {
  stats: MonthlyStats
}

const cards = [
  {
    key: 'totalIncome',
    label: '총 수입',
    icon: TrendingUp,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    iconBg: 'rgba(16,185,129,0.15)',
  },
  {
    key: 'totalExpense',
    label: '총 지출',
    icon: TrendingDown,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
    iconBg: 'rgba(244,63,94,0.15)',
  },
  {
    key: 'balance',
    label: '순수익',
    icon: Wallet,
    color: '#7b6fe0',
    bg: 'rgba(123,111,224,0.08)',
    border: 'rgba(123,111,224,0.2)',
    iconBg: 'rgba(123,111,224,0.15)',
    dynamic: true,
  },
  {
    key: 'officeExpense',
    label: '사무실 지출',
    icon: Building2,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.15)',
    iconBg: 'rgba(59,130,246,0.12)',
  },
  {
    key: 'personalExpense',
    label: '개인 지출',
    icon: User,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.15)',
    iconBg: 'rgba(249,115,22,0.12)',
  },
  {
    key: 'fixedExpense',
    label: '고정비',
    icon: Lock,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.06)',
    border: 'rgba(148,163,184,0.15)',
    iconBg: 'rgba(148,163,184,0.1)',
  },
]

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon
        const value = stats[card.key as keyof MonthlyStats] as number
        const isNegative = card.dynamic && value < 0
        const color = isNegative ? '#f43f5e' : card.color
        const bg = isNegative ? 'rgba(244,63,94,0.08)' : card.bg
        const border = isNegative ? 'rgba(244,63,94,0.2)' : card.border
        const iconBg = isNegative ? 'rgba(244,63,94,0.15)' : card.iconBg

        return (
          <div
            key={card.key}
            className="hover-card rounded-2xl p-4 fade-up"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {card.label}
              </p>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg, color }}
              >
                <Icon size={14} />
              </div>
            </div>
            <p className="text-[15px] font-bold leading-tight truncate" style={{ color }}>
              {formatCurrency(value)}
            </p>
            {card.key === 'balance' && stats.totalIncome > 0 && (
              <p className="text-[11px] mt-1 font-medium" style={{ color: isNegative ? '#f43f5e99' : '#10b98199' }}>
                수익률 {((value / stats.totalIncome) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

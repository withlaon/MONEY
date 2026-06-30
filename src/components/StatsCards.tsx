'use client'

import { TrendingUp, TrendingDown, Wallet, Building2, User, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: MonthlyStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: '총 수입',
      value: stats.totalIncome,
      icon: TrendingUp,
      className: 'income-gradient',
      iconClass: 'text-emerald-400',
      valueClass: 'text-emerald-400',
    },
    {
      label: '총 지출',
      value: stats.totalExpense,
      icon: TrendingDown,
      className: 'expense-gradient',
      iconClass: 'text-red-400',
      valueClass: 'text-red-400',
    },
    {
      label: '순수익 (잔액)',
      value: stats.balance,
      icon: Wallet,
      className: 'balance-gradient',
      iconClass: 'text-violet-400',
      valueClass: stats.balance >= 0 ? 'text-violet-400' : 'text-red-400',
    },
    {
      label: '사무실 지출',
      value: stats.officeExpense,
      icon: Building2,
      className: 'bg-[#1a1d27] border border-[#252836]',
      iconClass: 'text-blue-400',
      valueClass: 'text-blue-400',
    },
    {
      label: '개인 지출',
      value: stats.personalExpense,
      icon: User,
      className: 'bg-[#1a1d27] border border-[#252836]',
      iconClass: 'text-orange-400',
      valueClass: 'text-orange-400',
    },
    {
      label: '고정비',
      value: stats.fixedExpense,
      icon: Lock,
      className: 'bg-[#1a1d27] border border-[#252836]',
      iconClass: 'text-slate-400',
      valueClass: 'text-slate-300',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={cn('rounded-2xl p-4 card-hover', card.className)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b7280] font-medium">{card.label}</span>
              <div className={cn('w-7 h-7 rounded-lg bg-[#0f1117] flex items-center justify-center', card.iconClass)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className={cn('text-lg font-bold leading-tight', card.valueClass)}>
              {formatCurrency(card.value)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

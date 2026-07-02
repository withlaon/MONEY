'use client'

import { TrendingUp, TrendingDown, Wallet, Building2, User, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

interface Props { stats: MonthlyStats }

const CARDS = [
  {
    key: 'totalIncome', label: '총 수입', icon: TrendingUp,
    color: '#059669', soft: '#ecfdf5', border: '#a7f3d0', bar: '#059669',
  },
  {
    key: 'totalExpense', label: '총 지출', icon: TrendingDown,
    color: '#dc2626', soft: '#fef2f2', border: '#fca5a5', bar: '#dc2626',
  },
  {
    key: 'balance', label: '순수익', icon: Wallet,
    color: '#4f46e5', soft: '#eef0fe', border: '#c7c3fa', bar: '#4f46e5',
    dynamic: true,
  },
  {
    key: 'officeExpense', label: '사무실 지출', icon: Building2,
    color: '#2563eb', soft: '#eff6ff', border: '#bfdbfe', bar: '#2563eb',
  },
  {
    key: 'personalExpense', label: '개인 지출', icon: User,
    color: '#ea580c', soft: '#fff7ed', border: '#fed7aa', bar: '#ea580c',
  },
  {
    key: 'fixedExpense', label: '고정비', icon: Lock,
    color: '#6b7280', soft: '#f3f4f6', border: '#d1d5db', bar: '#6b7280',
  },
] as const

export default function StatsCards({ stats }: Props) {
  return (
    <div className="stats-grid">
      {CARDS.map((c, i) => {
        const Icon  = c.icon
        const val   = stats[c.key as keyof MonthlyStats] as number
        const isNeg = 'dynamic' in c && val < 0
        const color  = isNeg ? '#dc2626' : c.color
        const soft   = isNeg ? '#fef2f2' : c.soft
        const bar    = isNeg ? '#dc2626' : c.bar

        const pct = c.key === 'balance' && stats.totalIncome > 0
          ? ((val / stats.totalIncome) * 100).toFixed(1)
          : null

        return (
          <div
            key={c.key}
            className="fade-up relative overflow-hidden"
            style={{
              background: 'var(--day-card)',
              border: '1px solid var(--day-border)',
              borderRadius: 0,
              boxShadow: 'var(--day-shadow)',
              animationDelay: `${i * 40}ms`,
            }}
          >
            {/* 상단 컬러 바 */}
            <div style={{ height: 3, background: bar, borderRadius: '16px 16px 0 0' }} />

            <div className="p-4 sm:p-5">
              {/* 레이블 + 아이콘 */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold" style={{ color: 'var(--day-text3)' }}>
                  {c.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: soft, color }}
                >
                  <Icon size={14} />
                </div>
              </div>

              {/* 금액 */}
              <p
                className="text-[17px] sm:text-[19px] font-extrabold leading-none truncate"
                style={{ color }}
              >
                {val > 0 && c.key === 'balance' ? '+' : ''}{formatCurrency(val)}
              </p>

              {/* 수익률 배지 */}
              {pct && (
                <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
                  style={{
                    background: isNeg ? '#fef2f2' : '#ecfdf5',
                    color: isNeg ? '#dc2626' : '#059669',
                  }}>
                  {pct}%
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

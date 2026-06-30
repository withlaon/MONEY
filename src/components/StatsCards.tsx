'use client'

import { TrendingUp, TrendingDown, Wallet, Building2, User, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MonthlyStats } from '@/lib/supabase'

interface Props { stats: MonthlyStats }

const CARDS = [
  { key:'totalIncome',    label:'총 수입',    icon:TrendingUp,  color:'var(--income)',   iconBg:'var(--income-soft)',   border:'var(--income-border)',   accent:'#d1fae5' },
  { key:'totalExpense',   label:'총 지출',    icon:TrendingDown,color:'var(--expense)',  iconBg:'var(--expense-soft)',  border:'var(--expense-border)',  accent:'#fee2e2' },
  { key:'balance',        label:'순수익',     icon:Wallet,      color:'var(--primary)',  iconBg:'var(--primary-soft)',  border:'var(--primary-border)',  accent:'#ede9fe', dynamic:true },
  { key:'officeExpense',  label:'사무실 지출',icon:Building2,   color:'var(--office)',   iconBg:'var(--office-soft)',   border:'var(--office-border)',   accent:'#dbeafe' },
  { key:'personalExpense',label:'개인 지출',  icon:User,        color:'var(--personal)', iconBg:'var(--personal-soft)', border:'var(--personal-border)', accent:'#ffedd5' },
  { key:'fixedExpense',   label:'고정비',     icon:Lock,        color:'var(--fixed)',    iconBg:'var(--fixed-soft)',    border:'var(--fixed-border)',    accent:'#f1f5f9' },
] as const

export default function StatsCards({ stats }: Props) {
  return (
    <div className="stats-grid">
      {CARDS.map(c => {
        const Icon = c.icon
        const val  = stats[c.key as keyof MonthlyStats] as number
        const neg  = 'dynamic' in c && val < 0
        const color  = neg ? 'var(--expense)' : c.color
        const iconBg = neg ? 'var(--expense-soft)' : c.iconBg
        const border = neg ? 'var(--expense-border)' : c.border

        return (
          <div
            key={c.key}
            className="fade-up rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-default"
            style={{
              background: 'var(--day-card)',
              border: `1px solid ${border}`,
              boxShadow: 'var(--day-shadow)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color: 'var(--day-text2)' }}>
                {c.label}
              </p>
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg, color }}
              >
                <Icon size={15} />
              </div>
            </div>
            <p className="text-[16px] sm:text-[18px] font-extrabold leading-tight truncate" style={{ color }}>
              {formatCurrency(val)}
            </p>
            {c.key === 'balance' && stats.totalIncome > 0 && (
              <p className="text-[12px] font-semibold mt-1.5 px-2 py-0.5 rounded-lg inline-block"
                style={{ background: neg ? 'var(--expense-soft)' : 'var(--income-soft)', color: neg ? 'var(--expense)' : 'var(--income)' }}>
                {((val / stats.totalIncome) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

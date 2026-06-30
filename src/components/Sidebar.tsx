'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Settings2,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',             label: '대시보드',  icon: LayoutDashboard, desc: '월별 현황' },
  { href: '/transactions', label: '거래내역',  icon: ArrowLeftRight,  desc: '수입/지출' },
  { href: '/analysis',     label: '분석/비교', icon: BarChart3,       desc: '추이 분석' },
  { href: '/settings',     label: '설정',      icon: Settings2,       desc: '카테고리' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex flex-col transition-all duration-300 ease-in-out z-20 flex-shrink-0',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* 로고 영역 */}
      <div
        className={cn(
          'flex items-center gap-3 py-5 transition-all duration-300',
          collapsed ? 'px-3 justify-center' : 'px-5'
        )}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7b6fe0, #5b4fd4)',
            boxShadow: '0 4px 15px rgba(123,111,224,0.35)',
          }}
        >
          <Wallet className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>
              MONEY
            </p>
            <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              금전출납부
            </p>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center rounded-xl transition-all duration-200',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={{
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(123,111,224,0.3)' : 'transparent'}`,
                color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
              }}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                  isActive ? '' : 'group-hover:bg-white/5'
                )}
                style={{
                  background: isActive ? 'rgba(123,111,224,0.2)' : 'transparent',
                  color: isActive ? 'var(--primary-light)' : 'inherit',
                }}
              >
                <Icon size={16} />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-tight">{item.label}</p>
                  <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)', opacity: isActive ? 0.8 : 0.6 }}>
                    {item.desc}
                  </p>
                </div>
              )}
              {isActive && !collapsed && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary-light)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 */}
      {!collapsed && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
            © 2026 MONEY App
          </p>
        </div>
      )}

      {/* 접기 버튼 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-muted)',
          zIndex: 30,
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

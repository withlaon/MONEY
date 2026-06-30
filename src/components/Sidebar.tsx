'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowDownUp,
  TrendingUp,
  Settings,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/transactions', label: '거래내역', icon: ArrowDownUp },
  { href: '/analysis', label: '분석/비교', icon: TrendingUp },
  { href: '/settings', label: '설정', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col bg-[#13151f] border-r border-[#1e2130] transition-all duration-300 relative z-10',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* 로고 */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-[#1e2130]',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#4f46e5] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#6c63ff30]">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">MONEY</h1>
            <p className="text-[10px] text-[#6b7280] tracking-wider">금전출납부</p>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-[#6c63ff20] text-[#8b84ff] border border-[#6c63ff30]'
                  : 'text-[#6b7280] hover:text-white hover:bg-[#1a1d27]'
              )}
            >
              <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6c63ff]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 정보 */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-[#1e2130]">
          <p className="text-[10px] text-[#3d4168] text-center">
            © 2026 MONEY App
          </p>
        </div>
      )}

      {/* 접기/펼치기 버튼 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#1e2130] border border-[#252836] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}

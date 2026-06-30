'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Settings2, Wallet,
} from 'lucide-react'

const navItems = [
  { href: '/',             label: '대시보드',  icon: LayoutDashboard },
  { href: '/transactions', label: '거래내역',  icon: ArrowLeftRight  },
  { href: '/analysis',     label: '분석/비교', icon: BarChart3       },
  { href: '/settings',     label: '설정',      icon: Settings2       },
]

/* ═══════════════════════════════
   데스크탑 사이드바 (md+)
═══════════════════════════════ */
export function DesktopSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* 로고 */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c6fe0, #5348c7)',
            boxShadow: '0 4px 14px rgba(124,111,224,0.3)',
          }}
        >
          <Wallet size={17} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-[15px] leading-tight" style={{ color: 'var(--text-1)' }}>MONEY</p>
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>금전출납부</p>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              style={{
                background: active ? 'var(--primary-glow)' : 'transparent',
                border: `1px solid ${active ? 'rgba(124,111,224,0.28)' : 'transparent'}`,
                color: active ? 'var(--primary-light)' : 'var(--text-3)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: active ? 'rgba(124,111,224,0.18)' : 'transparent',
                  color: active ? 'var(--primary-light)' : 'inherit',
                }}
              >
                <Icon size={15} />
              </div>
              <span className="text-[13px] font-medium">{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary-light)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[10px] text-center" style={{ color: 'var(--text-3)' }}>© 2026 MONEY App</p>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════
   모바일 하단 탭바 (~ sm)
═══════════════════════════════ */
export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex items-center"
      style={{
        background: 'rgba(15,18,25,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        height: 'var(--nav-h)',
      }}
    >
      {navItems.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all"
            style={{ color: active ? 'var(--primary-light)' : 'var(--text-3)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: active ? 'rgba(124,111,224,0.15)' : 'transparent' }}
            >
              <Icon size={18} />
            </div>
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/* 기본 export는 DesktopSidebar (layout에서 개별 임포트) */
export default DesktopSidebar

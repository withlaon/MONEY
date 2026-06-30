'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, BarChart3, Settings2, Wallet } from 'lucide-react'

const navItems = [
  { href: '/',             label: '대시보드',  icon: LayoutDashboard, sub: '월별 현황' },
  { href: '/transactions', label: '거래내역',  icon: ArrowLeftRight,  sub: '수입/지출' },
  { href: '/analysis',     label: '분석/비교', icon: BarChart3,       sub: '추이 분석' },
  { href: '/settings',     label: '설정',      icon: Settings2,       sub: '카테고리' },
]

/* ══════════════════════════════
   데스크탑 나이트 사이드바
══════════════════════════════ */
export function DesktopSidebar() {
  const path = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 sidebar-area"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--night-bg)',
        borderRight: '1px solid var(--night-border)',
      }}
    >
      {/* 로고 */}
      <div
        className="flex items-center gap-3.5 px-6 py-6"
        style={{ borderBottom: '1px solid var(--night-border)' }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c6fe0 0%, #4f3fc9 100%)',
            boxShadow: '0 4px 18px rgba(124,111,224,0.38)',
          }}
        >
          <Wallet size={19} className="text-white" />
        </div>
        <div>
          <p className="font-extrabold text-[17px] tracking-tight" style={{ color: 'var(--night-text1)' }}>
            MONEY
          </p>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mt-0.5" style={{ color: 'var(--night-text3)' }}>
            금전출납부
          </p>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-5 px-4 space-y-2.5">
        {navItems.map(item => {
          const Icon = item.icon
          const active = path === item.href || (item.href !== '/' && path.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3.5 rounded-2xl transition-all duration-150"
              style={{
                padding: '10px 14px',
                background: active ? 'rgba(124,111,224,0.14)' : 'transparent',
                border: `1px solid ${active ? 'rgba(124,111,224,0.28)' : 'transparent'}`,
                color: active ? '#a99ff8' : 'var(--night-text2)',
                overflow: 'visible',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: active ? 'rgba(124,111,224,0.22)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#a99ff8' : 'var(--night-text2)',
                }}
              >
                <Icon size={17} />
              </div>
              <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'visible' }}>
                <p className="text-[14px] font-bold leading-snug whitespace-nowrap" style={{ overflow: 'visible' }}>
                  {item.label}
                </p>
                <p className="text-[11px] mt-0.5 whitespace-nowrap" style={{ color: active ? 'rgba(169,159,248,0.6)' : 'var(--night-text3)', overflow: 'visible' }}>
                  {item.sub}
                </p>
              </div>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#a99ff8' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid var(--night-border)' }}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--night-border)' }}
        >
          <p className="text-[11px] font-medium" style={{ color: 'var(--night-text3)' }}>개인사업자 재무관리</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--night-text3)', opacity: 0.6 }}>© 2026 MONEY App</p>
        </div>
      </div>
    </aside>
  )
}

/* ══════════════════════════════
   모바일 하단 탭바 (나이트)
══════════════════════════════ */
export function MobileTabBar() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex"
      style={{
        background: 'rgba(11,13,20,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--night-border)',
        height: 'var(--nav-h)',
      }}
    >
      {navItems.map(item => {
        const Icon = item.icon
        const active = path === item.href || (item.href !== '/' && path.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
            style={{ color: active ? '#a99ff8' : 'var(--night-text3)' }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
              style={{ background: active ? 'rgba(124,111,224,0.18)' : 'transparent' }}
            >
              <Icon size={19} />
            </div>
            <span className="text-[10px] font-bold leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default DesktopSidebar

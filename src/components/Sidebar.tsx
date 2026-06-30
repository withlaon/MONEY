'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, BarChart3, Settings2, Wallet } from 'lucide-react'

const navItems = [
  { href: '/',             label: '대시보드',  icon: LayoutDashboard },
  { href: '/transactions', label: '거래내역',  icon: ArrowLeftRight  },
  { href: '/analysis',     label: '분석/비교', icon: BarChart3       },
  { href: '/settings',     label: '설정',      icon: Settings2       },
]

/* ══════════════════════════════
   데스크탑 사이드바
══════════════════════════════ */
export function DesktopSidebar() {
  const path = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--night-bg)',
        borderRight: '1px solid var(--night-border)',
        minHeight: '100vh',
      }}
    >
      {/* 로고 */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--night-border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c6fe0, #4f3fc9)',
              boxShadow: '0 4px 14px rgba(124,111,224,0.4)',
            }}>
            <Wallet size={17} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--night-text1)', lineHeight: 1.2 }}>MONEY</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--night-text3)', letterSpacing: '0.15em', marginTop: 2 }}>
              금전출납부
            </p>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const Icon   = item.icon
          const active = path === item.href || (item.href !== '/' && path.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 12,
                background: active ? 'rgba(124,111,224,0.15)' : 'transparent',
                border: `1px solid ${active ? 'rgba(124,111,224,0.25)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(124,111,224,0.25)' : 'rgba(255,255,255,0.05)',
                color: active ? '#a99ff8' : 'var(--night-text2)',
                flexShrink: 0,
              }}>
                <Icon size={16} />
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: active ? 800 : 700,
                color: active ? '#c4bffa' : 'var(--night-text2)',
                whiteSpace: 'nowrap',
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: 99, background: '#a99ff8', flexShrink: 0 }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--night-border)' }}>
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--night-border)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--night-text3)' }}>개인사업자 재무관리</p>
          <p style={{ fontSize: 10, marginTop: 3, color: 'var(--night-text3)', opacity: 0.5 }}>© 2026 MONEY App</p>
        </div>
      </div>
    </aside>
  )
}

/* ══════════════════════════════
   모바일 하단 탭바
══════════════════════════════ */
export function MobileTabBar() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex"
      style={{
        height: 'var(--nav-h)',
        background: 'rgba(12,14,23,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--night-border)',
      }}
    >
      {navItems.map(item => {
        const Icon   = item.icon
        const active = path === item.href || (item.href !== '/' && path.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 5,
              textDecoration: 'none',
              color: active ? '#a99ff8' : 'var(--night-text3)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? 'rgba(124,111,224,0.18)' : 'transparent',
            }}>
              <Icon size={18} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1 }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default DesktopSidebar

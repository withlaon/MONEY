import type { Metadata } from 'next'
import './globals.css'
import { DesktopSidebar, MobileTabBar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'MONEY — 금전출납부',
  description: '개인사업자를 위한 스마트 금전출납부',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="flex h-full overflow-hidden">
        {/* 나이트 사이드바 */}
        <DesktopSidebar />

        {/* 데이 본문 */}
        <main
          className="flex-1 overflow-y-auto min-w-0 main-scroll"
          style={{ background: 'var(--day-bg)' }}
        >
          {children}
        </main>

        {/* 모바일 탭바 */}
        <MobileTabBar />
      </body>
    </html>
  )
}

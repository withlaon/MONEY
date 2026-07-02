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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap" rel="stylesheet" />
      </head>
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

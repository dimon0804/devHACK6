import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { ToastContainer } from '@/components/ui/ToastContainer'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'FinTeen - Твоя первая финансовая стратегия',
  description: 'Платформа для изучения финансовой грамотности для детей через интерактивные игры',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <I18nProvider>
            {children}
            <CookieConsent />
            <ToastContainer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

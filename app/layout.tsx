import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import InstallPWA from '../components/InstallPWA'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'PawLog — Дневник здоровья вашего питомца',
  description: 'Удобный дневник здоровья питомцев. Следите за весом, прививками и визитами к врачу. Скачивайте PDF-отчеты.',
  openGraph: {
    title: 'PawLog — Дневник здоровья вашего питомца',
    description: 'Следите за здоровьем питомца в одном месте.',
    url: 'https://pawlog.app',
    siteName: 'PawLog',
    locale: 'ru_RU',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
        
        <InstallPWA />

        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(error) {
                      console.log('Service Worker registration failed:', error);
                    });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'PawLog — Дневник здоровья вашего питомца',
  description: 'Удобный дневник здоровья питомцев. Отслеживайте вес, прививки, расходы и визиты к ветеринару. Пробный период Premium бесплатно.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'PawLog' },
  openGraph: {
    title: 'PawLog — Дневник здоровья вашего питомца',
    description: 'Удобный дневник здоровья питомцев. Отслеживайте вес, прививки, расходы и визиты к ветеринару. Пробный период Premium бесплатно.',
    url: 'https://pawlog-aap.vercel.app', // Твой реальный URL
    siteName: 'PawLog',
    images: [
      {
        url: '/icon-512x512.png', // Мы используем иконку из твоего PWA-манифеста
        width: 512,
        height: 512,
        alt: 'PawLog - Дневник питомца',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PawLog — Дневник здоровья питомца',
    description: 'Отслеживайте здоровье питомца в одном месте.',
    images: ['/icon-512x512.png'],
  },
}

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Toaster position="top-right" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </body>
    </html>
  )
}

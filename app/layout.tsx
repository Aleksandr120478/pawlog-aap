import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'PawLog',
  description: 'Дневник здоровья вашего питомца',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PawLog',
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
      </body>
    </html>
  )
}

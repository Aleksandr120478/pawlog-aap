import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'PawLog',
  description: 'Дневник здоровья вашего питомца',
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

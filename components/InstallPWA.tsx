'use client'
import { useState } from 'react'

export default function InstallPWA() {
  // Принудительно ставим true
  const [isVisible, setIsVisible] = useState(true)

  const handleInstall = () => {
    alert('Тест кнопки прошел успешно!')
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[340px] print:hidden md:hidden">
      <div className="bg-rose-500 text-white backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sm">Тестовая кнопка</p>
          <p className="text-xs opacity-80">Если вы это видите, код на месте</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDismiss} className="text-white/80 hover:text-white px-2 text-xl">&times;</button>
          <button onClick={handleInstall} className="bg-white text-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold">Нажать</button>
        </div>
      </div>
    </div>
  )
}
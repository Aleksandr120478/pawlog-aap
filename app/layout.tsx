'use client'
import { useState } from 'react'

export default function InstallPWA() {
  const [showBanner, setShowBanner] = useState(true)

  if (!showBanner) return null

  return (
    <div style={{ position: 'fixed', top: '10px', left: '10px', right: '10px', zIndex: 999999, backgroundColor: 'red', color: 'white', padding: '20px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
      Я ТУТ! PWA КОМПОНЕНТ РАБОТАЕТ!
      <button onClick={() => setShowBanner(false)} style={{ marginLeft: '20px', background: 'black', color: 'white', padding: '5px 10px' }}>
        Закрыть
      </button>
    </div>
  )
}
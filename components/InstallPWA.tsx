'use client'
import { useState, useEffect } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Определяем платформу
    const ua = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))
    setIsAndroid(/android/.test(ua))

    // Ловим событие установки (только для Chrome/Android)
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true) // Показываем баннер, когда браузер разрешил установку
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Если приложение уже установлено, прячем баннер
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Для Android: вызываем нативное окно
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      // Для iOS: показываем инструкцию (или ничего, если баннер не нужен)
      // Здесь можно показать модалку с инструкцией
    }
  }

  if (!showBanner && !isIOS) return null

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 9999, background: '#333', color: '#fff', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>Установить PawLog</strong>
        <p style={{ fontSize: '12px', margin: 0 }}>{isIOS ? 'Нажмите «Поделиться» → «На экран «Домой»»' : 'Быстрый доступ с экрана'}</p>
      </div>
      {isAndroid && deferredPrompt && (
        <button onClick={handleInstallClick} style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Добавить
        </button>
      )}
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Если приложение уже установлено и открыто как PWA, не показываем
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!localStorage.getItem('pwa-dismissed')) {
        setIsVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Если через 2 секунды нативный промпт не пришел, но мы на телефоне — показываем сами
    const timer = setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && !localStorage.getItem('pwa-dismissed')) {
        setIsVisible(true)
      }
    }, 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Нативный установщик
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
      }
      setDeferredPrompt(null)
    } else {
      // Инструкция для iPhone или если браузер заблокировал установку
      alert('Чтобы установить приложение:\n\n1. Нажмите на три точки (или кнопку Поделиться) в браузере.\n2. Выберите "Установить приложение" или "Добавить на главный экран".')
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/50 p-4 animate-in slide-in-from-bottom duration-500 fade-in print:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-xl text-2xl animate-bounce">
            📱
          </div>
          <div>
            <p className="font-bold text-gray-800 dark:text-white text-sm">Установить PawLog</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Быстрый доступ с экрана</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 text-xl leading-none">&times;</button>
          <button onClick={handleInstall} className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-600 active:scale-95 transition">Установить</button>
        </div>
      </div>
    </div>
  )
}
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
    // Не показываем, если уже установлено
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    
    window.addEventListener('beforeinstallprompt', handler)

    // Таймер для показа (оставили для тестов на телефоне)
    const timer = setTimeout(() => {
      if (!localStorage.getItem('pwa-dismissed')) {
        setIsVisible(true)
      }
    }, 2500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsVisible(false)
      setDeferredPrompt(null)
    } else {
      alert('Чтобы установить приложение:\n\n1. Нажмите на три точки (или кнопку Поделиться).\n2. Выберите "Установить приложение" или "Добавить на главный экран".')
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    // Класс md:hidden скрывает кнопку на компьютерах, оставляя только на мобильных
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[340px] animate-in slide-in-from-bottom-8 duration-500 ease-out fade-in print:hidden md:hidden">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 dark:bg-rose-900/30 p-2.5 rounded-xl text-rose-500 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm leading-tight">Установить PawLog</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Быстрый доступ с экрана</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 text-lg leading-none transition-colors">
            &times;
          </button>
          <button onClick={handleInstall} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-rose-600 active:scale-95 transition-all shadow-sm">
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}
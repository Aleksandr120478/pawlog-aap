'use client'
import { useState, useEffect } from 'react'

// Создаем интерфейс для Safari, чтобы TypeScript знал про свойство standalone
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

// Создаем интерфейс для события установки (чтобы не использовать any)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const nav = window.navigator as NavigatorWithStandalone;
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    setIsStandalone(isAppStandalone)

    const ua = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }
    
    window.addEventListener('beforeinstallprompt', handler)

    if (!isAppStandalone && /iphone|ipad|ipod/.test(ua)) {
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShowBanner(false)
      setDeferredPrompt(null)
    } else if (isIOS) {
      alert("Нажмите кнопку «Поделиться» (квадрат со стрелкой) и выберите «На экран Домой».")
    } else {
      alert("Нажмите на три точки в браузере и выберите 'Установить приложение'.")
    }
  }

  if (isStandalone || !showBanner) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-700 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-2xl shadow-inner">🐾</div>
          <div>
            <h3 className="font-bold text-sm">Установить PawLog</h3>
            <p className="text-xs text-gray-400 mt-0.5">Быстрый доступ с экрана</p>
          </div>
        </div>
        <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-white transition">✕</button>
      </div>
      <button onClick={handleInstallClick} className="bg-rose-500 hover:bg-rose-600 text-white w-full py-2.5 rounded-xl font-medium transition">
        {isIOS ? 'Как установить?' : 'Добавить на экран'}
      </button>
    </div>
  )
}
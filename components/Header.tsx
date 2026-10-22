'use client'
import toast from 'react-hot-toast'

export default function Header({ isDark, toggleTheme, session, hasPremiumAccess, onOpenPremium, onOpenSettings, onLogout }: any) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🐾 PawLog</h1>
      <div className="flex items-center gap-4">
        {!hasPremiumAccess && (
          <button onClick={onOpenPremium} className="hidden sm:block text-xs bg-gradient-to-r from-rose-500 to-orange-400 text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition shadow-sm">Получить Premium</button>
        )}
        <button onClick={toggleTheme} className="text-xl p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:scale-110 transition" title="Сменить тему">{isDark ? '☀️' : '🌙'}</button>
        <span onClick={onOpenSettings} className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline cursor-pointer hover:text-rose-500 transition underline decoration-dashed underline-offset-4" title="Настройки профиля">{session?.user?.email}</span>
        <button onClick={onLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition">Выйти</button>
      </div>
    </header>
  )
}

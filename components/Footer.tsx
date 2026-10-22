'use client'
import toast from 'react-hot-toast'

export default function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 print:hidden">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
        <div className="flex gap-6">
          <button onClick={() => toast.success('Здесь будет Политика конфиденциальности')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 transition">Политика конфиденциальности</button>
          <button onClick={() => toast.success('Здесь будет Оферта')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 transition">Оферта</button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">© {new Date().getFullYear()} PawLog. Все права защищены.</p>
      </div>
    </footer>
  )
}

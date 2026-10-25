import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
      <div className="text-8xl mb-6 animate-bounce">🐾</div>
      <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Страница убежала</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Похоже, эта страница потерялась, как котенок в большом доме. Но не переживайте, ваш питомец в безопасности.
      </p>
      <Link 
        href="/" 
        className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-500/30 active:scale-95"
      >
        Вернуться на главную
      </Link>
    </div>
  )
}
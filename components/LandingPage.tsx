'use client'
import toast from 'react-hot-toast'
import AuthForm from './AuthForm'

export default function LandingPage({ isDark, toggleTheme }: { isDark: boolean, toggleTheme: () => void }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F5] transition-colors duration-200">
      <div className="flex-1 relative flex flex-col justify-center px-8 py-16 md:px-16 lg:px-24 bg-gradient-to-br from-yellow-100 via-orange-200 to-rose-200 text-gray-900 overflow-hidden min-h-[50vh] lg:min-h-screen">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-60"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl opacity-40"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-orange-200 px-4 py-2 rounded-full text-sm font-semibold mb-8 text-orange-600">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            Создано с заботой о питомцах
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-gray-900">
            Забота, которая <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">дарит спокойствие</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-800 mb-10 max-w-lg leading-relaxed font-medium">
            PawLog — ваш личный помощник. Следите за весом, прививками и визитами к врачу. Скачивайте красивые PDF-отчеты в один клик. Ни одна важная дата не будет забыта.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
              <div className="bg-orange-100 p-2 rounded-xl text-2xl">📅</div>
              <div>
                <h3 className="font-bold text-gray-800">Календарь</h3>
                <p className="text-sm text-gray-600">Все события по дням</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
              <div className="bg-orange-100 p-2 rounded-xl text-2xl">📄</div>
              <div>
                <h3 className="font-bold text-gray-800">PDF-отчеты</h3>
                <p className="text-sm text-gray-600">Для ветеринара</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
              <div className="bg-orange-100 p-2 rounded-xl text-2xl">📸</div>
              <div>
                <h3 className="font-bold text-gray-800">Документы</h3>
                <p className="text-sm text-gray-600">Анализы и справки</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
              <div className="bg-orange-100 p-2 rounded-xl text-2xl">🔔</div>
              <div>
                <h3 className="font-bold text-gray-800">Напоминания</h3>
                <p className="text-sm text-gray-600">Прививки и таблетки</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-orange-200/50 w-full max-w-md border border-orange-100 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Добро пожаловать</h2>
              <p className="text-gray-500 mt-2 text-sm">Войдите, чтобы продолжить заботу о любимце.</p>
            </div>
          </div>
          
          <AuthForm />
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-2">
            <div className="flex gap-4">
              <button onClick={() => toast.success('Здесь будет Политика конфиденциальности')} className="text-xs text-gray-400 hover:text-orange-500 transition">Политика конфиденциальности</button>
              <button onClick={() => toast.success('Здесь будет Оферта')} className="text-xs text-gray-400 hover:text-orange-500 transition">Оферта</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import React from 'react'
import AuthForm from './AuthForm'

interface LandingPageProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export default function LandingPage({ isDark, toggleTheme }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Левая часть - Промо */}
      <div className="flex-1 bg-gradient-to-br from-orange-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 p-8 md:p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden">
        
        {/* Переключатель темы в углу */}
        <button 
          onClick={toggleTheme} 
          className="absolute top-6 right-6 p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-700 transition z-10"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="max-w-lg mx-auto md:mx-0 z-10">
          <div className="inline-block bg-white dark:bg-gray-800 text-rose-500 font-medium px-4 py-1.5 rounded-full text-sm mb-6 shadow-sm">
            <span className="mr-2">🟢</span> Создано с заботой о питомцах
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Забота, которая <br/>
            <span className="text-rose-500">дарит спокойствие</span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            PawLog — ваш личный помощник. Следите за весом, прививками и визитами к врачу. Скачивайте красивые PDF-отчеты в один клик. Ни одна важная дата не будет забыта.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-2xl backdrop-blur-sm border border-white/40 dark:border-gray-700">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Календарь</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Все события по дням</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-2xl backdrop-blur-sm border border-white/40 dark:border-gray-700">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">PDF-отчеты</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Для ветеринара</p>
            </div>
          </div>
        </div>
      </div>

      {/* Правая часть - Форма входа */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Передаем isDark в форму! */}
          <AuthForm isDark={isDark} />
        </div>
      </div>

    </div>
  )
}
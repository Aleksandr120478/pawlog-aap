'use client'
import React from 'react'
import AuthForm from './AuthForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 transition-colors duration-300">
      
      {/* Левая часть - Промо */}
      <div className="flex-1 bg-gradient-to-br from-orange-50 to-rose-50 p-8 md:p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden">
        
        <div className="max-w-lg mx-auto md:mx-0 z-10">
          <div className="inline-block bg-white text-rose-500 font-medium px-4 py-1.5 rounded-full text-sm mb-6 shadow-sm">
            <span className="mr-2">🟢</span> Создано с заботой о питомцах
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Забота, которая <br/>
            <span className="text-rose-500">дарит спокойствие</span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            PawLog — ваш личный помощник. Следите за весом, прививками и визитами к врачу. Скачивайте красивые PDF-отчеты в один клик. Ни одна важная дата не будет забыта.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/60 p-4 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold text-gray-800">Календарь</h3>
              <p className="text-xs text-gray-500 mt-1">Все события по дням</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-semibold text-gray-800">PDF-отчеты</h3>
              <p className="text-xs text-gray-500 mt-1">Для ветеринара</p>
            </div>
          </div>
        </div>
      </div>

      {/* Правая часть - Форма входа */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>

    </div>
  )
}
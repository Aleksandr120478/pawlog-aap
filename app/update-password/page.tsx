// app/update-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Проверяем, есть ли сессия (Supabase автоматически создает её при переходе по ссылке из письма)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCheckingSession(false)
    })
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      return toast.error('Пароль должен быть минимум 6 символов', { id: 'pass-err' })
    }
    setLoading(true)
    
    const { error } = await supabase.auth.updateUser({ password })
    
    setLoading(false)
    if (error) {
      toast.error(error.message, { id: 'pass-err' })
    } else {
      toast.success('Пароль успешно изменен!', { id: 'pass-ok' })
      router.push('/')
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">Смена пароля</h1>
        
        {!session ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-500 font-medium">Ссылка для сброса пароля недействительна или устарела.</p>
            <Link href="/" className="inline-block bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition">
              Вернуться на главную
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Введите новый пароль</label>
              <input 
                id="new-password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-200 outline-none"
                placeholder="Минимум 6 символов"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-rose-500 text-white py-2 rounded-lg font-medium hover:bg-rose-600 transition disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-rose-500 hover:underline">Отмена</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
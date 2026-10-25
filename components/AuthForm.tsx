'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

interface AuthFormProps {
  isDark: boolean;
}

export default function AuthForm({ isDark }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isForgot) {
      // Логика восстановления пароля
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) toast.error(error.message, { id: 'auth-err' })
      else {
        toast.success('Письмо для сброса пароля отправлено на вашу почту!', { id: 'auth-success' })
        setIsForgot(false)
      }
    } else if (isLogin) {
      // Логика входа
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error('Неверный email или пароль', { id: 'auth-err' })
    } else {
      // Логика регистрации
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) toast.error(error.message, { id: 'auth-err' })
      else toast.success('Регистрация успешна! Проверьте почту для подтверждения.', { id: 'auth-success' })
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md p-8 bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isForgot ? 'Восстановление' : isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isForgot ? 'Введите email, и мы вышлем ссылку для сброса' : isLogin ? 'Войдите, чтобы продолжить заботу о любимце.' : 'Начните вести дневник здоровья питомца.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition"
            required 
          />
        </div>
        
        {!isForgot && (
          <div>
            <input 
              type="password" 
              placeholder="Пароль" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition"
              required 
              minLength={6}
            />
          </div>
        )}

        {isLogin && !isForgot && (
          <div className="text-right">
            <button 
              type="button" 
              onClick={() => setIsForgot(true)} 
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              Забыли пароль?
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 shadow-lg shadow-blue-500/30"
        >
          {loading ? 'Загрузка...' : isForgot ? 'Отправить ссылку' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {isForgot ? (
          <button onClick={() => setIsForgot(false)} className="text-rose-500 hover:underline">
            Вернуться ко входу
          </button>
        ) : (
          <>
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-rose-500 hover:underline font-medium">
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
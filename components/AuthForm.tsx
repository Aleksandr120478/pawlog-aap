'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Перехватываем код из ссылки и сохраняем
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    if (refCode) {
      localStorage.setItem('pending_referral', refCode)
      toast.success('Реферальный код приглашения применен!', { id: 'ref-code' })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!captchaToken) {
      return toast.error('Пожалуйста, дождитесь проверки капчи', { id: 'captcha-err' })
    }

    setLoading(true)

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
        captchaToken,
      })
      if (error) toast.error(error.message, { id: 'auth-err' })
      else {
        toast.success('Письмо для сброса пароля отправлено на вашу почту!', { id: 'auth-success' })
        setIsForgot(false)
      }
    } else if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken } 
      })
      if (error) toast.error(error.message, { id: 'auth-err' })
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          captchaToken,
          emailRedirectTo: `${window.location.origin}/`
        } 
      })
      
      if (error) {
        toast.error(error.message, { id: 'auth-err' })
      } else {
        toast.success('Регистрация успешна! Проверьте почту для подтверждения.', { id: 'auth-success' })
      }
    }
    
    turnstileRef.current?.reset()
    setCaptchaToken('')
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isForgot ? 'Восстановление' : isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
        </h2>
        <p className="text-sm text-gray-500">
          {isForgot ? 'Введите email, и мы вышлем ссылку для сброса' : isLogin ? 'Войдите, чтобы продолжить заботу о любимце.' : 'Начните вести дневник здоровья питомца.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input 
            id="email"
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none transition"
            required 
          />
        </div>
        
        {!isForgot && (
          <div>
            <label htmlFor="password" className="sr-only">Пароль</label>
            <input 
              id="password"
              type="password" 
              placeholder="Пароль" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none transition"
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

        <div className="flex justify-center py-2">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            onSuccess={(token: string) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
            options={{
              theme: 'light',
              language: 'ru',
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 shadow-lg shadow-blue-500/30"
        >
          {loading ? 'Загрузка...' : isForgot ? 'Отправить ссылку' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
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
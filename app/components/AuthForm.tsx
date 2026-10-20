'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) toast.error(error.message)
      else toast.success('Готово! Проверьте почту.')
    }
    setBusy(false)
  }

  async function handleResetPassword() {
    if (!email) return toast.error('Введите Email')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) toast.error(error.message)
    else toast.success('Ссылка для сброса пароля отправлена!')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
      <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" minLength={6} required />
      
      <button type="submit" disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition">
        {busy ? 'Подождите...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
      </button>
      
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        {isLogin && (
          <button type="button" onClick={handleResetPassword} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 transition">
            Забыли пароль?
          </button>
        )}
        <button type="button" onClick={() => { setIsLogin(!isLogin); setPassword('') }} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </form>
  )
}

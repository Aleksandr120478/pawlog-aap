'use client'
import toast from 'react-hot-toast'

export function ShareModal({ isOpen, onClose, shareEmail, setShareEmail, onSubmit, petShares, removeShare }: any) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-100 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Поделиться доступом</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Члены семьи смогут видеть и редактировать дневник этого питомца.</p>
        
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Уже имеют доступ:</h3>
          {petShares.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Пока никого нет</p>
          ) : (
            <ul className="space-y-2 max-h-[20vh] overflow-y-auto pr-1">
              {petShares.map((share: any) => (
                <li key={share.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{share.shared_with_email}</span>
                  <button onClick={() => removeShare(share.id)} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 transition">Отозвать</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">Добавить нового члена семьи:</h3>
          <input type="email" placeholder="Email (например, husband@mail.ru)" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none" required />
          <button type="submit" className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">Пригласить</button>
        </form>
      </div>
    </div>
  )
}

export function PremiumModal({ isOpen, onClose, isPremium, trialDaysLeft, startFreeTrial, billingPeriod, setBillingPeriod }: any) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
        <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-8 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-2">PawLog Premium</h2>
          <p className="text-rose-100">Снимите все ограничения</p>
        </div>
        <div className="p-6 md:p-8">
          <ul className="space-y-3 mb-6 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-3">✨ <b>Безлимитные питомцы</b> (вместо 2)</li>
            <li className="flex items-center gap-3">✨ <b>Безлимитные записи</b> (вместо 30)</li>
            <li className="flex items-center gap-3">✨ Автоматические графики прививок</li>
            <li className="flex items-center gap-3">✨ Приоритетная поддержка</li>
          </ul>
          {trialDaysLeft === null && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-3">Не уверены? Попробуйте все функции бесплатно!</p>
              <button onClick={startFreeTrial} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition shadow-md shadow-green-500/30">Попробовать 7 дней бесплатно</button>
            </div>
          )}
          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">Или оформите подписку</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
            <button onClick={() => setBillingPeriod('monthly')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${billingPeriod === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Помесячно</button>
            <button onClick={() => setBillingPeriod('annual')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1 ${billingPeriod === 'annual' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>На год <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded">-33%</span></button>
          </div>
          <div className="text-center mb-6">
            {billingPeriod === 'monthly' ? (<><span className="text-4xl font-bold text-gray-900 dark:text-white">149 ₽</span><span className="text-gray-500 dark:text-gray-400"> / мес</span></>) : (<><span className="text-4xl font-bold text-gray-900 dark:text-white">1190 ₽</span><span className="text-gray-500 dark:text-gray-400"> / год</span><p className="text-xs text-green-500 mt-1 font-medium">Экономия 598 ₽ в год</p></>)}
          </div>
          <button onClick={() => { toast.success('Здесь будет оплата!'); onClose(); }} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">Оплатить</button>
        </div>
      </div>
    </div>
  )
}

export function SettingsModal({ isOpen, onClose, session, isPremium, trialDaysLeft, newPassword, setNewPassword, updatePassword, updatingPassword }: any) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 relative p-6 md:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Настройки профиля</h2>
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ваш Email:</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{session?.user?.email}</p>
        </div>
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800">
          <p className="text-sm text-rose-800 dark:text-rose-300 font-medium mb-1">Ваш тариф:</p>
          <p className="text-lg font-bold text-rose-900 dark:text-rose-200">{isPremium ? 'Premium (Навсегда)' : (trialDaysLeft && trialDaysLeft > 0 ? `Пробный период (${trialDaysLeft} дн.)` : 'Бесплатный')}</p>
        </div>
        <form onSubmit={updatePassword} className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Сменить пароль</p>
          <input type="password" placeholder="Новый пароль (мин. 6 символов)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none" required minLength={6} />
          <button type="submit" disabled={updatingPassword} className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition disabled:opacity-60">{updatingPassword ? 'Сохранение...' : 'Обновить пароль'}</button>
        </form>
      </div>
    </div>
  )
}

'use client'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

export function ShareModal() {
  const isOpen = useAppStore(state => state.showShareModal)
  const onClose = () => useAppStore.getState().setShowShareModal(false)
  const shareEmail = useAppStore(state => state.shareEmail)
  const setShareEmail = useAppStore(state => state.setShareEmail)
  const onSubmit = useAppStore(state => state.handleShare)
  const petShares = useAppStore(state => state.petShares)
  const removeShare = useAppStore(state => state.removeShare)

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
              {petShares.map((share) => (
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

export function PremiumModal() {
  const isOpen = useAppStore(state => state.showPremiumModal)
  const onClose = () => useAppStore.getState().setShowPremiumModal(false)
  const trialDaysLeft = useAppStore(state => state.trialDaysLeft)
  const startFreeTrial = useAppStore(state => state.startFreeTrial)
  const billingPeriod = useAppStore(state => state.billingPeriod)
  const setBillingPeriod = useAppStore(state => state.setBillingPeriod)
  const onPay = useAppStore(state => state.handleMockPayment)

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
            <li className="flex items-center gap-3">✨ <b>Безлимитные записи</b> (вместо 20)</li>
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
          <button onClick={onPay} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">Оплатить</button>
        </div>
      </div>
    </div>
  )
}

export function SettingsModal() {
  const isOpen = useAppStore(state => state.showSettingsModal)
  const onClose = () => useAppStore.getState().setShowSettingsModal(false)
  const session = useAppStore(state => state.session)
  const isPremium = useAppStore(state => state.isPremium)
  const trialDaysLeft = useAppStore(state => state.trialDaysLeft)
  const newPassword = useAppStore(state => state.newPassword)
  const setNewPassword = useAppStore(state => state.setNewPassword)
  const updatePassword = useAppStore(state => state.updatePassword)
  const updatingPassword = useAppStore(state => state.updatingPassword)
  const onDeleteAccount = useAppStore(state => state.handleDeleteAccount)
  const referralCode = useAppStore(state => state.referralCode)

  if (!isOpen) return null

  const referralLink = typeof window !== 'undefined' && referralCode 
    ? `${window.location.origin}/?ref=${referralCode}` 
    : 'Загрузка...'

  const copyToClipboard = () => {
    if (referralCode && typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode}`)
      toast.success('Ссылка скопирована!')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 relative p-6 md:p-8 max-h-[90vh] overflow-y-auto">
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

        {/* БЛОК РЕФЕРАЛЬНОЙ ПРОГРАММЫ */}
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">🎁 Пригласите друга</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3">Подарите другу 30 дней Premium, и получите 30 дней в подарок!</p>
          <div className="flex gap-2">
            <input type="text" readOnly value={referralLink} className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-500" />
            <button onClick={copyToClipboard} className="bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-600 shrink-0 transition">Копировать</button>
          </div>
        </div>

        <form onSubmit={updatePassword} className="space-y-4 mb-8">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Сменить пароль</p>
          <input type="password" placeholder="Новый пароль (мин. 6 символов)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none" required minLength={6} />
          <button type="submit" disabled={updatingPassword} className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition disabled:opacity-60">{updatingPassword ? 'Сохранение...' : 'Обновить пароль'}</button>
        </form>

        <div className="pt-4 border-t border-red-200 dark:border-red-900/50">
          <p className="text-xs text-red-500 mb-2 font-medium">Опасная зона</p>
          <button onClick={onDeleteAccount} className="w-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 py-3 rounded-xl font-medium transition">
            Удалить аккаунт навсегда
          </button>
        </div>
      </div>
    </div>
  )
}

export function DocumentViewerModal() {
  const doc = useAppStore(state => state.viewingDocument)
  const setViewingDocument = useAppStore(state => state.setViewingDocument)

  if (!doc) return null

  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.url)
  const isPdf = /\.pdf$/i.test(doc.url)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          <h3 className="font-bold text-gray-800 dark:text-white truncate pr-4">{doc.name}</h3>
          <button onClick={() => setViewingDocument(null)} className="text-gray-500 hover:text-red-500 text-2xl leading-none transition">&times;</button>
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-auto p-4 flex justify-center">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.url} alt={doc.name} className="max-w-full max-h-full object-contain rounded" />
          ) : isPdf ? (
            <iframe src={doc.url} className="w-full h-full border-none rounded" title={doc.name} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4">Предпросмотр недоступен для этого формата.</p>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Открыть в новой вкладке</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
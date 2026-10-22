'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import LandingPage from '../components/LandingPage'
import CalendarModal from '../components/CalendarModal'
import { ShareModal, PremiumModal, SettingsModal } from '../components/AppModals'
import { RECORD_LABELS, SPECIES_ICONS } from '../components/types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePets } from '../hooks/usePets'
import { useRecords } from '../hooks/useRecords'

function todayLocal() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--; months += 12;
  }
  if (years === 0 && months === 0) return 'Меньше месяца';
  return `${years > 0 ? years + ' г. ' : ''}${months > 0 ? months + ' мес.' : ''}`.trim();
}

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  
  const [dashboardTab, setDashboardTab] = useState<'list' | 'docs'>('list')
  const [showPremiumModal, setShowPremiumModal] = useState(false) 
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(todayLocal())
  const [petShares, setPetShares] = useState<any[]>([])
  const [shareEmail, setShareEmail] = useState('')
  const [sharingPetId, setSharingPetId] = useState<string | null>(null)
  
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [isPremium, setIsPremium] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const hasPremiumAccess = isPremium || (trialDaysLeft !== null && trialDaysLeft > 0)

  const {
    pets, setPets, selectedPetId, setSelectedPetId, selectedPet, savingPet, ownedPetsCount,
    fetchPets, editingPetId, petName, setPetName, petSpecies, setPetSpecies, petBreed, setPetBreed,
    petBirthDate, setPetBirthDate, petFile, setPetFile, petAllergies, setPetAllergies, 
    petChronic, setPetChronic, petFood, setPetFood, petVet, setPetVet, 
    startEditingPet, resetPetForm, savePet, deletePet
  } = usePets(session, hasPremiumAccess, () => setShowPremiumModal(true))

  // ДОБАВЛЕНО setEditingRecordId В ДЕСТРУКТУРИЗАЦИЮ
  const {
    records, documents, savingRecord, editingRecordId, setEditingRecordId, 
    recordType, setRecordType, recordValue, setRecordValue, recordDate, setRecordDate, recordNote, setRecordNote,
    recordNextDate, setRecordNextDate, startEditingRecord, resetRecordForm, saveRecord,
    deleteRecord, addVaccineTemplates, uploadDocument, deleteDocument,
    totalExpenses, upcomingEvents, weightData
  } = useRecords(selectedPetId, selectedPet, hasPremiumAccess, () => setShowPremiumModal(true))

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true); document.documentElement.classList.add('dark')
    } else {
      setIsDark(false); document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); setIsDark(false)
    } else {
      document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); setIsDark(true)
    }
  }

  const fetchUserStatus = useCallback(async (userId: string) => {
    let { data, error } = await supabase.from('user_status').select('*').eq('user_id', userId).single()
    if (error && error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase.from('user_status').insert({ user_id: userId }).select().single()
      if (!insertError) data = newData
    }
    if (data) {
      setIsPremium(data.is_premium || false)
      if (data.trial_ends_at) {
        setTrialEndsAt(data.trial_ends_at)
        const end = new Date(data.trial_ends_at).getTime()
        const now = new Date().getTime()
        const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
        setTrialDaysLeft(days > 0 ? days : 0)
      }
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchPets()
        fetchUserStatus(session.user.id)
        setLoading(false)
      }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) {
        fetchPets()
        fetchUserStatus(session.user.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [fetchPets, fetchUserStatus])

  async function fetchPetShares(petId: string) {
    const { data } = await supabase.from('pet_shares').select('*').eq('pet_id', petId)
    setPetShares(data || [])
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    const cleanEmail = shareEmail.trim().toLowerCase();
    if (!cleanEmail || !sharingPetId) return toast.error('Введите email')
    if (cleanEmail === session.user.email.toLowerCase()) return toast.error('Вы не можете поделиться с самим собой')
    
    const toastId = toast.loading('Отправка приглашения...')
    const { data: existing } = await supabase.from('pet_shares').select('id').eq('pet_id', sharingPetId).eq('shared_with_email', cleanEmail).single()
    
    if (existing) return toast.error('Этот пользователь уже имеет доступ', { id: toastId })

    const { error } = await supabase.from('pet_shares').insert({ pet_id: sharingPetId, shared_with_email: cleanEmail })
    if (error) toast.error(error.message, { id: toastId })
    else {
      toast.success('Доступ предоставлен!', { id: toastId })
      setShareEmail('')
      fetchPetShares(sharingPetId)
    }
  }

  async function removeShare(shareId: string) {
    if (!sharingPetId) return
    const { error } = await supabase.from('pet_shares').delete().eq('id', shareId)
    if (error) toast.error(error.message)
    else {
      toast.success('Доступ отозван')
      fetchPetShares(sharingPetId)
    }
  }

  function openShareModal(petId: string) {
    setSharingPetId(petId)
    setShareEmail('')
    fetchPetShares(petId)
    setShowShareModal(true)
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) return toast.error('Пароль должен быть минимум 6 символов')
    setUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setUpdatingPassword(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Пароль успешно изменен!')
      setNewPassword('')
      setShowSettingsModal(false)
    }
  }

  function exportToCSV() {
    if (!selectedPet || records.length === 0) return;
    const headers = ['Дата', 'Тип', 'Значение', 'Заметка', 'Следующее напоминание'];
    const rows = records.map(r => [
      r.record_date, RECORD_LABELS[r.type] || r.type, r.value,
      `"${(r.note || '').replace(/"/g, '""')}"`, r.next_date || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedPet.name}_История.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Файл Excel успешно скачан!');
  }

  async function startFreeTrial() {
    if (!session) return
    const toastId = toast.loading('Активация Premium...')
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)
    const { error } = await supabase.from('user_status').update({ trial_ends_at: trialEnd.toISOString() }).eq('user_id', session.user.id)
    if (error) toast.error(error.message, { id: toastId })
    else {
      toast.success('Пробный период на 7 дней активирован!', { id: toastId })
      setShowPremiumModal(false)
      fetchUserStatus(session.user.id)
    }
  }

  function handleAddFromCalendar(date: string) {
    setEditingRecordId(null) // Теперь эта функция есть!
    setRecordType('weight')
    setRecordValue('')
    setRecordNote('')
    setRecordNextDate('')
    setRecordDate(date)
    setShowCalendarModal(false)
    setDashboardTab('list')
    
    setTimeout(() => {
      document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    toast.success(`Дата подставлена: ${date}`)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPets([]); setSelectedPetId(null); resetPetForm(); resetRecordForm()
    setIsPremium(false); setTrialEndsAt(null); setTrialDaysLeft(null)
  }

  function getReminderStatus(nextDate: string | null) {
    if (!nextDate) return null;
    const today = new Date(todayLocal()); const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: '⚠️ Просрочено!', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (diffDays <= 7) return { text: `⏰ Через ${diffDays} дн.`, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
    return { text: `📅 ${nextDate}`, color: 'text-gray-500 dark:text-gray-400' };
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 dark:bg-gray-900">Загрузка...</div>

  if (!session) {
    return <LandingPage isDark={isDark} toggleTheme={toggleTheme} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200 print:bg-white print:text-black">
      
      <div className="flex-1">
        {showCalendarModal && (
          <CalendarModal 
            records={records} selectedDate={calendarSelectedDate}
            onDayClick={setCalendarSelectedDate} onAddClick={handleAddFromCalendar}
            onClose={() => setShowCalendarModal(false)}
          />
        )}

        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center py-2 text-sm font-medium print:hidden flex justify-center items-center gap-2 shadow-sm">
            <span>✨ У вас активен Premium (Пробный период)! Осталось дней: {trialDaysLeft}</span>
            <button onClick={() => setShowPremiumModal(true)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition">Продлить</button>
          </div>
        )}

        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} shareEmail={shareEmail} setShareEmail={setShareEmail} onSubmit={handleShare} petShares={petShares} removeShare={removeShare} />
        
        <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} isPremium={isPremium} trialDaysLeft={trialDaysLeft} startFreeTrial={startFreeTrial} billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} />
        
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} session={session} isPremium={isPremium} trialDaysLeft={trialDaysLeft} newPassword={newPassword} setNewPassword={setNewPassword} updatePassword={updatePassword} updatingPassword={updatingPassword} />

        <Header 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          session={session} 
          hasPremiumAccess={hasPremiumAccess} 
          onOpenPremium={() => setShowPremiumModal(true)} 
          onOpenSettings={() => setShowSettingsModal(true)} 
          onLogout={handleLogout} 
        />

        <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
          
          <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">Мои питомцы</h2>
              {!hasPremiumAccess && <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded-full font-medium">Лимит: {ownedPetsCount}/2</span>}
            </div>
            <div className="space-y-2 mb-4">
              {pets.length === 0 ? (
                <div className="text-center p-6 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-dashed border-rose-200 dark:border-rose-800 mb-2">
                  <span className="text-4xl mb-2 block">{SPECIES_ICONS[petSpecies] || '🐾'}</span>
                  <p className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">Шаг 1. Добавьте питомца</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">Заполните форму ниже.</p>
                  <div className="text-2xl animate-bounce mt-2">↓</div>
                </div>
              ) : (
                pets.map(pet => {
                  const isOwner = pet.user_id === session.user.id;
                  return (
                    <div key={pet.id} onClick={() => setSelectedPetId(pet.id)} className={`flex items-center rounded-xl transition cursor-pointer ${selectedPetId === pet.id ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 border' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}>
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden ml-3 shrink-0">
                        {pet.avatar_url ? <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" /> : <span className="text-lg">🐾</span>}
                      </div>
                      <div className="flex-1 text-left px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-100 block">{pet.name}</span>
                          {!isOwner && <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded">Совместный</span>}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{pet.species} {pet.breed ? `• ${pet.breed}` : ''} {pet.birth_date ? `• ${calculateAge(pet.birth_date)}` : ''}</span>
                      </div>
                      <div className="flex gap-1 pr-2">
                        {isOwner && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); openShareModal(pet.id); }} className="p-1 text-gray-300 hover:text-purple-500 transition" title="Поделиться">🔗</button>
                            <button onClick={(e) => { e.stopPropagation(); startEditingPet(pet); }} className="p-1 text-gray-300 hover:text-rose-500 transition" title="Редактировать">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); deletePet(pet.id); }} className="p-1 text-gray-300 hover:text-red-500 transition" title="Удалить">×</button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <form onSubmit={savePet} className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{editingPetId ? 'Редактировать профиль' : 'Добавить питомца'}</p>
              <input type="text" placeholder="Имя питомца" value={petName} onChange={e => setPetName(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-200 outline-none" />
              <div className="flex gap-2">
                <select value={petSpecies} onChange={e => setPetSpecies(e.target.value)} className="w-1/2 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <optgroup label="Популярные"><option>Собака</option><option>Кошка</option></optgroup>
                  <optgroup label="Грызуны"><option>Хомяк</option><option>Кролик</option><option>Морская свинка</option><option>Крыса</option><option>Шиншилла</option></optgroup>
                  <optgroup label="Птицы"><option>Попугай</option><option>Канарейка</option></optgroup>
                  <optgroup label="Экзотика"><option>Хорёк</option><option>Черепаха</option><option>Ящерица</option><option>Змея</option><option>Ёжик</option></optgroup>
                  <optgroup label="Другое"><option>Рыбка</option><option>Другое</option></optgroup>
                </select>
                <input type="text" placeholder="Порода" value={petBreed} onChange={e => setPetBreed(e.target.value)} className="w-1/2 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-200 outline-none" />
              </div>
              <input type="date" value={petBirthDate} onChange={e => setPetBirthDate(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300" />
              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2 mt-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Медицинская карта</p>
                <input type="text" placeholder="Аллергии" value={petAllergies} onChange={e => setPetAllergies(e.target.value)} className="w-full px-2 py-1.5 border dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <input type="text" placeholder="Хронические болезни" value={petChronic} onChange={e => setPetChronic(e.target.value)} className="w-full px-2 py-1.5 border dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <input type="text" placeholder="Корм / Диета" value={petFood} onChange={e => setPetFood(e.target.value)} className="w-full px-2 py-1.5 border dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <input type="text" placeholder="Контакт ветеринара" value={petVet} onChange={e => setPetVet(e.target.value)} className="w-full px-2 py-1.5 border dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="text-sm pt-2">
                <label className="block text-gray-500 dark:text-gray-400 mb-1 text-xs">{editingPetId ? 'Новое фото' : 'Фото питомца'}</label>
                <input type="file" accept="image/*" onChange={e => setPetFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rose-50 dark:file:bg-gray-600 file:text-rose-700 dark:file:text-white hover:file:bg-rose-100" />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" disabled={savingPet} className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${editingPetId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                  {savingPet ? 'Сохранение...' : editingPetId ? 'Обновить' : `${SPECIES_ICONS[petSpecies] || '🐾'} Добавить`}
                </button>
                {editingPetId && <button type="button" onClick={resetPetForm} className="px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-300">Отмена</button>}
              </div>
            </form>
          </section>

          <section id="record-form" className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{editingRecordId ? 'Редактировать запись' : 'Новая запись'}</h2>
            </div>
            {selectedPet ? (
              <form onSubmit={saveRecord} className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Для: <span className="font-medium text-gray-700 dark:text-gray-200">{selectedPet.name}</span></p>
                  {!hasPremiumAccess && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">Лимит: {records.length}/20</span>}
                </div>
                {(selectedPet.species === 'Собака' || selectedPet.species === 'Кошка') && !editingRecordId && (
                  <button type="button" onClick={addVaccineTemplates} className="w-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs py-2 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center justify-center gap-1 font-medium">🪄 Добавить график прививок</button>
                )}
                <select value={recordType} onChange={e => setRecordType(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="weight">Вес (кг)</option>
                  <option value="vaccine">Прививка</option>
                  <option value="medication">Лекарство</option>
                  <option value="expense">Расход (₽)</option>
                  <option value="note">Заметка (Дневник)</option>
                </select>
                <input type="text" placeholder={recordType === 'weight' ? 'Например, 12.5' : recordType === 'expense' ? 'Сумма (например, 1500)' : recordType === 'note' ? 'Что случилось?' : 'Название'} value={recordValue} onChange={e => setRecordValue(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Дата события</label>
                  <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                {(recordType === 'vaccine' || recordType === 'medication') && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-800/50">
                    <label className="block text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Напоминание (Email)</label>
                    <input type="date" value={recordNextDate} onChange={e => setRecordNextDate(e.target.value)} className="w-full px-3 py-2 border border-orange-200 dark:border-orange-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                )}
                {recordType !== 'note' && (
                  <textarea placeholder="Заметка (необязательно)" value={recordNote} onChange={e => setRecordNote(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none h-16" />
                )}
                <div className="flex gap-2">
                  <button type="submit" disabled={savingRecord} className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${editingRecordId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>{savingRecord ? 'Сохраняем...' : editingRecordId ? 'Обновить' : 'Сохранить'}</button>
                  {editingRecordId && <button type="button" onClick={resetRecordForm} className="px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg text-sm hover:bg-gray-300">Отмена</button>}
                </div>
              </form>
            ) : <p className="text-sm text-gray-400 dark:text-gray-500">Сначала добавьте питомца</p>}
          </section>

          <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 print:mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200">{selectedPet ? selectedPet.name : 'Лента'}</h2>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 print:hidden">
                  <button onClick={() => setDashboardTab('list')} className={`px-2 py-1 text-xs rounded-md transition ${dashboardTab === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-500'}`}>📋 Список</button>
                  <button onClick={() => setDashboardTab('docs')} className={`px-2 py-1 text-xs rounded-md transition ${dashboardTab === 'docs' ? 'bg-white dark:bg-gray-600 shadow-sm text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-500'}`}>📁 Документы</button>
                </div>
              </div>
              
              {selectedPet && (
                <button onClick={() => setShowCalendarModal(true)} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition flex items-center gap-1 print:hidden">
                  📅 Открыть календарь
                </button>
              )}
              {selectedPet && records.length > 0 && dashboardTab === 'list' && (
                <div className="flex gap-2 print:hidden">
                  <button onClick={exportToCSV} className="text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition flex items-center gap-1" title="Скачать в Excel">📊 Excel</button>
                  <button onClick={() => window.print()} className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1">🖨️ PDF</button>
                </div>
              )}
            </div>

            <div className="hidden print:block mb-6 border-b pb-4">
              <div className="flex items-center gap-4 mb-2">
                {selectedPet?.avatar_url && <img src={selectedPet.avatar_url} className="w-16 h-16 rounded-full object-cover" />}
                <div>
                  <h1 className="text-2xl font-bold">{selectedPet?.name}</h1>
                  <p className="text-sm text-gray-500">{selectedPet?.species} {selectedPet?.breed ? `• ${selectedPet.breed}` : ''} {selectedPet?.birth_date ? ` • Возраст: ${calculateAge(selectedPet.birth_date)}` : ''}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg mt-3 text-sm grid grid-cols-2 gap-2">
                <div><b>Аллергии:</b> {selectedPet?.allergies || 'Нет'}</div>
                <div><b>Хронические:</b> {selectedPet?.chronic_diseases || 'Нет'}</div>
                <div><b>Корм:</b> {selectedPet?.food || 'Не указано'}</div>
                <div><b>Ветеринар:</b> {selectedPet?.vet_contact || 'Не указан'}</div>
              </div>
              <p className="text-sm text-gray-500 mt-3">Дата отчета: {new Date().toLocaleDateString('ru-RU')}</p>
            </div>

            {selectedPet ? (
              <>
                {dashboardTab === 'list' && (
                  <>
                    {upcomingEvents.length > 0 && (
                      <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 print:hidden">
                        <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">⚠️ Внимание! Ближайшие события</h3>
                        <ul className="space-y-2">
                          {upcomingEvents.map(ev => (
                            <li key={ev.id} className="flex justify-between items-center text-sm text-orange-700 dark:text-orange-400 border-b border-orange-100 dark:border-orange-800/50 pb-1 last:border-0 last:pb-0">
                              <span className="font-medium truncate pr-2">{ev.value}</span>
                              <span className="shrink-0 bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{ev.next_date}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {totalExpenses > 0 && (
                      <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-3 rounded-xl flex justify-between items-center print:hidden">
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Всего потрачено:</span>
                        <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{totalExpenses.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    )}
                    {weightData.length > 1 && (
                      <div className="mb-6 print:hidden bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Динамика веса (кг)</h3>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                              <XAxis dataKey="date" tick={{fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280'}} tickLine={false} axisLine={false} />
                              <YAxis tick={{fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280'}} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: isDark ? '#f3f4f6' : '#111827' }} itemStyle={{ color: isDark ? '#f43f5e' : '#e11d48', fontWeight: 'bold' }} />
                              <Line type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: isDark ? '#1f2937' : '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {records.length === 0 ? (
                      <div className="text-center p-6 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-dashed border-rose-200 dark:border-rose-800 mt-6">
                        <span className="text-4xl mb-2 block">📝</span>
                        <p className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">Шаг 2. Добавьте запись</p>
                        <p className="text-xs text-rose-600 dark:text-rose-400">Заполните форму слева.</p>
                        <div className="text-2xl animate-bounce mt-2">←</div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
                        {records.map(record => {
                          const reminder = getReminderStatus(record.next_date);
                          return (
                            <div key={record.id} className={`border-l-4 pl-3 py-1 print:break-inside-avoid ${record.type === 'note' ? 'border-yellow-400 print:border-gray-400' : record.type === 'expense' ? 'border-emerald-400 print:border-gray-400' : 'border-rose-200 dark:border-rose-700 print:border-gray-400'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium uppercase print:text-gray-800 ${record.type === 'note' ? 'text-yellow-600 dark:text-yellow-500' : record.type === 'expense' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500 dark:text-rose-400'}`}>{RECORD_LABELS[record.type] || record.type}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">{record.record_date}</span>
                                  <div className="flex gap-1 print:hidden">
                                    <button onClick={() => startEditingRecord(record)} className="text-gray-300 hover:text-rose-500 p-1">✏️</button>
                                    <button onClick={() => deleteRecord(record.id)} className="text-gray-300 hover:text-red-500 p-1">×</button>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{record.value}{record.type === 'weight' ? ' кг' : record.type === 'expense' ? ' ₽' : ''}</p>
                              {reminder && <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${reminder.color}`}>Следующий раз: {reminder.text}</div>}
                              {record.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{record.note}</p>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {dashboardTab === 'docs' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition relative">
                      <input type="file" onChange={uploadDocument} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                      <div className="text-gray-500 dark:text-gray-400">
                        <p className="text-2xl mb-2">📄</p>
                        <p className="font-medium text-sm">Нажмите или перетащите файл</p>
                        <p className="text-xs mt-1">PDF, JPG, PNG (до 5 МБ)</p>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                      {documents.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Нет загруженных документов</p>}
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-xl">📎</span>
                            <div className="truncate">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:text-rose-700 p-1 text-sm font-medium">Открыть</a>
                            <button onClick={() => deleteDocument(doc.id, doc.url)} className="text-red-400 hover:text-red-600 p-1 text-sm">Удалить</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <p className="text-sm text-gray-400 dark:text-gray-500">Выберите питомца</p>}
          </section>
        </main>
      </div>

      <Footer />
    </div>
  )
}

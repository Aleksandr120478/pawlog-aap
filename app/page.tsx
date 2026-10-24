'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import LandingPage from '../components/LandingPage'
import CalendarModal from '../components/CalendarModal'
import { ShareModal, PremiumModal, SettingsModal } from '../components/AppModals'
import { RECORD_LABELS, PetShare } from '../components/types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PetsSidebar from '../components/PetsSidebar'
import RecordForm from '../components/RecordForm'
import PetTimeline from '../components/PetTimeline'
import SkeletonLoader from '../components/SkeletonLoader'
import { usePets } from '../hooks/usePets'
import { useRecords } from '../hooks/useRecords'
import { generateICS } from '../lib/ics'

function todayLocal() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [mobileTab, setMobileTab] = useState<'pets' | 'record' | 'timeline'>('pets')
  
  const [dashboardTab, setDashboardTab] = useState<'list' | 'docs'>('list')
  const [showPremiumModal, setShowPremiumModal] = useState(false) 
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(todayLocal())
  const [petShares, setPetShares] = useState<PetShare[]>([])
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

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark'
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark'); setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark'); setIsDark(false)
    }
    localStorage.setItem('theme', newTheme)

    if (session) {
      await supabase.from('user_status').update({ theme: newTheme }).eq('user_id', session.user.id)
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
      if (data.theme) {
        if (data.theme === 'dark') {
          document.documentElement.classList.add('dark'); setIsDark(true); localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark'); setIsDark(false); localStorage.setItem('theme', 'light')
        }
      }
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchPets()
      fetchUserStatus(session.user.id)
    }
  }, [session, fetchPets, fetchUserStatus])

  async function fetchPetShares(petId: string) {
    const { data } = await supabase.from('pet_shares').select('*').eq('pet_id', petId)
    setPetShares(data || [])
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    const cleanEmail = shareEmail.trim().toLowerCase();
    if (!cleanEmail || !sharingPetId) return toast.error('Введите email', { id: 'share-error' })
    if (cleanEmail === session?.user.email?.toLowerCase()) return toast.error('Вы не можете поделиться с самим собой', { id: 'share-error' })
    
    const toastId = toast.loading('Отправка приглашения...', { id: 'share-loading' })
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
    if (error) toast.error(error.message, { id: 'remove-share-error' })
    else {
      toast.success('Доступ отозван', { id: 'remove-share-success' })
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
    if (!newPassword || newPassword.length < 6) return toast.error('Пароль должен быть минимум 6 символов', { id: 'pass-error' })
    setUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setUpdatingPassword(false)
    if (error) toast.error(error.message, { id: 'pass-error' })
    else {
      toast.success('Пароль успешно изменен!', { id: 'pass-success' })
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
    toast.success('Файл Excel успешно скачан!', { id: 'csv-success' });
  }

  function exportToICS() {
    if (!selectedPet || records.length === 0) return;

    const eventsToExport = records
      .filter(r => r.next_date)
      .map(r => ({
        id: r.id,
        title: `${selectedPet.name}: ${RECORD_LABELS[r.type] || r.type}`,
        description: r.note || '',
        date: r.next_date as string
      }));

    if (eventsToExport.length === 0) {
      toast.error('Нет предстоящих событий для экспорта', { id: 'ics-error' });
      return;
    }

    const icsString = generateICS(eventsToExport);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedPet.name}_calendar.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Файл календаря скачан!', { id: 'ics-success' });
  }

  async function startFreeTrial() {
    if (!session) return
    const toastId = toast.loading('Активация Premium...', { id: 'trial-loading' })
    const { error } = await supabase.rpc('start_free_trial')
    if (error) {
      toast.error(error.message, { id: toastId })
    } else {
      toast.success('Пробный период на 7 дней активирован!', { id: toastId })
      setShowPremiumModal(false)
      fetchUserStatus(session.user.id)
    }
  }

  async function handleMockPayment() {
    if (!session) return
    const toastId = toast.loading('Обработка тестового платежа...', { id: 'pay-loading' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const { error } = await supabase.rpc('activate_mock_premium');
    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success('Тестовая оплата прошла! Premium активирован! 🎉', { id: toastId });
      setIsPremium(true); 
      setShowPremiumModal(false); 
    }
  }

  function handleAddFromCalendar(date: string) {
    setEditingRecordId(null)
    setRecordType('weight')
    setRecordValue('')
    setRecordNote('')
    setRecordNextDate('')
    setRecordDate(date)
    setShowCalendarModal(false)
    setDashboardTab('list')
    setMobileTab('record')
    setTimeout(() => {
      document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    toast.success(`Дата подставлена: ${date}`, { id: 'date-success' })
  }

  async function handleDeleteAccount() {
    if (!confirm('ВНИМАНИЕ! Вы уверены, что хотите навсегда удалить аккаунт и всех питомцев? Это действие нельзя отменить.')) return;

    const toastId = toast.loading('Удаление аккаунта...', { id: 'delete-acc' });
    const { error } = await supabase.rpc('delete_my_account');

    if (error) {
      toast.error('Ошибка удаления: ' + error.message, { id: toastId });
    } else {
      toast.success('Аккаунт успешно удален. До свидания!', { id: toastId });
      await supabase.auth.signOut();
      window.location.reload(); 
    }
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

  if (loading) return <SkeletonLoader />

  if (!session) {
    return <LandingPage isDark={isDark} toggleTheme={toggleTheme} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 print:bg-white print:text-black">
      <div className="flex-1">
        {showCalendarModal && (
          <CalendarModal records={records} selectedDate={calendarSelectedDate} onDayClick={setCalendarSelectedDate} onAddClick={handleAddFromCalendar} onClose={() => setShowCalendarModal(false)} />
        )}

        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center py-2 text-sm font-medium print:hidden flex justify-center items-center gap-2 shadow-sm animate-in slide-in-from-top duration-500">
            <span>✨ У вас активен Premium (Пробный период)! Осталось дней: {trialDaysLeft}</span>
            <button onClick={() => setShowPremiumModal(true)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition active:scale-95">Продлить</button>
          </div>
        )}

        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} shareEmail={shareEmail} setShareEmail={setShareEmail} onSubmit={handleShare} petShares={petShares} removeShare={removeShare} />
        
        <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} isPremium={isPremium} trialDaysLeft={trialDaysLeft} startFreeTrial={startFreeTrial} billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} onPay={handleMockPayment} />
        
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} session={session} isPremium={isPremium} trialDaysLeft={trialDaysLeft} newPassword={newPassword} setNewPassword={setNewPassword} updatePassword={updatePassword} updatingPassword={updatingPassword} onDeleteAccount={handleDeleteAccount} />

        <Header isDark={isDark} toggleTheme={toggleTheme} session={session} hasPremiumAccess={hasPremiumAccess} onOpenPremium={() => setShowPremiumModal(true)} onOpenSettings={() => setShowSettingsModal(true)} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
          <div className={`${mobileTab === 'pets' ? 'block animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'} md:block h-full`}>
            <PetsSidebar pets={pets} selectedPetId={selectedPetId} setSelectedPetId={setSelectedPetId} session={session} hasPremiumAccess={hasPremiumAccess} ownedPetsCount={ownedPetsCount} editingPetId={editingPetId} petName={petName} setPetName={setPetName} petSpecies={petSpecies} setPetSpecies={setPetSpecies} petBreed={petBreed} setPetBreed={setPetBreed} petBirthDate={petBirthDate} setPetBirthDate={setPetBirthDate} petFile={petFile} setPetFile={setPetFile} petAllergies={petAllergies} setPetAllergies={setPetAllergies} petChronic={petChronic} setPetChronic={setPetChronic} petFood={petFood} setPetFood={setPetFood} petVet={petVet} setPetVet={setPetVet} savingPet={savingPet} savePet={savePet} deletePet={deletePet} startEditingPet={startEditingPet} resetPetForm={resetPetForm} openShareModal={openShareModal} />
          </div>

          <div className={`${mobileTab === 'record' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'} md:block h-full`}>
            <RecordForm selectedPet={selectedPet} hasPremiumAccess={hasPremiumAccess} recordsCount={records.length} editingRecordId={editingRecordId} addVaccineTemplates={addVaccineTemplates} saveRecord={saveRecord} recordType={recordType} setRecordType={setRecordType} recordValue={recordValue} setRecordValue={setRecordValue} recordDate={recordDate} setRecordDate={setRecordDate} recordNextDate={recordNextDate} setRecordNextDate={setRecordNextDate} recordNote={recordNote} setRecordNote={setRecordNote} savingRecord={savingRecord} resetRecordForm={resetRecordForm} />
          </div>

          <div className={`${mobileTab === 'timeline' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'} md:block h-full`}>
            <PetTimeline selectedPet={selectedPet} dashboardTab={dashboardTab} setDashboardTab={setDashboardTab} records={records} documents={documents} showCalendarModal={showCalendarModal} setShowCalendarModal={setShowCalendarModal} exportToCSV={exportToCSV} exportToICS={exportToICS} isDark={isDark} startEditingRecord={startEditingRecord} deleteRecord={deleteRecord} uploadDocument={uploadDocument} deleteDocument={deleteDocument} upcomingEvents={upcomingEvents} totalExpenses={totalExpenses} weightData={weightData} getReminderStatus={getReminderStatus} />
          </div>
        </main>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 flex justify-around p-2 pb-safe z-50 print:hidden shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <button onClick={() => setMobileTab('pets')} className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 active:scale-90 w-1/3 ${mobileTab === 'pets' ? 'text-rose-500 bg-rose-50/80 dark:bg-rose-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}><span className="text-xl">🐾</span><span className="text-[10px] font-medium mt-1">Питомцы</span></button>
          <button onClick={() => setMobileTab('record')} className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 active:scale-90 w-1/3 ${mobileTab === 'record' ? 'text-green-600 bg-green-50/80 dark:bg-green-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}><span className="text-xl">➕</span><span className="text-[10px] font-medium mt-1">Запись</span></button>
          <button onClick={() => setMobileTab('timeline')} className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 active:scale-90 w-1/3 ${mobileTab === 'timeline' ? 'text-blue-500 bg-blue-50/80 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}><span className="text-xl">📋</span><span className="text-[10px] font-medium mt-1">Лента</span></button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
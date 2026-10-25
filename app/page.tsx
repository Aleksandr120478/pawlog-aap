// app/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import LandingPage from '@/components/LandingPage'
import CalendarModal from '@/components/CalendarModal'
import { ShareModal, PremiumModal, SettingsModal } from '@/components/AppModals'
import { PetShare } from '@/components/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PetsSidebar from '@/components/PetsSidebar'
import RecordForm from '@/components/RecordForm'
import PetTimeline from '@/components/PetTimeline'
import SkeletonLoader from '@/components/SkeletonLoader'
import { EmergencyQR } from '@/components/emergency-qr'
import MobileNav from '@/components/MobileNav'
import TrialBanner from '@/components/TrialBanner'
import { todayLocal } from '@/lib/date'
import { useAppStore } from '@/store/useAppStore'

export default function Home() {
  // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ИЗ ZUSTAND ---
  const session = useAppStore(state => state.session)
  const setSession = useAppStore(state => state.setSession)
  
  const hasPremiumAccess = useAppStore(state => state.hasPremiumAccess)
  const setHasPremiumAccess = useAppStore(state => state.setHasPremiumAccess)

  const pets = useAppStore(state => state.pets)
  const selectedPetId = useAppStore(state => state.selectedPetId)
  const selectedPet = pets.find(p => p.id === selectedPetId) || null
  const fetchPets = useAppStore(state => state.fetchPets)

  const records = useAppStore(state => state.records)
  const store = useAppStore()

  // --- ЛОКАЛЬНОЕ СОСТОЯНИЕ (UI) ---
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [mobileTab, setMobileTab] = useState<'pets' | 'record' | 'timeline'>('pets')

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

  const [shouldScrollToForm, setShouldScrollToForm] = useState(false)
  const recordFormRef = useRef<HTMLDivElement>(null)

  const showPremiumModal = useAppStore(state => state.showPremiumModal)
  const setShowPremiumModal = useAppStore(state => state.setShowPremiumModal)

  // Синхронизация статуса Premium
  useEffect(() => {
    setHasPremiumAccess(isPremium || (trialDaysLeft !== null && trialDaysLeft > 0))
  }, [isPremium, trialDaysLeft, setHasPremiumAccess])

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true); document.documentElement.classList.add('dark')
    } else {
      setIsDark(false); document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (shouldScrollToForm && recordFormRef.current) {
      requestAnimationFrame(() => {
        recordFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setShouldScrollToForm(false)
      })
    }
  }, [shouldScrollToForm])

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
    let { data } = await supabase.from('user_status').select('*').eq('user_id', userId).maybeSingle()

    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from('user_status')
        .insert({ user_id: userId })
        .select()
        .single()

      if (!insertError) {
        data = newData
      } else if (insertError.code === '23505') {
        const { data: retryData } = await supabase.from('user_status').select('*').eq('user_id', userId).single()
        if (retryData) data = retryData
      }
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
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

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

    if (process.env.NODE_ENV !== 'development') {
      toast.error('Онлайн-оплата скоро появится!', { id: 'pay-soon' })
      return
    }

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
    store.setEditingRecordId(null)
    store.setRecordType('weight')
    store.setRecordValue('')
    store.setRecordNote('')
    store.setRecordNextDate('')
    store.setRecordDate(date)
    setShowCalendarModal(false)
    setMobileTab('record')
    setShouldScrollToForm(true)
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
    store.setSelectedPetId(null)
    store.resetPetForm()
    store.resetRecordForm()
    setIsPremium(false); setTrialEndsAt(null); setTrialDaysLeft(null)
  }

  if (loading) return <SkeletonLoader />
  if (!session) return <LandingPage />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 print:bg-white print:text-black">
      <div className="flex-1">
        {showCalendarModal && (
          <CalendarModal records={records} selectedDate={calendarSelectedDate} onDayClick={setCalendarSelectedDate} onAddClick={handleAddFromCalendar} onClose={() => setShowCalendarModal(false)} />
        )}

        <TrialBanner trialDaysLeft={trialDaysLeft} onOpenPremium={() => setShowPremiumModal(true)} />

        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} shareEmail={shareEmail} setShareEmail={setShareEmail} onSubmit={handleShare} petShares={petShares} removeShare={removeShare} />

        <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} isPremium={isPremium} trialDaysLeft={trialDaysLeft} startFreeTrial={startFreeTrial} billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} onPay={handleMockPayment} />

        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} session={session} isPremium={isPremium} trialDaysLeft={trialDaysLeft} newPassword={newPassword} setNewPassword={setNewPassword} updatePassword={updatePassword} updatingPassword={updatingPassword} onDeleteAccount={handleDeleteAccount} />

        <Header isDark={isDark} toggleTheme={toggleTheme} session={session} hasPremiumAccess={hasPremiumAccess} onOpenPremium={() => setShowPremiumModal(true)} onOpenSettings={() => setShowSettingsModal(true)} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
          <div className={`${mobileTab === 'pets' ? 'block animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'} md:block h-full`}>
            <PetsSidebar openShareModal={openShareModal} />
          </div>

          <div ref={recordFormRef} className={`${mobileTab === 'record' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'} md:block h-full`}>
            <RecordForm />

            {selectedPet && (
              <div className="mt-6 animate-in fade-in duration-500">
                <EmergencyQR
                  pet={selectedPet}
                  onTokenReset={() => { fetchPets(); }}
                />
              </div>
            )}
          </div>

          <div className={`${mobileTab === 'timeline' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'} md:block h-full`}>
            <PetTimeline isDark={isDark} onOpenCalendar={() => setShowCalendarModal(true)} />
          </div>
        </main>

        <MobileNav mobileTab={mobileTab} setMobileTab={setMobileTab} />
      </div>
      <Footer />
    </div>
  )
}
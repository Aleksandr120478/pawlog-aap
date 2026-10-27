// app/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AuthChangeEvent } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import LandingPage from '@/components/LandingPage'
import CalendarModal from '@/components/CalendarModal'
import { ShareModal, PremiumModal, SettingsModal, DocumentViewerModal } from '@/components/AppModals'
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
  const session = useAppStore(state => state.session)
  const setSession = useAppStore(state => state.setSession)
  const hasPremiumAccess = useAppStore(state => state.hasPremiumAccess)
  const isDark = useAppStore(state => state.isDark)
  const toggleTheme = useAppStore(state => state.toggleTheme)
  
  const pets = useAppStore(state => state.pets)
  const selectedPetId = useAppStore(state => state.selectedPetId)
  const selectedPet = pets.find(p => p.id === selectedPetId) || null
  const fetchPets = useAppStore(state => state.fetchPets)
  const records = useAppStore(state => state.records)
  
  const fetchUserStatus = useAppStore(state => state.fetchUserStatus)
  const setEditingRecordId = useAppStore(state => state.setEditingRecordId)
  const setRecordType = useAppStore(state => state.setRecordType)
  const setRecordValue = useAppStore(state => state.setRecordValue)
  const setRecordNote = useAppStore(state => state.setRecordNote)
  const setRecordNextDate = useAppStore(state => state.setRecordNextDate)
  const setRecordDate = useAppStore(state => state.setRecordDate)
  const setSelectedPetId = useAppStore(state => state.setSelectedPetId)
  const resetPetForm = useAppStore(state => state.resetPetForm)
  const resetRecordForm = useAppStore(state => state.resetRecordForm)
  const trialDaysLeft = useAppStore(state => state.trialDaysLeft)
  const setShowSettingsModal = useAppStore(state => state.setShowSettingsModal)
  
  const showPremiumModal = useAppStore(state => state.showPremiumModal)
  const setShowPremiumModal = useAppStore(state => state.setShowPremiumModal)

  const [loading, setLoading] = useState(true)
  const [mobileTab, setMobileTab] = useState<'pets' | 'record' | 'timeline'>('pets')
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(todayLocal())
  const [shouldScrollToForm, setShouldScrollToForm] = useState(false)
  const recordFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      useAppStore.setState({ isDark: true })
    } else {
      document.documentElement.classList.remove('dark')
      useAppStore.setState({ isDark: false })
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session) => {
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

  function handleAddFromCalendar(date: string) {
    setEditingRecordId(null)
    setRecordType('weight')
    setRecordValue('')
    setRecordNote('')
    setRecordNextDate('')
    setRecordDate(date)
    setShowCalendarModal(false)
    setMobileTab('record')
    setShouldScrollToForm(true)
    toast.success(`Дата подставлена: ${date}`, { id: 'date-success' })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSelectedPetId(null)
    resetPetForm()
    resetRecordForm()
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
        <ShareModal />
        <PremiumModal />
        <SettingsModal />
        
        {/* НОВАЯ МОДАЛКА ЗДЕСЬ */}
        <DocumentViewerModal />

        <Header isDark={isDark} toggleTheme={toggleTheme} session={session} hasPremiumAccess={hasPremiumAccess} onOpenPremium={() => setShowPremiumModal(true)} onOpenSettings={() => setShowSettingsModal(true)} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
          <div className={`${mobileTab === 'pets' ? 'block animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'} md:block h-full`}>
            <PetsSidebar />
          </div>

          <div ref={recordFormRef} className={`${mobileTab === 'record' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'} md:block h-full`}>
            <RecordForm />

            {selectedPet && (
              <div className="mt-6 animate-in fade-in duration-500">
                <EmergencyQR pet={selectedPet} onTokenReset={() => fetchPets()} />
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
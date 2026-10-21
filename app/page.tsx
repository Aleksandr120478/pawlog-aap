'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AuthForm from '../components/AuthForm'

type Pet = { 
  id: string; name: string; species: string | null;
  breed: string | null; birth_date: string | null; avatar_url: string | null;
  allergies: string | null; chronic_diseases: string | null; food: string | null; vet_contact: string | null;
  user_id: string;
}
type HealthRecord = {
  id: string; pet_id: string; type: string; value: string;
  note: string | null; record_date: string; next_date: string | null;
}
type PetDocument = {
  id: string; pet_id: string; name: string; url: string; created_at: string;
}

const RECORD_LABELS: Record<string, string> = {
  weight: 'Вес', vaccine: 'Прививка', medication: 'Лекарство', note: 'Заметка', expense: 'Расход (₽)'
}

const SPECIES_ICONS: Record<string, string> = {
  'Собака': '🐶', 'Кошка': '🐱', 'Попугай': '🦜', 'Хомяк': '🐹',
  'Кролик': '🐰', 'Морская свинка': '🐹', 'Крыса': '🐀', 'Шиншилла': '🐭',
  'Канарейка': '🐦', 'Хорёк': '🦦', 'Черепаха': '🐢', 'Ящерица': '🦎',
  'Змея': '🐍', 'Ёжик': '🦔', 'Рыбка': '🐟', 'Другое': '🐾'
}

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

function CalendarModal({ 
  records, 
  selectedDate, 
  onDayClick, 
  onAddClick,
  onClose 
}: { 
  records: HealthRecord[], 
  selectedDate: string, 
  onDayClick: (date: string) => void,
  onAddClick: (date: string) => void,
  onClose: () => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const eventsByDate: Record<string, HealthRecord[]> = {}
  records.forEach(r => {
    if (r.record_date) {
      eventsByDate[r.record_date] = eventsByDate[r.record_date] || []
      eventsByDate[r.record_date].push(r)
    }
    if (r.next_date) {
      eventsByDate[r.next_date] = eventsByDate[r.next_date] || []
      eventsByDate[r.next_date].push({ ...r, type: 'reminder', value: 'Напоминание: ' + r.value })
    }
  })

  const blanks = Array.from({ length: startingDay }, (_, i) => (
    <div key={`blank-${i}`} className="min-h-[120px] bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-xl"></div>
  ))
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEvents = eventsByDate[dateString] || []
    const isToday = dateString === todayLocal()
    const isSelected = dateString === selectedDate

    return (
      <div 
        key={day} 
        onClick={() => onDayClick(dateString)}
        className={`min-h-[120px] p-2 border rounded-xl flex flex-col cursor-pointer transition-all duration-200 hover:border-rose-400 hover:shadow-md overflow-hidden ${
          isSelected 
            ? 'border-rose-500 ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-900/30' 
            : isToday 
              ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-900/10' 
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <span className={`text-sm font-bold shrink-0 ${isSelected || isToday ? 'text-rose-700 dark:text-rose-300' : 'text-gray-600 dark:text-gray-400'}`}>{day}</span>
        
        <div className="flex-1 mt-2 overflow-y-auto w-full flex flex-col gap-1 pointer-events-none custom-scrollbar">
          {dayEvents.map((e, idx) => (
            <div key={idx} title={e.value} className={`text-[10px] leading-tight truncate w-full px-1.5 py-1 rounded-md ${e.type === 'reminder' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'}`}>
              {e.value}
            </div>
          ))}
        </div>
      </div>
    )
  })

  const selectedDayEvents = eventsByDate[selectedDate] || [];

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Календарь событий</h2>
          <button onClick={onClose} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm font-medium">
            ✕ Закрыть
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 md:px-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm">← Пред. месяц</button>
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">{monthNames[month]} {year}</h3>
              <button onClick={nextMonth} className="p-2 md:px-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm">След. месяц →</button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 pb-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {blanks}
              {days}
            </div>
          </div>

          <div className="w-full xl:w-80 shrink-0 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
              {selectedDate || 'Выберите день'}
            </h4>
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">События на этот день</p>
            
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-3">
              {selectedDate ? (
                selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">Нет записей</p>
                ) : (
                  selectedDayEvents.map((e, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className={`text-xs font-bold uppercase mb-1 block ${e.type === 'reminder' ? 'text-orange-600' : 'text-rose-600'}`}>
                        {RECORD_LABELS[e.type] || e.type}
                      </span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.value}</p>
                      {e.note && <p className="text-xs text-gray-500 mt-1">{e.note}</p>}
                    </div>
                  ))
                )
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Нажмите на день в календаре</p>
              )}
            </div>

            {selectedDate && (
              <button 
                onClick={() => onAddClick(selectedDate)}
                className="w-full mt-4 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-500/20"
              >
                + Добавить на этот день
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [documents, setDocuments] = useState<PetDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPet, setSavingPet] = useState(false)
  const [savingRecord, setSavingRecord] = useState(false)
  const [isDark, setIsDark] = useState(false)
  
  const [dashboardTab, setDashboardTab] = useState<'list' | 'docs'>('list')
  
  const [showPremiumModal, setShowPremiumModal] = useState(false) 
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(todayLocal())

  const [shareEmail, setShareEmail] = useState('')
  const [sharingPetId, setSharingPetId] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  
  const [isPremium, setIsPremium] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const [editingPetId, setEditingPetId] = useState<string | null>(null)
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Собака')
  const [petBreed, setPetBreed] = useState('')
  const [petBirthDate, setPetBirthDate] = useState('')
  const [petFile, setPetFile] = useState<File | null>(null)
  const [petAvatarUrl, setPetAvatarUrl] = useState<string | null>(null)
  
  const [petAllergies, setPetAllergies] = useState('')
  const [petChronic, setPetChronic] = useState('')
  const [petFood, setPetFood] = useState('')
  const [petVet, setPetVet] = useState('')

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [recordType, setRecordType] = useState('weight')
  const [recordValue, setRecordValue] = useState('')
  const [recordDate, setRecordDate] = useState(todayLocal())
  const [recordNote, setRecordNote] = useState('')
  const [recordNextDate, setRecordNextDate] = useState('')

  const selectedPet = pets.find(p => p.id === selectedPetId) || null
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
  const hasPremiumAccess = isPremium || (trialDaysLeft !== null && trialDaysLeft > 0)
  const ownedPetsCount = pets.filter(p => p.user_id === session?.user?.id).length

  const upcomingEvents = records.filter(r => {
    if (!r.next_date) return false;
    const today = new Date(todayLocal()).getTime();
    const next = new Date(r.next_date).getTime();
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  })

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

  const fetchPets = useCallback(async (autoSelectId?: string) => {
    const { data, error } = await supabase.from('pets').select('*').order('created_at', { ascending: true })
    if (error) { toast.error(error.message); return }
    setPets(data || [])
    if (autoSelectId) setSelectedPetId(autoSelectId)
    else setSelectedPetId(prev => {
        if (prev && data?.some(p => p.id === prev)) return prev
        return data && data.length > 0 ? data[0].id : null
      })
  }, [])

  const fetchRecords = useCallback(async (petId: string) => {
    const { data, error } = await supabase.from('health_records').select('*').eq('pet_id', petId).order('record_date', { ascending: false })
    if (error) toast.error(error.message)
    else setRecords(data || [])
  }, [])

  const fetchDocuments = useCallback(async (petId: string) => {
    const { data, error } = await supabase.from('pet_documents').select('*').eq('pet_id', petId).order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setDocuments(data || [])
  }, [])

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

  useEffect(() => {
    if (selectedPetId) {
      fetchRecords(selectedPetId)
      fetchDocuments(selectedPetId)
    } else {
      setRecords([])
      setDocuments([])
    }
  }, [selectedPetId, fetchRecords, fetchDocuments])

  async function handleShare() {
    const cleanEmail = shareEmail.trim().toLowerCase();
    if (!cleanEmail || !sharingPetId) return toast.error('Введите email')
    if (cleanEmail === session.user.email.toLowerCase()) return toast.error('Вы не можете поделиться с самим собой')
    
    const toastId = toast.loading('Отправка приглашения...')
    const { data: existing } = await supabase.from('pet_shares').select('id').eq('pet_id', sharingPetId).eq('shared_with_email', cleanEmail).single()
    
    if (existing) return toast.error('Этот пользователь уже имеет доступ', { id: toastId })

    const { error } = await supabase.from('pet_shares').insert({ pet_id: sharingPetId, shared_with_email: cleanEmail })
    if (error) toast.error(error.message, { id: toastId })
    else {
      toast.success('Доступ успешно предоставлен!', { id: toastId })
      setShowShareModal(false)
      setShareEmail('')
    }
  }

  function openShareModal(petId: string) {
    setSharingPetId(petId)
    setShareEmail('')
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

  async function uploadAvatar(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedPetId) return
    const toastId = toast.loading('Загрузка документа...')
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data } = await supabase.storage.from('documents').getPublicUrl(fileName)
      const { error: dbError } = await supabase.from('pet_documents').insert({ pet_id: selectedPetId, name: file.name, url: data.publicUrl })
      if (dbError) throw dbError
      toast.success('Документ загружен!', { id: toastId })
      fetchDocuments(selectedPetId)
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message, { id: toastId })
    }
    e.target.value = ''
  }

  async function deleteDocument(docId: string, url: string) {
    if (!confirm('Удалить этот документ?')) return
    const fileName = url.split('/').pop()
    if (fileName) await supabase.storage.from('documents').remove([fileName])
    await supabase.from('pet_documents').delete().eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
    toast.success('Документ удален')
  }

  function startEditingPet(pet: Pet) {
    setEditingPetId(pet.id); setPetName(pet.name); setPetSpecies(pet.species || 'Собака')
    setPetBreed(pet.breed || ''); setPetBirthDate(pet.birth_date || ''); setPetAvatarUrl(pet.avatar_url); setPetFile(null)
    setPetAllergies(pet.allergies || ''); setPetChronic(pet.chronic_diseases || ''); setPetFood(pet.food || ''); setPetVet(pet.vet_contact || '')
  }

  function resetPetForm() {
    setEditingPetId(null); setPetName(''); setPetSpecies('Собака'); setPetBreed('')
    setPetBirthDate(''); setPetFile(null); setPetAvatarUrl(null)
    setPetAllergies(''); setPetChronic(''); setPetFood(''); setPetVet('')
  }

  async function savePet(e: React.FormEvent) {
    e.preventDefault()
    if (!petName.trim()) return toast.error('Введите имя питомца')
    if (!hasPremiumAccess && !editingPetId && ownedPetsCount >= 1) {
      setShowPremiumModal(true)
      return
    }

    setSavingPet(true)
    let avatarUrl = petAvatarUrl
    try {
      if (petFile) avatarUrl = await uploadAvatar(petFile)
    } catch (error: any) { toast.error('Ошибка загрузки фото: ' + error.message) }

    const petData = { 
      name: petName.trim(), species: petSpecies, breed: petBreed || null, birth_date: petBirthDate || null, avatar_url: avatarUrl,
      allergies: petAllergies || null, chronic_diseases: petChronic || null, food: petFood || null, vet_contact: petVet || null
    }

    if (editingPetId) {
      const { error } = await supabase.from('pets').update(petData).eq('id', editingPetId)
      if (error) toast.error(error.message)
      else { toast.success('Профиль обновлен!'); fetchPets(editingPetId); resetPetForm() }
    } else {
      const { data, error } = await supabase.from('pets').insert({ ...petData, user_id: session.user.id }).select().single()
      if (error) toast.error(error.message)
      else { toast.success('Питомец добавлен!'); fetchPets(data.id); resetPetForm() }
    }
    setSavingPet(false)
  }

  async function deletePet(id: string) {
    if (!confirm('Удалить питомца и все его записи?')) return
    const { error } = await supabase.from('pets').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Питомец удалён')
    if (selectedPetId === id) setSelectedPetId(null)
    setPets(prev => prev.filter(p => p.id !== id))
    if (editingPetId === id) resetPetForm()
  }

  async function addVaccineTemplates() {
    if (!selectedPet) return
    let templates = []
    if (selectedPet.species === 'Собака') templates = ['Бешенство', 'Чума плотоядных', 'Парвовирусный энтерит', 'Лептоспироз']
    else if (selectedPet.species === 'Кошка') templates = ['Бешенство', 'Кальцивироз', 'Ринотрахеит', 'Панлейкопения']
    else return toast.error('Шаблоны доступны только для собак и кошек')

    if (!hasPremiumAccess && records.length + templates.length > 10) {
      setShowPremiumModal(true)
      return
    }

    const toastId = toast.loading('Добавляем прививки...')
    const nextDate = new Date()
    nextDate.setFullYear(nextDate.getFullYear() + 1)
    const nextDateString = nextDate.toISOString().split('T')[0]

    const recordsToInsert = templates.map(vaccineName => ({
      pet_id: selectedPet.id, type: 'vaccine', value: vaccineName,
      record_date: todayLocal(), next_date: nextDateString, note: 'Добавлено автоматически', reminder_sent: false
    }))

    const { error } = await supabase.from('health_records').insert(recordsToInsert)
    if (error) toast.error(error.message, { id: toastId })
    else { toast.success('График прививок добавлен!', { id: toastId }); fetchRecords(selectedPet.id) }
  }

  function startEditingRecord(record: HealthRecord) {
    setEditingRecordId(record.id); setRecordType(record.type); setRecordValue(record.value)
    setRecordDate(record.record_date); setRecordNote(record.note || ''); setRecordNextDate(record.next_date || '')
  }

  function resetRecordForm() {
    setEditingRecordId(null); setRecordType('weight'); setRecordValue('')
    setRecordDate(todayLocal()); setRecordNote(''); setRecordNextDate('')
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
    
    setTimeout(() => {
      document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    toast.success(`Дата подставлена: ${date}`)
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPetId) return toast.error('Выберите питомца')
    const trimmed = recordValue.trim()
    if (!trimmed) return toast.error('Введите значение')
    if ((recordType === 'weight' || recordType === 'expense') && !/^\d+(\.\d+)?$/.test(trimmed)) {
      return toast.error('Введите число, например 5.2 или 1500')
    }
    if (!hasPremiumAccess && !editingRecordId && records.length >= 10) {
      setShowPremiumModal(true)
      return
    }

    setSavingRecord(true)
    const recordData = { type: recordType, value: trimmed, note: recordNote.trim() || null, record_date: recordDate, next_date: recordNextDate || null, reminder_sent: false }

    if (editingRecordId) {
      const { error } = await supabase.from('health_records').update(recordData).eq('id', editingRecordId)
      if (error) toast.error(error.message)
      else { toast.success('Запись обновлена!'); fetchRecords(selectedPetId); resetRecordForm() }
    } else {
      const { error } = await supabase.from('health_records').insert({ ...recordData, pet_id: selectedPetId })
      if (error) toast.error(error.message)
      else { toast.success('Запись добавлена!'); fetchRecords(selectedPetId); resetRecordForm() }
    }
    setSavingRecord(false)
  }

  async function deleteRecord(id: string) {
    if (!confirm('Удалить эту запись из истории?')) return
    const { error } = await supabase.from('health_records').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRecords(prev => prev.filter(r => r.id !== id))
    if (editingRecordId === id) resetRecordForm()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPets([]); setSelectedPetId(null); setRecords([]); setDocuments([]); resetPetForm(); resetRecordForm()
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

  const weightData = records.filter(r => r.type === 'weight').map(r => ({ date: r.record_date, weight: parseFloat(r.value) })).reverse();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 dark:bg-gray-900">Загрузка...</div>

  // ==================== СПОКОЙНЫЙ ЛЕНДИНГ ====================
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F5] dark:bg-gray-900 transition-colors duration-200">
        
        {/* Левая часть - продающая и с фотографией */}
        <div className="flex-1 relative flex flex-col justify-center px-8 py-16 md:px-16 lg:px-24 bg-[#FFF9F5] dark:bg-gray-900 text-gray-800 dark:text-white overflow-hidden min-h-[50vh] lg:min-h-screen border-r border-rose-100 dark:border-gray-800">
          
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-rose-100 px-4 py-2 rounded-full text-sm font-medium mb-8 text-rose-600">
              <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
              Создано с заботой о питомцах
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-gray-900 dark:text-white">
              Забота, которую <br/>
              <span className="text-rose-500">чувствует питомец</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-lg leading-relaxed">
              PawLog — ваш личный помощник. Следите за весом, прививками и визитами к врачу. Скачивайте красивые PDF-отчеты в один клик. Ни одна важная дата не будет забыта.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-rose-50 p-2 rounded-xl text-2xl">📅</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Календарь</h3>
                  <p className="text-sm text-gray-500">Все события по дням</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-rose-50 p-2 rounded-xl text-2xl">📄</div>
                <div>
                  <h3 className="font-semibold text-gray-800">PDF-отчеты</h3>
                  <p className="text-sm text-gray-500">Для ветеринара</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-rose-50 p-2 rounded-xl text-2xl">📸</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Документы</h3>
                  <p className="text-sm text-gray-500">Анализы и справки</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-rose-50 p-2 rounded-xl text-2xl">🔔</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Напоминания</h3>
                  <p className="text-sm text-gray-500">Прививки и таблетки</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая часть - форма входа */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 relative">
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none w-full max-w-md border border-gray-100 dark:border-gray-700 relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">Добро пожаловать</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Войдите, чтобы продолжить заботу о любимце.</p>
              </div>
              <button onClick={toggleTheme} className="text-2xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:scale-110 transition-transform">
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
            
            <AuthForm />
            
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Нажимая «Войти», вы соглашаетесь с условиями использования.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // ==============================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 print:bg-white print:text-black">
      
      {showCalendarModal && (
        <CalendarModal 
          records={records}
          selectedDate={calendarSelectedDate}
          onDayClick={setCalendarSelectedDate}
          onAddClick={handleAddFromCalendar}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center py-2 text-sm font-medium print:hidden flex justify-center items-center gap-2 shadow-sm">
          <span>✨ У вас активен Premium (Пробный период)! Осталось дней: {trialDaysLeft}</span>
          <button onClick={() => setShowPremiumModal(true)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition">Продлить</button>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 md:p-8 border border-gray-100 dark:border-gray-700 relative">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Поделиться доступом</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Введите email члена семьи, чтобы он мог видеть и редактировать дневник этого питомца.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleShare(); }} className="space-y-4">
              <input type="email" placeholder="Email (например, wife@mail.ru)" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none" required />
              <button type="submit" className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">Пригласить</button>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 relative p-6 md:p-8">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Настройки профиля</h2>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ваш Email:</p>
              <p className="font-medium text-gray-800 dark:text-gray-100">{session.user.email}</p>
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
      )}

      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 relative">
            <button onClick={() => setShowPremiumModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
            <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-8 text-center text-white">
              <h2 className="text-3xl font-extrabold mb-2">PawLog Premium</h2>
              <p className="text-rose-100">Снимите все ограничения</p>
            </div>
            <div className="p-6 md:p-8">
              <ul className="space-y-3 mb-6 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-3">✨ <b>Безлимитные питомцы</b> (вместо 1)</li>
                <li className="flex items-center gap-3">✨ <b>Безлимитные записи</b> (вместо 10)</li>
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
              <button onClick={() => { toast.success('Здесь будет оплата ЮKassa!'); setShowPremiumModal(false); }} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">Оплатить</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🐾 PawLog</h1>
        <div className="flex items-center gap-4">
          {!hasPremiumAccess && (
            <button onClick={() => setShowPremiumModal(true)} className="hidden sm:block text-xs bg-gradient-to-r from-rose-500 to-orange-400 text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition shadow-sm">Получить Premium</button>
          )}
          <button onClick={toggleTheme} className="text-xl p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:scale-110 transition" title="Сменить тему">{isDark ? '☀️' : '🌙'}</button>
          <span onClick={() => setShowSettingsModal(true)} className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline cursor-pointer hover:text-rose-500 transition underline decoration-dashed underline-offset-4" title="Настройки профиля">{session.user.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition">Выйти</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
        
        <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">Мои питомцы</h2>
            {!hasPremiumAccess && <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded-full font-medium">Лимит: {ownedPetsCount}/1</span>}
          </div>
          <div className="space-y-2 mb-4">
            {pets.length === 0 ? (
              <div className="text-center p-6 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-dashed border-rose-200 dark:border-rose-800 mb-2">
                <span className="text-4xl mb-2 block">{SPECIES_ICONS[petSpecies] || '🐾'}</span>
                <p className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">Шаг 1. Добавьте питомца</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">Заполните форму ниже, чтобы начать вести дневник.</p>
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
                {!hasPremiumAccess && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">Лимит: {records.length}/10</span>}
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
                <button type="submit" disabled={savingRecord} className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition ${editingRecordId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>{savingRecord ? 'Сохраняем...' : editingRecordId ? 'Обновить' : 'Сохранить'}</button>
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
                      <p className="text-xs text-rose-600 dark:text-rose-400">Заполните форму слева, чтобы добавить первый вес или прививку.</p>
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
  )
}

'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Pet = { 
  id: string; name: string; species: string | null;
  breed: string | null; birth_date: string | null; avatar_url: string | null;
  allergies: string | null; chronic_diseases: string | null; food: string | null; vet_contact: string | null;
}
type HealthRecord = {
  id: string; pet_id: string; type: string; value: string;
  note: string | null; record_date: string; next_date: string | null;
}
type PetDocument = {
  id: string; pet_id: string; name: string; url: string; created_at: string;
}

const RECORD_LABELS: Record<string, string> = {
  weight: 'Вес', vaccine: 'Прививка', medication: 'Лекарство', note: 'Заметка'
}

function todayLocal() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

// Функция подсчета возраста
function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (years === 0 && months === 0) return 'Меньше месяца';
  return `${years > 0 ? years + ' г. ' : ''}${months > 0 ? months + ' мес.' : ''}`.trim();
}

function CalendarView({ records }: { records: HealthRecord[] }) {
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

  const blanks = Array.from({ length: startingDay }, (_, i) => <div key={`blank-${i}`} className="h-20 md:h-24 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-lg"></div>)
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEvents = eventsByDate[dateString] || []
    const isToday = dateString === todayLocal()

    return (
      <div key={day} className={`h-20 md:h-24 p-1 border rounded-lg overflow-hidden flex flex-col ${isToday ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
        <span className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{day}</span>
        <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
          {dayEvents.map((e, idx) => (
            <div key={idx} title={e.value} className={`text-[10px] truncate px-1 rounded ${e.type === 'reminder' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
              {e.value}
            </div>
          ))}
        </div>
      </div>
    )
  })

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">◀</button>
        <h3 className="font-bold text-gray-800 dark:text-white">{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks}
        {days}
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'docs'>('list')

  // Форма питомца
  const [editingPetId, setEditingPetId] = useState<string | null>(null)
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Собака')
  const [petBreed, setPetBreed] = useState('')
  const [petBirthDate, setPetBirthDate] = useState('')
  const [petFile, setPetFile] = useState<File | null>(null)
  const [petAvatarUrl, setPetAvatarUrl] = useState<string | null>(null)
  
  // Медицинская карта
  const [petAllergies, setPetAllergies] = useState('')
  const [petChronic, setPetChronic] = useState('')
  const [petFood, setPetFood] = useState('')
  const [petVet, setPetVet] = useState('')

  // Форма записи
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [recordType, setRecordType] = useState('weight')
  const [recordValue, setRecordValue] = useState('')
  const [recordDate, setRecordDate] = useState(todayLocal())
  const [recordNote, setRecordNote] = useState('')
  const [recordNextDate, setRecordNextDate] = useState('')

  const selectedPet = pets.find(p => p.id === selectedPetId) || null

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchPets().finally(() => setLoading(false))
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) fetchPets()
    })
    return () => subscription.unsubscribe()
  }, [fetchPets])

  useEffect(() => {
    if (selectedPetId) {
      fetchRecords(selectedPetId)
      fetchDocuments(selectedPetId)
    } else {
      setRecords([])
      setDocuments([])
    }
  }, [selectedPetId, fetchRecords, fetchDocuments])

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
      
      const { data } = supabase.storage.from('documents').getPublicUrl(fileName)
      
      const { error: dbError } = await supabase.from('pet_documents').insert({
        pet_id: selectedPetId, name: file.name, url: data.publicUrl
      })
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
    if (!editingPetId && pets.length >= 1) return toast.error('В бесплатной версии можно добавить только 1 питомца. Оформите Premium!')

    setSavingPet(true)
    let avatarUrl = petAvatarUrl
    try {
      if (petFile) avatarUrl = await uploadAvatar(petFile)
    } catch (error: any) { toast.error('Ошибка загрузки фото: ' + error.message) }

    const petData = { 
      name: petName.trim(), species: petSpecies, breed: petBreed || null, 
      birth_date: petBirthDate || null, avatar_url: avatarUrl,
      allergies: petAllergies || null, chronic_diseases: petChronic || null, 
      food: petFood || null, vet_contact: petVet || null
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

  function startEditingRecord(record: HealthRecord) {
    setEditingRecordId(record.id); setRecordType(record.type); setRecordValue(record.value)
    setRecordDate(record.record_date); setRecordNote(record.note || ''); setRecordNextDate(record.next_date || '')
  }

  function resetRecordForm() {
    setEditingRecordId(null); setRecordType('weight'); setRecordValue('')
    setRecordDate(todayLocal()); setRecordNote(''); setRecordNextDate('')
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPetId) return toast.error('Выберите питомца')
    const trimmed = recordValue.trim()
    if (!trimmed) return toast.error('Введите значение')
    if (recordType === 'weight' && !/^\d+(\.\d+)?$/.test(trimmed)) return toast.error('Вес должен быть числом, например 5.2')
    if (!editingRecordId && records.length >= 10) return toast.error('В бесплатной версии можно добавить не более 10 записей. Оформите Premium!')

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

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="flex-1 flex flex-col justify-center px-8 py-16 md:px-20 lg:px-32 bg-blue-600 dark:bg-blue-950 text-white">
          <h1 className="text-5xl font-extrabold mb-6 flex items-center gap-4">🐾 PawLog</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">Умный дневник здоровья вашего питомца. Следите за весом, прививками и лекарствами. Скачивайте красивые PDF-отчеты для ветеринара.</p>
          <ul className="space-y-4 text-lg text-blue-50 mb-12">
            <li className="flex items-center gap-3">✅ Учет веса, прививок и лекарств</li>
            <li className="flex items-center gap-3">✅ Медицинская карта (аллергии, болезни)</li>
            <li className="flex items-center gap-3">✅ Email-напоминания о процедурах</li>
            <li className="flex items-center gap-3">✅ Печать медицинской карты в один клик</li>
          </ul>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Вход в систему</h2>
              <button onClick={toggleTheme} className="text-2xl p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:scale-110 transition">{isDark ? '☀️' : '🌙'}</button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Создайте аккаунт за 10 секунд, чтобы начать вести дневник.</p>
            <AuthForm />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 print:bg-white print:text-black">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🐾 PawLog</h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-xl p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:scale-110 transition" title="Сменить тему">{isDark ? '☀️' : '🌙'}</button>
          <span className="text-sm text-gray-400 dark:text-gray-500 hidden sm:inline">{session.user.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition">Выйти</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">Мои питомцы</h2>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full font-medium">Лимит: {pets.length}/1</span>
          </div>
          <div className="space-y-2 mb-4">
            {pets.map(pet => (
              <div key={pet.id} onClick={() => setSelectedPetId(pet.id)} className={`flex items-center rounded-xl transition cursor-pointer ${selectedPetId === pet.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 border' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden ml-3 shrink-0">
                  {pet.avatar_url ? <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" /> : <span className="text-lg">🐾</span>}
                </div>
                <div className="flex-1 text-left px-3 py-2">
                  <span className="font-medium text-gray-800 dark:text-gray-100 block">{pet.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{pet.species} {pet.breed ? `• ${pet.breed}` : ''} {pet.birth_date ? `• ${calculateAge(pet.birth_date)}` : ''}</span>
                </div>
                <div className="flex gap-1 pr-2">
                  <button onClick={(e) => { e.stopPropagation(); startEditingPet(pet); }} className="p-1 text-gray-300 hover:text-blue-500 transition" title="Редактировать">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); deletePet(pet.id); }} className="p-1 text-gray-300 hover:text-red-500 transition" title="Удалить">×</button>
                </div>
              </div>
            ))}
            {pets.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">Пока нет питомцев</p>}
          </div>

          <form onSubmit={savePet} className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{editingPetId ? 'Редактировать профиль' : 'Добавить питомца'}</p>
            <input type="text" placeholder="Имя питомца" value={petName} onChange={e => setPetName(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-200 outline-none" />
            <div className="flex gap-2">
              <select value={petSpecies} onChange={e => setPetSpecies(e.target.value)} className="w-1/2 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <optgroup label="Популярные"><option>Собака</option><option>Кошка</option></optgroup>
                <optgroup label="Грызуны"><option>Хомяк</option><option>Кролик</option><option>Морская свинка</option><option>Крыса</option><option>Шиншилла</option></optgroup>
                <optgroup label="Птицы"><option>Попугай</option><option>Канарейка</option></optgroup>
                <optgroup label="Экзотика"><option>Хорёк</option><option>Черепаха</option><option>Ящерица</option><option>Змея</option><option>Ёжик</option></optgroup>
                <optgroup label="Другое"><option>Рыбка</option><option>Другое</option></optgroup>
              </select>
              <input type="text" placeholder="Порода" value={petBreed} onChange={e => setPetBreed(e.target.value)} className="w-1/2 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-200 outline-none" />
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
              <input type="file" accept="image/*" onChange={e => setPetFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-gray-600 file:text-blue-700 dark:file:text-white hover:file:bg-blue-100" />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="submit" disabled={savingPet} className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${editingPetId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{savingPet ? 'Сохранение...' : editingPetId ? 'Обновить' : '+ Добавить'}</button>
              {editingPetId && <button type="button" onClick={resetPetForm} className="px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-300">Отмена</button>}
            </div>
          </form>
        </section>

        {/* СРЕДНЯЯ КОЛОНКА */}
        <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{editingRecordId ? 'Редактировать запись' : 'Новая запись'}</h2>
          {selectedPet ? (
            <form onSubmit={saveRecord} className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Для: <span className="font-medium text-gray-700 dark:text-gray-200">{selectedPet.name}</span></p>
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">Лимит: {records.length}/10</span>
              </div>
              <select value={recordType} onChange={e => setRecordType(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="weight">Вес (кг)</option>
                <option value="vaccine">Прививка</option>
                <option value="medication">Лекарство</option>
                <option value="note">Заметка (Дневник)</option>
              </select>
              <input type="text" placeholder={recordType === 'weight' ? 'Например, 12.5' : recordType === 'note' ? 'Что случилось?' : 'Название'} value={recordValue} onChange={e => setRecordValue(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
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

        {/* ПРАВАЯ КОЛОНКА */}
        <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 print:mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{selectedPet ? selectedPet.name : 'Лента'}</h2>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 print:hidden">
                <button onClick={() => setViewMode('list')} className={`px-2 py-1 text-xs rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500'}`}>📋 Список</button>
                <button onClick={() => setViewMode('calendar')} className={`px-2 py-1 text-xs rounded-md transition ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500'}`}>📅 Календарь</button>
                <button onClick={() => setViewMode('docs')} className={`px-2 py-1 text-xs rounded-md transition ${viewMode === 'docs' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500'}`}>📁 Документы</button>
              </div>
            </div>
            {selectedPet && records.length > 0 && viewMode === 'list' && (
              <button onClick={() => window.print()} className="print:hidden text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1">🖨️ PDF</button>
            )}
          </div>

          {/* Блок профиля для печати */}
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
              {viewMode === 'list' && (
                <>
                  {weightData.length > 1 && (
                    <div className="mb-6 print:hidden bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Динамика веса (кг)</h3>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                            <XAxis dataKey="date" tick={{fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280'}} tickLine={false} axisLine={false} />
                            <YAxis tick={{fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280'}} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: isDark ? '#f3f4f6' : '#111827' }} itemStyle={{ color: isDark ? '#60a5fa' : '#2563eb', fontWeight: 'bold' }} />
                            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: isDark ? '#1f2937' : '#fff' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
                    {records.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">Пока нет записей</p>}
                    {records.map(record => {
                      const reminder = getReminderStatus(record.next_date);
                      return (
                        <div key={record.id} className={`border-l-4 pl-3 py-1 print:break-inside-avoid ${record.type === 'note' ? 'border-yellow-400 print:border-gray-400' : 'border-blue-200 dark:border-blue-700 print:border-gray-400'}`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-medium uppercase print:text-gray-800 ${record.type === 'note' ? 'text-yellow-600 dark:text-yellow-500' : 'text-blue-500 dark:text-blue-400'}`}>
                              {RECORD_LABELS[record.type] || record.type}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 dark:text-gray-500">{record.record_date}</span>
                              <div className="flex gap-1 print:hidden">
                                <button onClick={() => startEditingRecord(record)} className="text-gray-300 hover:text-blue-500 p-1">✏️</button>
                                <button onClick={() => deleteRecord(record.id)} className="text-gray-300 hover:text-red-500 p-1">×</button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{record.value}{record.type === 'weight' ? ' кг' : ''}</p>
                          {reminder && <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${reminder.color}`}>Следующий раз: {reminder.text}</div>}
                          {record.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{record.note}</p>}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {viewMode === 'calendar' && <CalendarView records={records} />}

              {viewMode === 'docs' && (
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
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-1 text-sm font-medium">Открыть</a>
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

function AuthForm() {
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

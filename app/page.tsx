'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

type Pet = { 
  id: string; 
  name: string; 
  species: string | null;
  breed: string | null;
  birth_date: string | null;
  avatar_url: string | null;
}
type HealthRecord = {
  id: string
  pet_id: string
  type: string
  value: string
  note: string | null
  record_date: string
  next_date: string | null // Новое поле для напоминаний
}

const RECORD_LABELS: Record<string, string> = {
  weight: 'Вес',
  vaccine: 'Прививка',
  medication: 'Лекарство',
}

function todayLocal() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPet, setSavingPet] = useState(false)
  const [savingRecord, setSavingRecord] = useState(false)

  // Стейт для формы добавления питомца
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Собака')
  const [petBreed, setPetBreed] = useState('')
  const [petBirthDate, setPetBirthDate] = useState('')
  const [petFile, setPetFile] = useState<File | null>(null)

  // Стейт для записей
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [recordType, setRecordType] = useState('weight')
  const [recordValue, setRecordValue] = useState('')
  const [recordDate, setRecordDate] = useState(todayLocal())
  const [recordNote, setRecordNote] = useState('')
  const [recordNextDate, setRecordNextDate] = useState('') // Для напоминаний

  const selectedPet = pets.find(p => p.id === selectedPetId) || null

  const fetchPets = useCallback(async (autoSelectId?: string) => {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) { toast.error(error.message); return }
    setPets(data || [])
    if (autoSelectId) {
      setSelectedPetId(autoSelectId)
    } else {
      setSelectedPetId(prev => {
        if (prev && data?.some(p => p.id === prev)) return prev
        return data && data.length > 0 ? data[0].id : null
      })
    }
  }, [])

  const fetchRecords = useCallback(async (petId: string) => {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('pet_id', petId)
      .order('record_date', { ascending: false })
    if (error) toast.error(error.message)
    else setRecords(data || [])
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
    if (selectedPetId) fetchRecords(selectedPetId)
    else setRecords([])
  }, [selectedPetId, fetchRecords])

  // Функция загрузки фото
  async function uploadAvatar(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function addPet(e: React.FormEvent) {
    e.preventDefault()
    if (!petName.trim()) return toast.error('Введите имя питомца')
    setSavingPet(true)
    
    let avatarUrl = null
    try {
      if (petFile) {
        avatarUrl = await uploadAvatar(petFile)
      }
    } catch (error: any) {
      toast.error('Ошибка загрузки фото: ' + error.message)
    }

    const { data, error } = await supabase
      .from('pets')
      .insert({ 
        name: petName.trim(), 
        species: petSpecies, 
        breed: petBreed || null,
        birth_date: petBirthDate || null,
        avatar_url: avatarUrl,
        user_id: session.user.id 
      })
      .select()
      .single()
      
    setSavingPet(false)
    if (error) return toast.error(error.message)
    toast.success('Питомец добавлен!')
    
    // Очищаем форму
    setPetName('')
    setPetBreed('')
    setPetBirthDate('')
    setPetFile(null)
    
    fetchPets(data.id)
  }

  async function deletePet(id: string) {
    if (!confirm('Удалить питомца и все его записи?')) return
    const { error } = await supabase.from('pets').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Питомец удалён')
    if (selectedPetId === id) setSelectedPetId(null)
    setPets(prev => prev.filter(p => p.id !== id))
  }

  function startEditing(record: HealthRecord) {
    setEditingRecordId(record.id)
    setRecordType(record.type)
    setRecordValue(record.value)
    setRecordDate(record.record_date)
    setRecordNote(record.note || '')
    setRecordNextDate(record.next_date || '')
  }

  function resetForm() {
    setEditingRecordId(null)
    setRecordType('weight')
    setRecordValue('')
    setRecordDate(todayLocal())
    setRecordNote('')
    setRecordNextDate('')
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPetId) return toast.error('Выберите питомца')
    const trimmed = recordValue.trim()
    if (!trimmed) return toast.error('Введите значение')
    if (recordType === 'weight' && !/^\d+(\.\d+)?$/.test(trimmed)) {
      return toast.error('Вес должен быть числом, например 5.2')
    }
    
    setSavingRecord(true)
    const recordData = {
      type: recordType,
      value: trimmed,
      note: recordNote.trim() || null,
      record_date: recordDate,
      next_date: recordNextDate || null,
    }

    if (editingRecordId) {
      const { error } = await supabase.from('health_records').update(recordData).eq('id', editingRecordId)
      if (error) toast.error(error.message)
      else {
        toast.success('Запись обновлена!')
        fetchRecords(selectedPetId)
        resetForm()
      }
    } else {
      const { error } = await supabase.from('health_records').insert({
        ...recordData,
        pet_id: selectedPetId,
      })
      if (error) toast.error(error.message)
      else {
        toast.success('Запись добавлена!')
        fetchRecords(selectedPetId)
        resetForm()
      }
    }
    setSavingRecord(false)
  }

  async function deleteRecord(id: string) {
    const { error } = await supabase.from('health_records').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRecords(prev => prev.filter(r => r.id !== id))
    if (editingRecordId === id) resetForm()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPets([])
    setSelectedPetId(null)
    setRecords([])
    resetForm()
  }

  // Функция для проверки напоминаний
  function getReminderStatus(nextDate: string | null) {
    if (!nextDate) return null;
    const today = new Date(todayLocal());
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: '⚠️ Просрочено!', color: 'bg-red-100 text-red-700' };
    if (diffDays <= 7) return { text: `⏰ Через ${diffDays} дн.`, color: 'bg-orange-100 text-orange-700' };
    return { text: `📅 ${nextDate}`, color: 'text-gray-500' };
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-2">PawLog 🐾</h1>
          <p className="text-gray-600 text-center mb-6">Дневник здоровья вашего питомца</p>
          <AuthForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
        <h1 className="text-xl font-bold text-gray-800">🐾 PawLog</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">{session.user.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">Выйти</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
        
        {/* ЛЕВАЯ КОЛОНКА: ПИТОМЦЫ И ПРОФИЛЬ */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print:hidden">
          <h2 className="font-semibold text-gray-700 mb-4">Мои питомцы</h2>
          <div className="space-y-2 mb-4">
            {pets.map(pet => (
              <div
                key={pet.id}
                className={`flex items-center rounded-xl transition cursor-pointer ${
                  selectedPetId === pet.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => setSelectedPetId(pet.id)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ml-3 shrink-0">
                  {pet.avatar_url ? (
                    <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">🐾</span>
                  )}
                </div>
                <div className="flex-1 text-left px-3 py-2">
                  <span className="font-medium text-gray-800 block">{pet.name}</span>
                  <span className="text-xs text-gray-500">{pet.species} {pet.breed ? `• ${pet.breed}` : ''}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePet(pet.id); }}
                  className="px-3 text-gray-300 hover:text-red-500 transition"
                >
                  ×
                </button>
              </div>
            ))}
            {pets.length === 0 && <p className="text-sm text-gray-400">Пока нет питомцев</p>}
          </div>

          {/* Форма добавления питомца */}
          <form onSubmit={addPet} className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Добавить питомца</p>
            <input
              type="text"
              placeholder="Имя питомца"
              value={petName}
              onChange={e => setPetName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <div className="flex gap-2">
              <select
                value={petSpecies}
                onChange={e => setPetSpecies(e.target.value)}
                className="w-1/2 px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option>Собака</option>
                <option>Кошка</option>
                <option>Птица</option>
                <option>Грызун</option>
                <option>Другое</option>
              </select>
              <input
                type="text"
                placeholder="Порода"
                value={petBreed}
                onChange={e => setPetBreed(e.target.value)}
                className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <input
              type="date"
              title="Дата рождения"
              value={petBirthDate}
              onChange={e => setPetBirthDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <div className="text-sm">
              <label className="block text-gray-500 mb-1 text-xs">Фото питомца</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setPetFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={savingPet}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 mt-2"
            >
              {savingPet ? 'Загрузка...' : '+ Добавить питомца'}
            </button>
          </form>
        </section>

        {/* СРЕДНЯЯ КОЛОНКА: ФОРМА ЗАПИСИ */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print:hidden">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editingRecordId ? 'Редактировать запись' : 'Новая запись'}
          </h2>
          {selectedPet ? (
            <form onSubmit={saveRecord} className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">
                Для: <span className="font-medium text-gray-700">{selectedPet.name}</span>
              </p>
              <select
                value={recordType}
                onChange={e => setRecordType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="weight">Вес (кг)</option>
                <option value="vaccine">Прививка</option>
                <option value="medication">Лекарство</option>
              </select>
              <input
                type="text"
                placeholder={recordType === 'weight' ? 'Например, 12.5' : 'Название'}
                value={recordValue}
                onChange={e => setRecordValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Дата события</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={e => setRecordDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {(recordType === 'vaccine' || recordType === 'medication') && (
                <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                  <label className="block text-xs text-orange-600 font-medium mb-1">Напоминание (следующая дата)</label>
                  <input
                    type="date"
                    value={recordNextDate}
                    onChange={e => setRecordNextDate(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white"
                  />
                </div>
              )}

              <textarea
                placeholder="Заметка (необязательно)"
                value={recordNote}
                onChange={e => setRecordNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-16"
              />
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingRecord}
                  className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition ${
                    editingRecordId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {savingRecord ? 'Сохраняем...' : editingRecordId ? 'Обновить' : 'Сохранить'}
                </button>
                
                {editingRecordId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">Сначала добавьте питомца</p>
          )}
        </section>

        {/* ПРАВАЯ КОЛОНКА: ЛЕНТА И ПЕЧАТЬ */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print:border-none print:shadow-none print:p-0">
          
          <div className="flex justify-between items-center mb-4 print:mb-8">
            <h2 className="font-semibold text-gray-700">
              {selectedPet ? `История здоровья: ${selectedPet.name}` : 'Лента здоровья'}
            </h2>
            
            {selectedPet && records.length > 0 && (
              <button
                onClick={() => window.print()}
                className="print:hidden text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
              >
                🖨️ Печать / PDF
              </button>
            )}
          </div>

          {/* Блок профиля для печати */}
          <div className="hidden print:block mb-6 border-b pb-4">
            <div className="flex items-center gap-4 mb-2">
              {selectedPet?.avatar_url && <img src={selectedPet.avatar_url} className="w-16 h-16 rounded-full object-cover" />}
              <div>
                <h1 className="text-2xl font-bold">{selectedPet?.name}</h1>
                <p className="text-sm text-gray-500">
                  {selectedPet?.species} {selectedPet?.breed ? `• ${selectedPet.breed}` : ''}
                  {selectedPet?.birth_date ? ` • Дата рождения: ${selectedPet.birth_date}` : ''}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Дата отчета: {new Date().toLocaleDateString('ru-RU')}</p>
          </div>

          {selectedPet ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {records.length === 0 && <p className="text-sm text-gray-400">Пока нет записей</p>}
              {records.map(record => {
                const reminder = getReminderStatus(record.next_date);
                return (
                  <div key={record.id} className="border-l-4 border-blue-200 pl-3 py-1 print:border-gray-400 print:break-inside-avoid">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium uppercase text-blue-500 print:text-gray-800">
                        {RECORD_LABELS[record.type] || record.type}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{record.record_date}</span>
                        
                        <div className="flex gap-1 print:hidden">
                          <button onClick={() => startEditing(record)} className="text-gray-300 hover:text-blue-500 p-1">✏️</button>
                          <button onClick={() => deleteRecord(record.id)} className="text-gray-300 hover:text-red-500 p-1">×</button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {record.value}{record.type === 'weight' ? ' кг' : ''}
                    </p>
                    
                    {/* Блок напоминания */}
                    {reminder && (
                      <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${reminder.color}`}>
                        Следующий раз: {reminder.text}
                      </div>
                    )}

                    {record.note && <p className="text-xs text-gray-500 mt-1">{record.note}</p>}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Выберите питомца</p>
          )}
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
      else toast.success('Готово! Проверьте почту, если включено подтверждение.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm" required />
      <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm" minLength={6} required />
      <button type="submit" disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
        {busy ? 'Подождите...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
      </button>
      <button type="button" onClick={() => { setIsLogin(!isLogin); setPassword('') }} className="w-full text-xs text-gray-500 hover:text-gray-700">
        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </form>
  )
}

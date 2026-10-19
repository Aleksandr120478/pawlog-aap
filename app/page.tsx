'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

type Pet = { id: string; name: string; species: string | null }
type HealthRecord = {
  id: string
  pet_id: string
  type: string
  value: string
  note: string | null
  record_date: string
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

  // Стейт для формы
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Собака')

  // Стейт для записей и редактирования
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [recordType, setRecordType] = useState('weight')
  const [recordValue, setRecordValue] = useState('')
  const [recordDate, setRecordDate] = useState(todayLocal())
  const [recordNote, setRecordNote] = useState('')

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

  async function addPet(e: React.FormEvent) {
    e.preventDefault()
    if (!petName.trim()) return toast.error('Введите имя питомца')
    setSavingPet(true)
    const { data, error } = await supabase
      .from('pets')
      .insert({ name: petName.trim(), species: petSpecies, user_id: session.user.id })
      .select()
      .single()
    setSavingPet(false)
    if (error) return toast.error(error.message)
    toast.success('Питомец добавлен!')
    setPetName('')
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

  // Функция для кнопки "Редактировать"
  function startEditing(record: HealthRecord) {
    setEditingRecordId(record.id)
    setRecordType(record.type)
    setRecordValue(record.value)
    setRecordDate(record.record_date)
    setRecordNote(record.note || '')
  }

  // Очистка формы после сохранения или отмены
  function resetForm() {
    setEditingRecordId(null)
    setRecordType('weight')
    setRecordValue('')
    setRecordDate(todayLocal())
    setRecordNote('')
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
    
    // Если есть editingRecordId, значит мы ОБНОВЛЯЕМ, иначе СОЗДАЕМ
    if (editingRecordId) {
      const { error } = await supabase.from('health_records').update({
        type: recordType,
        value: trimmed,
        note: recordNote.trim() || null,
        record_date: recordDate,
      }).eq('id', editingRecordId)
      
      if (error) toast.error(error.message)
      else {
        toast.success('Запись обновлена!')
        fetchRecords(selectedPetId)
        resetForm()
      }
    } else {
      const { error } = await supabase.from('health_records').insert({
        pet_id: selectedPetId,
        type: recordType,
        value: trimmed,
        note: recordNote.trim() || null,
        record_date: recordDate,
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
    if (editingRecordId === id) resetForm() // Сбрасываем форму, если удалили запись, которую редактировали
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPets([])
    setSelectedPetId(null)
    setRecords([])
    resetForm()
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
      {/* Хедер скрывается при печати */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
        <h1 className="text-xl font-bold text-gray-800">🐾 PawLog</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">{session.user.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">Выйти</button>
        </div>
      </header>

      {/* При печати делаем одну колонку на всю ширину */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:block print:p-0">
        
        {/* Левая колонка: Питомцы (скрывается при печати) */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print:hidden">
          <h2 className="font-semibold text-gray-700 mb-4">Мои питомцы</h2>
          <div className="space-y-2 mb-4">
            {pets.map(pet => (
              <div
                key={pet.id}
                className={`flex items-center rounded-xl transition ${
                  selectedPetId === pet.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <button onClick={() => setSelectedPetId(pet.id)} className="flex-1 text-left px-4 py-3">
                  <span className="font-medium text-gray-800">{pet.name}</span>
                  {pet.species && <span className="text-sm text-gray-400 ml-2">{pet.species}</span>}
                </button>
                <button
                  onClick={() => deletePet(pet.id)}
                  className="px-3 text-gray-300 hover:text-red-500 transition"
                  aria-label="Удалить питомца"
                >
                  ×
                </button>
              </div>
            ))}
            {pets.length === 0 && <p className="text-sm text-gray-400">Пока нет питомцев</p>}
          </div>
          <form onSubmit={addPet} className="space-y-2 border-t pt-4">
            <input
              type="text"
              placeholder="Имя питомца"
              value={petName}
              onChange={e => setPetName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <select
              value={petSpecies}
              onChange={e => setPetSpecies(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option>Собака</option>
              <option>Кошка</option>
              <option>Птица</option>
              <option>Грызун</option>
              <option>Другое</option>
            </select>
            <button
              type="submit"
              disabled={savingPet}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
            >
              {savingPet ? 'Сохраняем...' : '+ Добавить питомца'}
            </button>
          </form>
        </section>

        {/* Средняя колонка: Форма записи (скрывается при печати) */}
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
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
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
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <input
                type="date"
                value={recordDate}
                onChange={e => setRecordDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <textarea
                placeholder="Заметка (необязательно)"
                value={recordNote}
                onChange={e => setRecordNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none h-20"
              />
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingRecord}
                  className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
                    editingRecordId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {savingRecord ? 'Сохраняем...' : editingRecordId ? 'Обновить запись' : 'Сохранить запись'}
                </button>
                
                {editingRecordId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">Сначала добавьте или выберите питомца</p>
          )}
        </section>

        {/* Правая колонка: Лента (при печати занимает весь лист) */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print:border-none print:shadow-none print:p-0">
          
          <div className="flex justify-between items-center mb-4 print:mb-8">
            <h2 className="font-semibold text-gray-700">
              {selectedPet ? `История здоровья: ${selectedPet.name}` : 'Лента здоровья'}
            </h2>
            
            {/* Кнопка печати (скрывается при печати) */}
            {selectedPet && records.length > 0 && (
              <button
                onClick={() => window.print()}
                className="print:hidden text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                title="Сохранить в PDF или распечатать"
              >
                🖨️ Печать / PDF
              </button>
            )}
          </div>

          {/* Текст, который появится ТОЛЬКО на распечатанном листе */}
          <div className="hidden print:block mb-6 text-sm text-gray-500">
            <p>Дата отчета: {new Date().toLocaleDateString('ru-RU')}</p>
            <p>Вид: {selectedPet?.species}</p>
          </div>

          {selectedPet ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {records.length === 0 && <p className="text-sm text-gray-400">Пока нет записей</p>}
              {records.map(record => (
                <div key={record.id} className="border-l-4 border-blue-200 pl-3 py-1 print:border-gray-400 print:break-inside-avoid">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium uppercase text-blue-500 print:text-gray-800">
                      {RECORD_LABELS[record.type] || record.type}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{record.record_date}</span>
                      
                      {/* Кнопки управления (скрываются при печати) */}
                      <div className="flex gap-1 print:hidden">
                        <button
                          onClick={() => startEditing(record)}
                          className="text-gray-300 hover:text-blue-500 transition p-1"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="text-gray-300 hover:text-red-500 transition p-1"
                          title="Удалить"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {record.value}{record.type === 'weight' ? ' кг' : ''}
                  </p>
                  {record.note && <p className="text-xs text-gray-500">{record.note}</p>}
                </div>
              ))}
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
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
        required
      />
      <input
        type="password"
        placeholder="Пароль (минимум 6 символов)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
        minLength={6}
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
      >
        {busy ? 'Подождите...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
      </button>
      <button
        type="button"
        onClick={() => { setIsLogin(!isLogin); setPassword('') }}
        className="w-full text-xs text-gray-500 hover:text-gray-700"
      >
        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </form>
  )
}

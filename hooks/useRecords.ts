'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { HealthRecord, PetDocument } from '../components/types'

function todayLocal() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

export function useRecords(selectedPetId: string | null, selectedPet: any, hasPremiumAccess: boolean, onOpenPremium: () => void) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [documents, setDocuments] = useState<PetDocument[]>([])
  const [savingRecord, setSavingRecord] = useState(false)

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null) // Вот он!
  const [recordType, setRecordType] = useState('weight')
  const [recordValue, setRecordValue] = useState('')
  const [recordDate, setRecordDate] = useState(todayLocal())
  const [recordNote, setRecordNote] = useState('')
  const [recordNextDate, setRecordNextDate] = useState('')

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
    if (selectedPetId) {
      fetchRecords(selectedPetId)
      fetchDocuments(selectedPetId)
    } else {
      setRecords([])
      setDocuments([])
    }
  }, [selectedPetId, fetchRecords, fetchDocuments])

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
    const toastId = toast.loading('Удаление документа...');
    try {
      const fileName = url.split('/').pop()
      if (fileName) await supabase.storage.from('documents').remove([fileName])
      const { error } = await supabase.from('pet_documents').delete().eq('id', docId)
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success('Документ удален', { id: toastId });
    } catch (error: any) {
      toast.error('Ошибка удаления: ' + error.message, { id: toastId });
    }
  }

  async function addVaccineTemplates() {
    if (!selectedPet) return
    let templates = []
    if (selectedPet.species === 'Собака') templates = ['Бешенство', 'Чума плотоядных', 'Парвовирусный энтерит', 'Лептоспироз']
    else if (selectedPet.species === 'Кошка') templates = ['Бешенство', 'Кальцивироз', 'Ринотрахеит', 'Панлейкопения']
    else return toast.error('Шаблоны доступны только для собак и кошек')

    if (!hasPremiumAccess && records.length + templates.length > 20) {
      onOpenPremium()
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

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPetId) return toast.error('Выберите питомца')
    const trimmed = recordValue.trim()
    if (!trimmed) return toast.error('Введите значение')
    if ((recordType === 'weight' || recordType === 'expense') && !/^\d+(\.\d+)?$/.test(trimmed)) {
      return toast.error('Введите число, например 5.2 или 1500')
    }
    
    if (!hasPremiumAccess && !editingRecordId && records.length >= 20) {
      onOpenPremium()
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
      if (error) {
        if (error.message.includes('LimitReached') || error.message.toLowerCase().includes('limit')) {
           onOpenPremium()
        } else {
           toast.error(error.message)
        }
      } else { 
        toast.success('Запись добавлена!'); fetchRecords(selectedPetId); resetRecordForm() 
      }
    }
    setSavingRecord(false)
  }

  async function deleteRecord(id: string) {
    if (!confirm('Удалить эту запись из истории?')) return
    const toastId = toast.loading('Удаление записи...');
    const { error } = await supabase.from('health_records').delete().eq('id', id)
    if (error) return toast.error(error.message, { id: toastId })
    setRecords(prev => prev.filter(r => r.id !== id))
    if (editingRecordId === id) resetRecordForm()
    toast.success('Запись удалена', { id: toastId })
  }

  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
  
  const upcomingEvents = records.filter(r => {
    if (!r.next_date) return false;
    const today = new Date(todayLocal()).getTime();
    const next = new Date(r.next_date).getTime();
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  })

  const weightData = records.filter(r => r.type === 'weight').map(r => ({ date: r.record_date, weight: parseFloat(r.value) })).reverse();

  return {
    records, documents, savingRecord, editingRecordId, setEditingRecordId, // <-- ДОБАВЛЕНО СЮДА
    recordType, setRecordType, recordValue, setRecordValue, recordDate, setRecordDate, recordNote, setRecordNote,
    recordNextDate, setRecordNextDate, startEditingRecord, resetRecordForm, saveRecord,
    deleteRecord, addVaccineTemplates, uploadDocument, deleteDocument, fetchRecords,
    totalExpenses, upcomingEvents, weightData
  }
}

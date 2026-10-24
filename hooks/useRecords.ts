import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { HealthRecord, Pet, PetDocument } from '../components/types'

export function useRecords(
  selectedPetId: string | null,
  selectedPet: Pet | null,
  hasPremiumAccess: boolean,
  onShowPremium: () => void
) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [documents, setDocuments] = useState<PetDocument[]>([])
  const [savingRecord, setSavingRecord] = useState(false)
  
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [recordType, setRecordType] = useState('weight')
  const [recordValue, setRecordValue] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [recordNote, setRecordNote] = useState('')
  const [recordNextDate, setRecordNextDate] = useState('')

  const fetchRecords = useCallback(async () => {
    if (!selectedPetId) {
      setRecords([])
      setDocuments([])
      return
    }
    
    // Ограничение 50 записями для защиты от зависаний
    const { data: recs } = await supabase.from('health_records').select('*').eq('pet_id', selectedPetId).order('record_date', { ascending: false }).limit(50)
    const { data: docs } = await supabase.from('pet_documents').select('*').eq('pet_id', selectedPetId).order('created_at', { ascending: false })
    
    if (recs) setRecords(recs)
    if (docs) setDocuments(docs)
  }, [selectedPetId])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const startEditingRecord = (record: HealthRecord) => {
    setEditingRecordId(record.id)
    setRecordType(record.type || 'weight')
    setRecordValue(record.value || '') // <-- ИСПРАВЛЕНО (добавлено || '')
    setRecordDate(record.record_date)
    setRecordNote(record.note || '')
    setRecordNextDate(record.next_date || '')
  }

  const resetRecordForm = () => {
    setEditingRecordId(null)
    setRecordType('weight')
    setRecordValue('')
    setRecordDate(new Date().toISOString().split('T')[0])
    setRecordNote('')
    setRecordNextDate('')
  }

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPetId) return
    if (!hasPremiumAccess && records.length >= 20 && !editingRecordId) return onShowPremium()

    setSavingRecord(true)
    
    const payload = {
      pet_id: selectedPetId,
      type: recordType,
      value: recordValue || null,
      record_date: recordDate,
      note: recordNote || null,
      next_date: recordNextDate || null
    }

    if (editingRecordId) {
      const { error } = await supabase.from('health_records').update(payload).eq('id', editingRecordId)
      if (error) toast.error(error.message)
      else {
        toast.success('Запись обновлена')
        fetchRecords()
        resetRecordForm()
      }
    } else {
      const { error } = await supabase.from('health_records').insert(payload)
      if (error) toast.error(error.message)
      else {
        toast.success('Запись добавлена')
        fetchRecords()
        resetRecordForm()
      }
    }
    setSavingRecord(false)
  }

  const deleteRecord = async (id: string) => {
    if (!confirm('Удалить запись?')) return
    const { error } = await supabase.from('health_records').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Запись удалена')
      fetchRecords()
    }
  }

  const addVaccineTemplates = () => {
    // Заглушка для быстрых прививок (если нужно, можно расширить)
    setRecordType('vaccine')
    setRecordValue('Комплексная прививка')
    toast.success('Выбран шаблон прививки')
  }

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedPetId) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Файл больше 5MB')
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${selectedPetId}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
    if (uploadError) return toast.error(uploadError.message)
    
    const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName)
    
    const { error } = await supabase.from('pet_documents').insert({
      pet_id: selectedPetId,
      name: file.name,
      url: publicUrlData.publicUrl
    })
    
    if (error) toast.error(error.message)
    else {
      toast.success('Документ загружен')
      fetchRecords()
    }
  }

  const deleteDocument = async (id: string, path: string) => {
    if (!confirm('Удалить документ?')) return
    const { error } = await supabase.from('pet_documents').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Документ удален')
      fetchRecords()
    }
  }

  // Расчет статистики
  const totalExpenses = useMemo(() => {
    return records.filter(r => r.type === 'expense' && r.value).reduce((acc, r) => acc + Number(r.value), 0)
  }, [records])

  const upcomingEvents = useMemo(() => {
    return records
      .filter(r => r.next_date)
      .sort((a, b) => new Date(a.next_date!).getTime() - new Date(b.next_date!).getTime())
  }, [records])

  const weightData = useMemo(() => {
    return records
      .filter(r => r.type === 'weight' && r.value)
      .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime())
      .map(r => ({ date: r.record_date, weight: Number(r.value) }))
  }, [records])

  return {
    records, documents, savingRecord, editingRecordId, setEditingRecordId,
    recordType, setRecordType, recordValue, setRecordValue, recordDate, setRecordDate, recordNote, setRecordNote,
    recordNextDate, setRecordNextDate, startEditingRecord, resetRecordForm, saveRecord,
    deleteRecord, addVaccineTemplates, uploadDocument, deleteDocument,
    totalExpenses, upcomingEvents, weightData
  }
}
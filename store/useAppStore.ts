import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { Pet, HealthRecord, PetDocument, PetShare } from '../components/types'
import { Session } from '@supabase/supabase-js'

const PAGE_SIZE = 50

interface AppState {
  // Сессия и статус
  session: Session | null
  setSession: (session: Session | null) => void
  hasPremiumAccess: boolean
  
  isDark: boolean
  toggleTheme: () => Promise<void>

  showPremiumModal: boolean
  setShowPremiumModal: (show: boolean) => void
  isPremium: boolean
  trialEndsAt: string | null
  trialDaysLeft: number | null
  billingPeriod: 'monthly' | 'annual'
  setBillingPeriod: (v: 'monthly' | 'annual') => void
  fetchUserStatus: (userId: string) => Promise<void>
  startFreeTrial: () => Promise<void>
  handleMockPayment: () => Promise<void>

  // Модалка Настроек
  showSettingsModal: boolean
  setShowSettingsModal: (show: boolean) => void
  newPassword: string
  setNewPassword: (v: string) => void
  updatingPassword: boolean
  updatePassword: (e: React.FormEvent) => Promise<void>
  handleDeleteAccount: () => Promise<void>

  // Модалка Поделиться
  showShareModal: boolean
  setShowShareModal: (show: boolean) => void
  shareEmail: string
  setShareEmail: (v: string) => void
  sharingPetId: string | null
  petShares: PetShare[]
  fetchPetShares: (petId: string) => Promise<void>
  openShareModal: (petId: string) => void
  handleShare: (e: React.FormEvent) => Promise<void>
  removeShare: (shareId: string) => Promise<void>

  // --- СОСТОЯНИЕ ПИТОМЦЕВ ---
  pets: Pet[]
  selectedPetId: string | null
  setSelectedPetId: (id: string | null) => void
  savingPet: boolean
  editingPetId: string | null
  petName: string
  setPetName: (v: string) => void
  petSpecies: string
  setPetSpecies: (v: string) => void
  petBreed: string
  setPetBreed: (v: string) => void
  petBirthDate: string
  setPetBirthDate: (v: string) => void
  petFile: File | null
  setPetFile: (v: File | null) => void
  petAvatarUrl: string | null
  petAllergies: string
  setPetAllergies: (v: string) => void
  petChronic: string
  setPetChronic: (v: string) => void
  petFood: string
  setPetFood: (v: string) => void
  petVet: string
  setPetVet: (v: string) => void

  // --- СОСТОЯНИЕ ЗАПИСЕЙ ---
  records: HealthRecord[]
  documents: PetDocument[]
  savingRecord: boolean
  editingRecordId: string | null
  setEditingRecordId: (id: string | null) => void
  recordType: string
  setRecordType: (v: string) => void
  recordValue: string
  setRecordValue: (v: string) => void
  recordDate: string
  setRecordDate: (v: string) => void
  recordNote: string
  setRecordNote: (v: string) => void
  recordNextDate: string
  setRecordNextDate: (v: string) => void
  
  // Пагинация
  recordsPage: number
  hasMoreRecords: boolean
  loadingMoreRecords: boolean

  // --- ДЕЙСТВИЯ ---
  fetchPets: () => Promise<void>
  startEditingPet: (pet: Pet) => void
  resetPetForm: () => void
  savePet: (e: React.FormEvent) => Promise<void>
  deletePet: (id: string) => Promise<void>

  fetchRecords: (page?: number, append?: boolean) => Promise<void>
  fetchDocuments: () => Promise<void>
  loadMoreRecords: () => void
  startEditingRecord: (record: HealthRecord) => void
  resetRecordForm: () => void
  saveRecord: (e: React.FormEvent) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  addVaccineTemplates: () => void
  uploadDocument: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  deleteDocument: (id: string, url: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // Инициализация
  session: null,
  setSession: (session) => set({ session }),
  hasPremiumAccess: false,
  isDark: false,
  
  toggleTheme: async () => {
    const { isDark, session } = get()
    const newTheme = isDark ? 'light' : 'dark'
    set({ isDark: newTheme === 'dark' })
    if (newTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', newTheme)
    if (session) {
      await supabase.from('user_status').update({ theme: newTheme }).eq('user_id', session.user.id)
    }
  },

  showPremiumModal: false,
  setShowPremiumModal: (showPremiumModal) => set({ showPremiumModal }),
  isPremium: false,
  trialEndsAt: null,
  trialDaysLeft: null,
  billingPeriod: 'annual',
  setBillingPeriod: (billingPeriod) => set({ billingPeriod }),

  showSettingsModal: false,
  setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
  newPassword: '',
  setNewPassword: (newPassword) => set({ newPassword }),
  updatingPassword: false,

  showShareModal: false,
  setShowShareModal: (showShareModal) => set({ showShareModal }),
  shareEmail: '',
  setShareEmail: (shareEmail) => set({ shareEmail }),
  sharingPetId: null,
  petShares: [],

  fetchUserStatus: async (userId) => {
    let { data } = await supabase.from('user_status').select('*').eq('user_id', userId).maybeSingle()
    if (!data) {
      const { data: newData, error: insertError } = await supabase.from('user_status').insert({ user_id: userId }).select().single()
      if (!insertError) data = newData
      else if (insertError.code === '23505') {
        const { data: retryData } = await supabase.from('user_status').select('*').eq('user_id', userId).single()
        if (retryData) data = retryData
      }
    }
    if (data) {
      const isPrem = data.is_premium || false
      let tEndsAt = null
      let tDaysLeft = null
      if (data.trial_ends_at) {
        tEndsAt = data.trial_ends_at
        const end = new Date(data.trial_ends_at).getTime()
        const now = new Date().getTime()
        const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
        tDaysLeft = days > 0 ? days : 0
      }
      
      set({ 
        isPremium: isPrem, 
        trialEndsAt: tEndsAt,
        trialDaysLeft: tDaysLeft,
        hasPremiumAccess: isPrem || (tDaysLeft !== null && tDaysLeft > 0)
      })

      if (data.theme) {
        const isDarkTheme = data.theme === 'dark'
        set({ isDark: isDarkTheme })
        if (isDarkTheme) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', data.theme)
      }
    }
  },

  startFreeTrial: async () => {
    const { session, fetchUserStatus } = get()
    if (!session) return
    const toastId = toast.loading('Активация Premium...', { id: 'trial-loading' })
    const { error } = await supabase.rpc('start_free_trial')
    if (error) {
      toast.error(error.message, { id: toastId })
    } else {
      toast.success('Пробный период на 7 дней активирован!', { id: toastId })
      set({ showPremiumModal: false })
      fetchUserStatus(session.user.id)
    }
  },

  handleMockPayment: async () => {
    const { session } = get()
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
      set({ isPremium: true, showPremiumModal: false, hasPremiumAccess: true });
    }
  },

  updatePassword: async (e) => {
    e.preventDefault()
    const { newPassword } = get()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов', { id: 'pass-error' })
      return
    }
    set({ updatingPassword: true })
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    set({ updatingPassword: false })
    if (error) toast.error(error.message, { id: 'pass-error' })
    else {
      toast.success('Пароль успешно изменен!', { id: 'pass-success' })
      set({ newPassword: '', showSettingsModal: false })
    }
  },

  handleDeleteAccount: async () => {
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
  },

  fetchPetShares: async (petId) => {
    const { data } = await supabase.from('pet_shares').select('*').eq('pet_id', petId)
    set({ petShares: data || [] })
  },

  openShareModal: (petId) => {
    set({ sharingPetId: petId, shareEmail: '', showShareModal: true })
    get().fetchPetShares(petId)
  },

  handleShare: async (e) => {
    e.preventDefault()
    const { shareEmail, sharingPetId, session, fetchPetShares } = get()
    const cleanEmail = shareEmail.trim().toLowerCase();
    
    if (!cleanEmail || !sharingPetId) {
      toast.error('Введите email', { id: 'share-error' })
      return
    }
    if (cleanEmail === session?.user.email?.toLowerCase()) {
      toast.error('Вы не можете поделиться с самим собой', { id: 'share-error' })
      return
    }

    const toastId = toast.loading('Отправка приглашения...', { id: 'share-loading' })
    const { data: existing } = await supabase.from('pet_shares').select('id').eq('pet_id', sharingPetId).eq('shared_with_email', cleanEmail).single()

    if (existing) {
      toast.error('Этот пользователь уже имеет доступ', { id: toastId })
      return
    }

    const { error } = await supabase.from('pet_shares').insert({ pet_id: sharingPetId, shared_with_email: cleanEmail })
    if (error) toast.error(error.message, { id: toastId })
    else {
      toast.success('Доступ предоставлен!', { id: toastId })
      set({ shareEmail: '' })
      fetchPetShares(sharingPetId)
    }
  },

  removeShare: async (shareId) => {
    const { sharingPetId, fetchPetShares } = get()
    if (!sharingPetId) return
    const { error } = await supabase.from('pet_shares').delete().eq('id', shareId)
    if (error) toast.error(error.message, { id: 'remove-share-error' })
    else {
      toast.success('Доступ отозван', { id: 'remove-share-success' })
      fetchPetShares(sharingPetId)
    }
  },

  // Инициализация питомцев
  pets: [],
  selectedPetId: null,
  setSelectedPetId: (id) => {
    set({ selectedPetId: id, recordsPage: 0 })
    get().fetchRecords(0, false)
    get().fetchDocuments()
  },
  savingPet: false,
  editingPetId: null,
  petName: '',
  setPetName: (petName) => set({ petName }),
  petSpecies: 'Собака',
  setPetSpecies: (petSpecies) => set({ petSpecies }),
  petBreed: '',
  setPetBreed: (petBreed) => set({ petBreed }),
  petBirthDate: '',
  setPetBirthDate: (petBirthDate) => set({ petBirthDate }),
  petFile: null,
  setPetFile: (petFile) => set({ petFile }),
  petAvatarUrl: null,
  petAllergies: '',
  setPetAllergies: (petAllergies) => set({ petAllergies }),
  petChronic: '',
  setPetChronic: (petChronic) => set({ petChronic }),
  petFood: '',
  setPetFood: (petFood) => set({ petFood }),
  petVet: '',
  setPetVet: (petVet) => set({ petVet }),

  // Инициализация записей
  records: [],
  documents: [],
  savingRecord: false,
  editingRecordId: null,
  setEditingRecordId: (editingRecordId) => set({ editingRecordId }),
  recordType: 'weight',
  setRecordType: (recordType) => set({ recordType }),
  recordValue: '',
  setRecordValue: (recordValue) => set({ recordValue }),
  recordDate: new Date().toISOString().split('T')[0],
  setRecordDate: (recordDate) => set({ recordDate }),
  recordNote: '',
  setRecordNote: (recordNote) => set({ recordNote }),
  recordNextDate: '',
  setRecordNextDate: (recordNextDate) => set({ recordNextDate }),

  // Пагинация
  recordsPage: 0,
  hasMoreRecords: false,
  loadingMoreRecords: false,

  // --- ДЕЙСТВИЯ ПИТОМЦЕВ ---
  fetchPets: async () => {
    const { session } = get()
    if (!session?.user?.id) return
    const { data, error } = await supabase.from('pets').select('*').order('created_at', { ascending: true })
    
    if (error) {
      toast.error('Ошибка загрузки питомцев: ' + error.message, { id: 'fetch-pets-error' })
    } else {
      set({ pets: data || [] })
      const { selectedPetId } = get()
      if (!selectedPetId && data && data.length > 0) {
        get().setSelectedPetId(data[0].id)
      }
    }
  },

  startEditingPet: (pet) => set({
    editingPetId: pet.id,
    petName: pet.name,
    petSpecies: pet.species || 'Собака',
    petBreed: pet.breed || '',
    petBirthDate: pet.birth_date || '',
    petAvatarUrl: pet.avatar_url || null,
    petFile: null,
    petAllergies: pet.allergies || '',
    petChronic: pet.chronic_diseases || '',
    petFood: pet.food || '',
    petVet: pet.vet_contact || ''
  }),

  resetPetForm: () => set({
    editingPetId: null,
    petName: '',
    petSpecies: 'Собака',
    petBreed: '',
    petBirthDate: '',
    petFile: null,
    petAvatarUrl: null,
    petAllergies: '',
    petChronic: '',
    petFood: '',
    petVet: ''
  }),

  savePet: async (e) => {
    e.preventDefault()
    const { session, petName, hasPremiumAccess, pets, editingPetId, petFile, petAvatarUrl, 
            petSpecies, petBreed, petBirthDate, petAllergies, petChronic, petFood, petVet } = get()
    
    if (!session || !petName.trim()) return
    if (!hasPremiumAccess && pets.length >= 2 && !editingPetId) {
      get().setShowPremiumModal(true)
      return
    }

    set({ savingPet: true })
    let uploadedAvatarUrl = petAvatarUrl

    if (petFile) {
      const fileExt = petFile.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, petFile)
      
      if (uploadError) {
        toast.error('Ошибка загрузки фото: ' + uploadError.message, { id: 'upload-error' })
        set({ savingPet: false })
        return
      }
      if (data) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        uploadedAvatarUrl = publicUrlData.publicUrl
      }
    }

    const petData = {
      name: petName,
      species: petSpecies,
      breed: petBreed,
      birth_date: petBirthDate || null,
      avatar_url: uploadedAvatarUrl,
      allergies: petAllergies,
      chronic_diseases: petChronic,
      food: petFood,
      vet_contact: petVet
    }

    if (editingPetId) {
      const { error } = await supabase.from('pets').update(petData).eq('id', editingPetId)
      if (error) toast.error(error.message, { id: 'save-pet-error' })
      else {
        toast.success('Питомец обновлен!', { id: 'save-pet-success' })
        get().fetchPets()
        get().resetPetForm()
      }
    } else {
      const { error } = await supabase.from('pets').insert({ ...petData, user_id: session.user.id })
      if (error) toast.error(error.message, { id: 'save-pet-error' })
      else {
        toast.success('Питомец добавлен!', { id: 'save-pet-success' })
        get().fetchPets()
        get().resetPetForm()
      }
    }
    set({ savingPet: false })
  },

  deletePet: async (id) => {
    if (!confirm('Вы уверены, что хотите удалить питомца и все его записи?')) return
    const { error } = await supabase.from('pets').delete().eq('id', id)
    if (error) toast.error(error.message, { id: 'delete-pet-error' })
    else {
      toast.success('Питомец удален', { id: 'delete-pet-success' })
      if (get().selectedPetId === id) {
        set({ selectedPetId: null, records: [], documents: [] })
      }
      get().fetchPets()
    }
  },

  // --- ДЕЙСТВИЯ ЗАПИСЕЙ ---
  fetchRecords: async (page = 0, append = false) => {
    const { selectedPetId } = get()
    if (!selectedPetId) {
      set({ records: [], hasMoreRecords: false })
      return
    }
    
    if (append) set({ loadingMoreRecords: true })

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: recs, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('pet_id', selectedPetId)
      .order('record_date', { ascending: false })
      .range(from, to)

    if (error) {
      toast.error('Ошибка загрузки записей')
    } else if (recs) {
      if (append) {
        set((state) => ({ records: [...state.records, ...recs] }))
      } else {
        set({ records: recs })
      }
      set({ hasMoreRecords: recs.length === PAGE_SIZE, recordsPage: page })
    }
    
    if (append) set({ loadingMoreRecords: false })
  },

  fetchDocuments: async () => {
    const { selectedPetId } = get()
    if (!selectedPetId) {
      set({ documents: [] })
      return
    }
    const { data: docs } = await supabase
      .from('pet_documents')
      .select('*')
      .eq('pet_id', selectedPetId)
      .order('created_at', { ascending: false })
    
    if (docs) set({ documents: docs })
  },

  loadMoreRecords: () => {
    const { loadingMoreRecords, hasMoreRecords, recordsPage, fetchRecords } = get()
    if (!loadingMoreRecords && hasMoreRecords) {
      fetchRecords(recordsPage + 1, true)
    }
  },

  startEditingRecord: (record) => set({
    editingRecordId: record.id,
    recordType: record.type || 'weight',
    recordValue: record.value || '',
    recordDate: record.record_date,
    recordNote: record.note || '',
    recordNextDate: record.next_date || ''
  }),

  resetRecordForm: () => set({
    editingRecordId: null,
    recordType: 'weight',
    recordValue: '',
    recordDate: new Date().toISOString().split('T')[0],
    recordNote: '',
    recordNextDate: ''
  }),

  saveRecord: async (e) => {
    e.preventDefault()
    const { selectedPetId, hasPremiumAccess, records, editingRecordId, recordType, recordValue, recordDate, recordNote, recordNextDate } = get()
    
    if (!selectedPetId) return
    if (!hasPremiumAccess && records.length >= 20 && !editingRecordId) {
      get().setShowPremiumModal(true)
      return
    }

    set({ savingRecord: true })
    
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
        get().fetchRecords(0, false)
        get().resetRecordForm()
      }
    } else {
      const { error } = await supabase.from('health_records').insert(payload)
      if (error) toast.error(error.message)
      else {
        toast.success('Запись добавлена')
        get().fetchRecords(0, false)
        get().resetRecordForm()
      }
    }
    set({ savingRecord: false })
  },

  deleteRecord: async (id) => {
    if (!confirm('Удалить запись?')) return
    const { error } = await supabase.from('health_records').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Запись удалена')
      get().fetchRecords(0, false)
    }
  },

  addVaccineTemplates: () => {
    set({ recordType: 'vaccine', recordValue: 'Комплексная прививка' })
    toast.success('Выбран шаблон прививки')
  },

  uploadDocument: async (e) => {
    const file = e.target.files?.[0]
    const { selectedPetId } = get()
    if (!file || !selectedPetId) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл больше 5MB')
      return
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${selectedPetId}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
    if (uploadError) {
      toast.error(uploadError.message)
      return
    }
    
    const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName)
    
    const { error } = await supabase.from('pet_documents').insert({
      pet_id: selectedPetId,
      name: file.name,
      url: publicUrlData.publicUrl
    })
    
    if (error) toast.error(error.message)
    else {
      toast.success('Документ загружен')
      get().fetchDocuments()
    }
  },

  deleteDocument: async (id, url) => {
    if (!confirm('Удалить документ?')) return
    
    let filePath = ''
    if (url) {
      const urlParts = url.split('/')
      filePath = urlParts[urlParts.length - 1]
    }

    if (filePath) {
      await supabase.storage.from('documents').remove([filePath])
    }

    const { error } = await supabase.from('pet_documents').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Документ удален')
      get().fetchDocuments()
    }
  }
}))
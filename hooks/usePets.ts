'use client'
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { Pet } from '../components/types'

export function usePets(session: any, hasPremiumAccess: boolean, onOpenPremium: () => void) {
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [savingPet, setSavingPet] = useState(false)
  
  // Состояния формы питомца
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

  const selectedPet = pets.find(p => p.id === selectedPetId) || null
  const ownedPetsCount = pets.filter(p => p.user_id === session?.user?.id).length

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

  async function uploadAvatar(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data } = await supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function savePet(e: React.FormEvent) {
    e.preventDefault()
    if (!petName.trim()) return toast.error('Введите имя питомца')
    
    // Проверка лимита
    if (!hasPremiumAccess && !editingPetId && ownedPetsCount >= 2) {
      onOpenPremium()
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
      
      if (error) {
        if (error.message.includes('LimitReached') || error.message.toLowerCase().includes('limit')) {
           onOpenPremium()
        } else {
           toast.error(error.message)
        }
      } else { 
        toast.success('Питомец добавлен!'); fetchPets(data.id); resetPetForm() 
      }
    }
    setSavingPet(false)
  }

  async function deletePet(id: string) {
    if (!confirm('Удалить питомца и все его записи?')) return
    
    const toastId = toast.loading('Удаление питомца...');
    const { error } = await supabase.from('pets').delete().eq('id', id)
    
    if (error) return toast.error(error.message, { id: toastId })
    
    toast.success('Питомец удалён', { id: toastId })
    if (selectedPetId === id) setSelectedPetId(null)
    setPets(prev => prev.filter(p => p.id !== id))
    if (editingPetId === id) resetPetForm()
  }

  return {
    pets, setPets, selectedPetId, setSelectedPetId, selectedPet, savingPet, ownedPetsCount,
    fetchPets, editingPetId, petName, setPetName, petSpecies, setPetSpecies, petBreed, setPetBreed,
    petBirthDate, setPetBirthDate, petFile, setPetFile, petAllergies, setPetAllergies, 
    petChronic, setPetChronic, petFood, setPetFood, petVet, setPetVet, 
    startEditingPet, resetPetForm, savePet, deletePet
  }
}

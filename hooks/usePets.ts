import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { Pet } from '../components/types'
import { Session } from '@supabase/supabase-js'

export function usePets(session: Session | null, hasPremiumAccess: boolean, onShowPremium: () => void) {
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [savingPet, setSavingPet] = useState(false)
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
  const ownedPetsCount = pets.length

  const fetchPets = useCallback(async () => {
    if (!session) return
    const { data, error } = await supabase.from('pets').select('*').order('created_at', { ascending: true })
    if (error) toast.error(error.message)
    else {
      setPets(data || [])
      if (data && data.length > 0 && !selectedPetId) {
        setSelectedPetId(data[0].id)
      }
    }
  }, [session, selectedPetId])

  const startEditingPet = (pet: Pet) => {
    setEditingPetId(pet.id)
    setPetName(pet.name)
    setPetSpecies(pet.species || 'Собака')
    setPetBreed(pet.breed || '')
    setPetBirthDate(pet.birth_date || '')
    setPetAvatarUrl(pet.avatar_url || null) // <-- ИСПРАВЛЕНО: добавлено || null
    setPetFile(null)
    setPetAllergies(pet.allergies || '')
    setPetChronic(pet.chronic_diseases || '')
    setPetFood(pet.food || '')
    setPetVet(pet.vet_contact || '')
  }

  const resetPetForm = () => {
    setEditingPetId(null)
    setPetName('')
    setPetSpecies('Собака')
    setPetBreed('')
    setPetBirthDate('')
    setPetFile(null)
    setPetAvatarUrl(null)
    setPetAllergies('')
    setPetChronic('')
    setPetFood('')
    setPetVet('')
  }

  const savePet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !petName.trim()) return
    if (!hasPremiumAccess && ownedPetsCount >= 2 && !editingPetId) return onShowPremium()

    setSavingPet(true)
    let uploadedAvatarUrl = petAvatarUrl

    if (petFile) {
      const fileExt = petFile.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, petFile)
      if (uploadError) {
        toast.error('Ошибка загрузки фото: ' + uploadError.message)
        setSavingPet(false)
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
      if (error) toast.error(error.message)
      else {
        toast.success('Питомец обновлен!')
        fetchPets()
        resetPetForm()
      }
    } else {
      const { error } = await supabase.from('pets').insert({ ...petData, user_id: session.user.id })
      if (error) toast.error(error.message)
      else {
        toast.success('Питомец добавлен!')
        fetchPets()
        resetPetForm()
      }
    }
    setSavingPet(false)
  }

  const deletePet = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить питомца и все его записи?')) return
    const { error } = await supabase.from('pets').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Питомец удален')
      if (selectedPetId === id) setSelectedPetId(null)
      fetchPets()
    }
  }

  return {
    pets, setPets, selectedPetId, setSelectedPetId, selectedPet, savingPet, ownedPetsCount,
    fetchPets, editingPetId, petName, setPetName, petSpecies, setPetSpecies, petBreed, setPetBreed,
    petBirthDate, setPetBirthDate, petFile, setPetFile, petAllergies, setPetAllergies,
    petChronic, setPetChronic, petFood, setPetFood, petVet, setPetVet,
    startEditingPet, resetPetForm, savePet, deletePet
  }
}
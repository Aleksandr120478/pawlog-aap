// components/PetsSidebar.tsx
'use client'
import { Pet, SPECIES_ICONS } from './types'
import { Session } from '@supabase/supabase-js'

interface PetsSidebarProps {
  pets: Pet[];
  selectedPetId: string | null;
  setSelectedPetId: (id: string) => void;
  session: Session | null; // <--- Убрали any, добавили строгий тип
  hasPremiumAccess: boolean;
  ownedPetsCount: number;
  editingPetId: string | null;
  petName: string;
  setPetName: (v: string) => void;
  petSpecies: string;
  setPetSpecies: (v: string) => void;
  petBreed: string;
  setPetBreed: (v: string) => void;
  petBirthDate: string;
  setPetBirthDate: (v: string) => void;
  petFile: File | null;
  setPetFile: (v: File | null) => void;
  petAllergies: string;
  setPetAllergies: (v: string) => void;
  petChronic: string;
  setPetChronic: (v: string) => void;
  petFood: string;
  setPetFood: (v: string) => void;
  petVet: string;
  setPetVet: (v: string) => void;
  savingPet: boolean;
  savePet: (e: React.FormEvent) => void;
  deletePet: (id: string) => void;
  startEditingPet: (pet: Pet) => void;
  resetPetForm: () => void;
  openShareModal: (id: string) => void;
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

export default function PetsSidebar({
  pets, selectedPetId, setSelectedPetId, session, hasPremiumAccess, ownedPetsCount,
  editingPetId, petName, setPetName, petSpecies, setPetSpecies, petBreed, setPetBreed,
  petBirthDate, setPetBirthDate, petFile, setPetFile, petAllergies, setPetAllergies,
  petChronic, setPetChronic, petFood, setPetFood, petVet, setPetVet,
  savingPet, savePet, deletePet, startEditingPet, resetPetForm, openShareModal
}: PetsSidebarProps) {
  return (
    <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Мои питомцы</h2>
        {!hasPremiumAccess && <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded-full font-medium">Лимит: {ownedPetsCount}/2</span>}
      </div>
      
      <div className="space-y-2 mb-4">
        {pets.length === 0 ? (
          <div className="text-center p-6 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-dashed border-rose-200 dark:border-rose-800 mb-2">
            <span className="text-4xl mb-2 block">{SPECIES_ICONS[petSpecies] || '🐾'}</span>
            <p className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">Шаг 1. Добавьте питомца</p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">Заполните форму ниже.</p>
            <div className="text-2xl animate-bounce mt-2">↓</div>
          </div>
        ) : (
          pets.map((pet) => {
            const isOwner = pet.user_id === session?.user?.id;
            return (
              <div key={pet.id} onClick={() => setSelectedPetId(pet.id)} className={`flex items-center rounded-xl transition cursor-pointer ${selectedPetId === pet.id ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 border' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden ml-3 shrink-0">
                  {pet.avatar_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                    </>
                  ) : (
                    <span className="text-lg">🐾</span>
                  )}
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
  )
}
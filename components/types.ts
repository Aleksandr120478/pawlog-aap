export type Pet = { 
  id: string; name: string; species: string | null;
  breed: string | null; birth_date: string | null; avatar_url: string | null;
  allergies: string | null; chronic_diseases: string | null; food: string | null; vet_contact: string | null;
  user_id: string;
}

export type HealthRecord = {
  id: string; pet_id: string; type: string; value: string;
  note: string | null; record_date: string; next_date: string | null;
}

export type PetDocument = {
  id: string; pet_id: string; name: string; url: string; created_at: string;
}

export const RECORD_LABELS: Record<string, string> = {
  weight: 'Вес', vaccine: 'Прививка', medication: 'Лекарство', note: 'Заметка', expense: 'Расход (₽)'
}

export const SPECIES_ICONS: Record<string, string> = {
  'Собака': '🐶', 'Кошка': '🐱', 'Попугай': '🦜', 'Хомяк': '🐹',
  'Кролик': '🐰', 'Морская свинка': '🐹', 'Крыса': '🐀', 'Шиншилла': '🐭',
  'Канарейка': '🐦', 'Хорёк': '🦦', 'Черепаха': '🐢', 'Ящерица': '🦎',
  'Змея': '🐍', 'Ёжик': '🦔', 'Рыбка': '🐟', 'Другое': '🐾'
}

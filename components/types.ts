export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
  allergies?: string | null;
  chronic_diseases?: string | null;
  food?: string | null;
  vet_contact?: string | null;
  created_at?: string;
}

export interface HealthRecord {
  id: string;
  pet_id: string;
  type: string;
  value?: string | null;
  record_date: string;
  note?: string | null;
  next_date?: string | null;
  created_at?: string;
}

export interface PetDocument {
  id: string;
  pet_id: string;
  name: string;
  url: string;
  created_at?: string;
}

export interface PetShare {
  id: string;
  pet_id: string;
  shared_with_email: string;
  created_at?: string;
}

export const RECORD_LABELS: Record<string, string> = {
  weight: 'Вес',
  vaccine: 'Прививка',
  vet: 'Визит к врачу',
  medication: 'Лекарство',
  expense: 'Расход',
  note: 'Заметка',
};

export const SPECIES_ICONS: Record<string, string> = {
  'Собака': '🐶',
  'Кошка': '🐱',
  'Попугай': '🦜',
  'Кролик': '🐰',
  'Хомяк': '🐹',
  'Черепаха': '🐢',
  'Другое': '🐾'
};
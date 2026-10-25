// app/emergency/[token]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import type { EmergencyPetInfo } from '@/components/types';

export const metadata: Metadata = {
  title: 'Экстренная карточка питомца',
  robots: {
    index: false,
    follow: false,
  },
};

interface EmergencyPageProps {
  params: {
    token: string;
  };
}

export default async function EmergencyPage({ params }: EmergencyPageProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('get_emergency_pet_info', {
    token: params.token,
  });

  if (error || !data) {
    notFound(); 
  }

  const pet = (Array.isArray(data) ? data[0] : data) as EmergencyPetInfo;

  if (!pet || !pet.name) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Экстренная карточка</h1>
          <p className="mt-2 text-sm text-gray-500">
            Если вы нашли этого питомца, свяжитесь с владельцем
          </p>
        </div>

        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Имя</span>
            <p className="text-lg font-semibold text-gray-900">{pet.name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Вид / Порода</span>
            <p className="text-gray-900">
              {pet.species} {pet.breed ? `(${pet.breed})` : ''}
            </p>
          </div>

          {pet.allergies && (
            <div>
              <span className="text-sm font-medium text-gray-500">
                Аллергии / Особенности
              </span>
              <p className="text-red-600 font-medium">{pet.allergies}</p>
            </div>
          )}
        </div>

        {pet.emergency_contact && (
          <div className="mt-6 text-center">
            <p className="mb-2 text-sm text-gray-600">Телефон владельца</p>
            <a
              href={`tel:${pet.emergency_contact}`}
              className="inline-block w-full rounded-lg bg-blue-600 py-3 text-center text-lg font-bold text-white hover:bg-blue-700"
            >
              📞 Позвонить: {pet.emergency_contact}
            </a>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Сгенерировано в PawLog
        </p>
      </div>
    </div>
  );
}
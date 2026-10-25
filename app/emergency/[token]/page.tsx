// app/emergency/[token]/page.tsx
import { createClient } from '@supabase/supabase-js';
import type { EmergencyPetInfo } from '@/components/types';

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

  // Вызываем безопасную SQL-функцию
  const { data, error } = await supabase.rpc('get_emergency_pet_info', {
    token: params.token,
  });

  // ВРЕМЕННЫЙ БЛОК ДЛЯ ОТЛАДКИ
  if (error || !data) {
    return (
      <div className="p-8 font-mono text-sm">
        <h1 className="text-xl text-red-600 font-bold mb-4">Ошибка базы данных</h1>
        <p><b>Токен из URL:</b> {params.token}</p>
        <p><b>Текст ошибки:</b> {error?.message || 'Ошибки нет'}</p>
        <p><b>Данные:</b> {JSON.stringify(data)}</p>
      </div>
    );
  }

  const pet = (Array.isArray(data) ? data[0] : data) as EmergencyPetInfo;

  if (!pet || !pet.name) {
    return (
      <div className="p-8 font-mono text-sm">
        <h1 className="text-xl text-red-600 font-bold mb-4">Питомец не найден или пустой</h1>
        <p><b>Токен из URL:</b> {params.token}</p>
        <p><b>Данные из базы:</b> {JSON.stringify(data)}</p>
      </div>
    );
  }

  // Если всё ок, показываем карточку
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
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Сгенерировано в PawLog
        </p>
      </div>
    </div>
  );
}
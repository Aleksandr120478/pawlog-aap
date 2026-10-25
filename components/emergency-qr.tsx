// components/emergency-qr.tsx
'use client';

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { supabase } from '@/lib/supabaseClient'; 
import type { Pet } from '@/components/types';

interface EmergencyQRProps {
  pet: Pet;
}

export function EmergencyQR({ pet }: EmergencyQRProps) {
  const [contact, setContact] = useState<string>(pet.emergency_contact || '');
  const [notes, setNotes] = useState<string>(pet.medical_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Ссылка на блок с QR-кодом для скачивания
  const qrRef = useRef<HTMLDivElement>(null);

  const emergencyUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/emergency/${pet.emergency_token}`
    : '';

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('pets')
      .update({
        emergency_contact: contact,
        medical_notes: notes,
      })
      .eq('id', pet.id);

    setIsSaving(false);

    if (error) {
      alert('Ошибка при сохранении: ' + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Функция скачивания QR-кода
  const handleDownload = async (): Promise<void> => {
    if (!qrRef.current) return;
    setIsDownloading(true);

    try {
      // Превращаем блок в PNG картинку с высоким разрешением
      const dataUrl = await toPng(qrRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, // Чтобы картинка была четкой при печати
        backgroundColor: '#ffffff' 
      });

      const link = document.createElement('a');
      link.download = `QR-${pet.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Не удалось скачать QR-код. Попробуйте сделать скриншот.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Безопасность и QR-код</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Распечатайте этот код и прикрепите к ошейнику. Если питомец потеряется, любой прохожий сможет отсканировать код и увидеть ваши контакты.
      </p>

      <div className="flex flex-col gap-6">
        
        {/* Блок с QR-кодом и кнопкой скачивания */}
        <div className="flex flex-col items-center gap-3">
          <div 
            ref={qrRef} 
            className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
            {emergencyUrl ? (
              <QRCode value={emergencyUrl} size={180} />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center bg-gray-100 text-sm text-gray-400">
                Загрузка...
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isDownloading || !emergencyUrl}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition disabled:opacity-50"
          >
            {isDownloading ? 'Скачивание...' : '⬇️ Скачать QR (PNG)'}
          </button>
        </div>

        {/* Блок с полями ввода */}
        <div className="w-full space-y-4">
          <div>
            <label htmlFor="emergency-contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Телефон для экстренной связи
            </label>
            <input
              id="emergency-contact"
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="medical-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Аллергии / Важная мед. информация
            </label>
            <textarea
              id="medical-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: Аллергия на курицу. Принимает лекарства."
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Сохранение...' : saved ? 'Сохранено!' : 'Сохранить данные'}
          </button>
        </div>
      </div>
    </div>
  );
}
'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { toDataURL } from 'qrcode'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import type { Pet } from '@/components/types'

interface EmergencyQRProps {
  pet: Pet
  onTokenReset?: (newToken: string) => void
}

function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL
  if (!raw) return ''
  return raw.replace(/\/+$/, '')
}

function generateEmergencyToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function EmergencyQR({ pet, onTokenReset }: EmergencyQRProps) {
  const [contact, setContact] = useState<string>(pet.emergency_contact ?? '')
  const [allergies, setAllergies] = useState<string>(pet.allergies ?? '')
  const [token, setToken] = useState<string>(pet.emergency_token)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setContact(pet.emergency_contact ?? '')
    setAllergies(pet.allergies ?? '')
    setToken(pet.emergency_token)
  }, [pet.id, pet.emergency_contact, pet.allergies, pet.emergency_token])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const baseUrl = getAppBaseUrl()
  const emergencyUrl = baseUrl ? `${baseUrl}/emergency/${token}` : ''

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('pets')
      .update({
        emergency_contact: contact,
        allergies,
      })
      .eq('id', pet.id)

    setIsSaving(false)

    if (error) {
      toast.error('Ошибка при сохранении: ' + error.message, { id: 'qr-save' })
      return
    }
    setSaved(true)
    toast.success('Данные экстренной карточки сохранены', { id: 'qr-save' })
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaved(false), 3000)
  }

  const handleDownload = async (): Promise<void> => {
    if (!emergencyUrl) return
    setIsDownloading(true)
    try {
      const dataUrl = await toDataURL(emergencyUrl, {
        width: 600,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
      })
      const link = document.createElement('a')
      link.download = `QR-${pet.name}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('QR-код скачан', { id: 'qr-download' })
    } catch (err) {
      console.error(err)
      toast.error('Не удалось скачать QR-код', { id: 'qr-download' })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRegenerate = async (): Promise<void> => {
    const confirmReset = window.confirm(
      'Вы уверены? Старый QR-код перестанет работать, и вам нужно будет распечатать новый.'
    )
    if (!confirmReset) return

    setIsResetting(true)
    const newToken = generateEmergencyToken()

    const { error } = await supabase
      .from('pets')
      .update({ emergency_token: newToken })
      .eq('id', pet.id)

    setIsResetting(false)

    if (error) {
      toast.error('Ошибка при сбросе токена: ' + error.message, { id: 'qr-reset' })
      return
    }
    setToken(newToken)
    onTokenReset?.(newToken)
    toast.success('QR-код обновлён. Не забудьте скачать и распечатать новый.', { id: 'qr-reset' })
  }

  if (!baseUrl) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/20">
        <h3 className="mb-2 text-lg font-bold text-red-800 dark:text-red-300">QR-код недоступен</h3>
        <p className="text-sm text-red-700 dark:text-red-400">
          Не задана переменная окружения{' '}
          <code className="font-mono">NEXT_PUBLIC_APP_URL</code>. Задай её в Vercel →
          Settings → Environment Variables и пересобери приложение.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Безопасность и QR-код</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Распечатайте этот код и прикрепите к ошейнику. Если питомец потеряется, любой прохожий сможет отсканировать код и увидеть ваши контакты.
      </p>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <QRCode value={emergencyUrl} size={180} />
          </div>

          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition disabled:opacity-50"
            >
              {isDownloading ? 'Скачивание...' : '⬇️ Скачать QR (PNG)'}
            </button>

            <span className="text-gray-300">|</span>

            <button
              type="button"
              onClick={() => void handleRegenerate()}
              disabled={isResetting}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition disabled:opacity-50"
            >
              {isResetting ? 'Сброс...' : '🔄 Сбросить QR'}
            </button>
          </div>
        </div>

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
            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Аллергии / Важная мед. информация
            </label>
            <textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Например: Аллергия на курицу. Принимает лекарства."
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              ⚠️ Эту информацию увидят все, кто отсканирует QR-код. Не пишите здесь адрес или личные данные.
            </p>
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
  )
}
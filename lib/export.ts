// lib/export.ts
import { generateICS } from '@/lib/ics'
import { Pet, HealthRecord, RECORD_LABELS } from '@/components/types'

function escapeCsvField(field: string | null | undefined): string {
  const value = field ?? ''
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildCsv(pet: Pet, records: HealthRecord[]): string {
  const headers = ['Дата', 'Тип', 'Значение', 'Заметка', 'Следующее напоминание']
  const rows = records.map((r) => [
    r.record_date,
    RECORD_LABELS[r.type] || r.type,
    r.value,
    r.note,
    r.next_date,
  ])
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\n')
  return '\uFEFF' + csv
}

export interface IcsExportEvent {
  id: string
  title: string
  description: string
  date: string
}

export function buildIcsEvents(pet: Pet, records: HealthRecord[]): IcsExportEvent[] {
  return records
    .filter((r): r is HealthRecord & { next_date: string } => Boolean(r.next_date))
    .map((r) => ({
      id: r.id,
      title: `${pet.name}: ${RECORD_LABELS[r.type] || r.type}`,
      description: r.note ?? '',
      date: r.next_date,
    }))
}

export function generateIcsContent(pet: Pet, records: HealthRecord[]): string | null {
  const events = buildIcsEvents(pet, records)
  if (events.length === 0) return null
  return generateICS(events)
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
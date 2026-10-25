// lib/date.ts
export function todayLocal(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

export type ReminderStatusType = 'overdue' | 'soon' | 'normal'

export interface ReminderStatus {
  status: ReminderStatusType
  text: string
}

export function getReminderStatus(nextDate: string | null): ReminderStatus | null {
  if (!nextDate) return null
  
  const today = new Date(todayLocal())
  const next = new Date(nextDate)
  const diffTime = next.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'overdue', text: '⚠️ Просрочено!' }
  }
  if (diffDays <= 7) {
    return { status: 'soon', text: `⏰ Через ${diffDays} дн.` }
  }
  return { status: 'normal', text: `📅 ${nextDate}` }
}
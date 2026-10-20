'use client'
import { useState } from 'react'

type HealthRecord = {
  id: string; pet_id: string; type: string; value: string;
  note: string | null; record_date: string; next_date: string | null;
}

function todayLocal() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0]
}

export default function CalendarView({ records }: { records: HealthRecord[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const eventsByDate: Record<string, HealthRecord[]> = {}
  records.forEach(r => {
    if (r.record_date) {
      eventsByDate[r.record_date] = eventsByDate[r.record_date] || []
      eventsByDate[r.record_date].push(r)
    }
    if (r.next_date) {
      eventsByDate[r.next_date] = eventsByDate[r.next_date] || []
      eventsByDate[r.next_date].push({ ...r, type: 'reminder', value: 'Напоминание: ' + r.value })
    }
  })

  const blanks = Array.from({ length: startingDay }, (_, i) => <div key={`blank-${i}`} className="h-20 md:h-24 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-lg"></div>)
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEvents = eventsByDate[dateString] || []
    const isToday = dateString === todayLocal()

    return (
      <div key={day} className={`h-20 md:h-24 p-1 border rounded-lg overflow-hidden flex flex-col ${isToday ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
        <span className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{day}</span>
        <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
          {dayEvents.map((e, idx) => (
            <div key={idx} title={e.value} className={`text-[10px] truncate px-1 rounded ${e.type === 'reminder' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
              {e.value}
            </div>
          ))}
        </div>
      </div>
    )
  })

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">◀</button>
        <h3 className="font-bold text-gray-800 dark:text-white">{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks}
        {days}
      </div>
    </div>
  )
}

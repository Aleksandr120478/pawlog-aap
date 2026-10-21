'use client'
import { useState } from 'react'
import { HealthRecord, RECORD_LABELS } from './types'

export default function CalendarModal({ 
  records, 
  selectedDate, 
  onDayClick, 
  onAddClick,
  onClose 
}: { 
  records: HealthRecord[], 
  selectedDate: string, 
  onDayClick: (date: string) => void,
  onAddClick: (date: string) => void,
  onClose: () => void
}) {
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

  const blanks = Array.from({ length: startingDay }, (_, i) => (
    <div key={`blank-${i}`} className="min-h-[120px] bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-xl"></div>
  ))
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEvents = eventsByDate[dateString] || []
    const isToday = dateString === new Date().toISOString().split('T')[0]
    const isSelected = dateString === selectedDate

    return (
      <div 
        key={day} 
        onClick={() => onDayClick(dateString)}
        className={`min-h-[120px] p-2 border rounded-xl flex flex-col cursor-pointer transition-all duration-200 hover:border-rose-400 hover:shadow-md overflow-hidden ${
          isSelected 
            ? 'border-rose-500 ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-900/30' 
            : isToday 
              ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-900/10' 
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <span className={`text-sm font-bold shrink-0 ${isSelected || isToday ? 'text-rose-700 dark:text-rose-300' : 'text-gray-600 dark:text-gray-400'}`}>{day}</span>
        
        <div className="flex-1 mt-2 overflow-y-auto w-full flex flex-col gap-1 pointer-events-none custom-scrollbar">
          {dayEvents.map((e, idx) => (
            <div key={idx} title={e.value} className={`text-[10px] leading-tight truncate w-full px-1.5 py-1 rounded-md ${e.type === 'reminder' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'}`}>
              {e.value}
            </div>
          ))}
        </div>
      </div>
    )
  })

  const selectedDayEvents = eventsByDate[selectedDate] || [];

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Календарь событий</h2>
          <button onClick={onClose} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm font-medium">
            ✕ Закрыть
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 md:px-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm">← Пред. месяц</button>
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">{monthNames[month]} {year}</h3>
              <button onClick={nextMonth} className="p-2 md:px-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm">След. месяц →</button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 pb-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {blanks}
              {days}
            </div>
          </div>

          <div className="w-full xl:w-80 shrink-0 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">{selectedDate || 'Выберите день'}</h4>
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">События на этот день</p>
            
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-3">
              {selectedDate ? (
                selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">Нет записей</p>
                ) : (
                  selectedDayEvents.map((e, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className={`text-xs font-bold uppercase mb-1 block ${e.type === 'reminder' ? 'text-orange-600' : 'text-rose-600'}`}>
                        {RECORD_LABELS[e.type] || e.type}
                      </span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.value}</p>
                      {e.note && <p className="text-xs text-gray-500 mt-1">{e.note}</p>}
                    </div>
                  ))
                )
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Нажмите на день в календаре</p>
              )}
            </div>

            {selectedDate && (
              <button onClick={() => onAddClick(selectedDate)} className="w-full mt-4 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-500/20">
                + Добавить на этот день
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import React, { useState } from 'react'
import { HealthRecord, RECORD_LABELS } from './types'

interface CalendarModalProps {
  records: HealthRecord[];
  selectedDate: string;
  onDayClick: (date: string) => void;
  onAddClick: (date: string) => void;
  onClose: () => void;
}

export default function CalendarModal({ records, selectedDate, onDayClick, onAddClick, onClose }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const formatDate = (day: number) => {
    const d = String(day).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const dayEvents = records.filter(r => r.record_date === selectedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none z-10">&times;</button>
        
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">&larr;</button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{monthNames[month]} {year}</h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">&rarr;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map(d => <div key={d} className="text-xs font-medium text-gray-400">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {emptyDays.map(d => <div key={`empty-${d}`} />)}
          {daysArray.map(day => {
            const dateStr = formatDate(day);
            const hasEvents = records.some(r => r.record_date === dateStr);
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => onDayClick(dateStr)}
                className={`h-10 w-10 flex flex-col items-center justify-center rounded-full text-sm transition relative
                  ${isSelected ? 'bg-rose-500 text-white font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700'}
                `}
              >
                {day}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 bg-rose-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Записи за {selectedDate}</h3>
            <button onClick={() => onAddClick(selectedDate)} className="text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded hover:bg-rose-200 transition">+ Добавить</button>
          </div>
          
          <div className="flex-1 mt-2 overflow-y-auto w-full flex flex-col gap-1 pointer-events-none custom-scrollbar max-h-32">
            {dayEvents.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Нет записей</p>
            ) : (
              dayEvents.map((e, idx) => (
                <div key={idx} title={e.value || undefined} className={`text-[10px] leading-tight truncate w-full px-1.5 py-1 rounded-md ${e.type === 'reminder' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                  {e.value || RECORD_LABELS[e.type] || e.type}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
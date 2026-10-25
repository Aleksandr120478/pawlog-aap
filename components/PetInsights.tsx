'use client'
import React from 'react'
import { HealthRecord, RECORD_LABELS } from './types'

interface PetInsightsProps {
  records: HealthRecord[];
  upcomingEvents: HealthRecord[];
  totalExpenses: number;
}

export default function PetInsights({ records, upcomingEvents, totalExpenses }: PetInsightsProps) {
  // 1. Считаем тренд веса
  const weightRecords = records
    .filter(r => r.type === 'weight' && r.value)
    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  
  const latestWeight = weightRecords[0]?.value || null;
  const previousWeight = weightRecords[1]?.value || null;
  
  let weightTrend: { text: string; color: string } | null = null;
  if (latestWeight && previousWeight) {
    const diff = Number(latestWeight) - Number(previousWeight);
    if (diff > 0) weightTrend = { text: `+${diff.toFixed(1)}`, color: 'text-red-500' };
    else if (diff < 0) weightTrend = { text: `${diff.toFixed(1)}`, color: 'text-green-500' };
    else weightTrend = { text: '0', color: 'text-gray-500' };
  }

  // 2. Ближайшее событие с умной проверкой
  const nextEvent = upcomingEvents[0];
  let daysToEventText = '—';
  let eventColor = 'text-gray-800 dark:text-white';

  if (nextEvent && nextEvent.next_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const eventDate = new Date(nextEvent.next_date);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      daysToEventText = 'Просрочено!';
      eventColor = 'text-red-500';
    } else if (diffDays === 0) {
      daysToEventText = 'Сегодня!';
      eventColor = 'text-orange-500';
    } else {
      daysToEventText = `${diffDays} дн.`;
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
      {/* Карточка 1: Вес */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-center overflow-hidden flex flex-col justify-center">
        <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 truncate">Последний вес</p>
        <p className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white truncate">
          {latestWeight ? `${latestWeight} кг` : '—'}
        </p>
        {weightTrend && (
          <p className={`text-[10px] font-bold ${weightTrend.color} truncate`}>
            {weightTrend.text} кг
          </p>
        )}
      </div>

      {/* Карточка 2: Событие */}
      <div className="bg-orange-50 dark:bg-orange-900/20 p-2 sm:p-3 rounded-xl border border-orange-100 dark:border-orange-800 text-center overflow-hidden flex flex-col justify-center">
        <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 font-medium mb-1 truncate">До прививки</p>
        <p className={`text-sm sm:text-base font-bold leading-tight break-words ${eventColor}`}>
          {daysToEventText}
        </p>
        {nextEvent && <p className="text-[10px] text-gray-500 truncate mt-1">{RECORD_LABELS[nextEvent.type] || nextEvent.type}</p>}
      </div>

      {/* Карточка 3: Расходы */}
      <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 rounded-xl border border-green-100 dark:border-green-800 text-center overflow-hidden flex flex-col justify-center">
        <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mb-1 truncate">Расходы</p>
        <p className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white truncate">
          {totalExpenses > 0 ? `${totalExpenses} ₽` : '0 ₽'}
        </p>
        <p className="text-[10px] text-gray-500 truncate">всего</p>
      </div>
    </div>
  )
}
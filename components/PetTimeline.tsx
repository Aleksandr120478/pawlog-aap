'use client'
import React from 'react'
import { RECORD_LABELS, Pet, HealthRecord, PetDocument } from './types'
import PetInsights from './PetInsights'

interface PetTimelineProps {
  selectedPet: Pet | null;
  dashboardTab: 'list' | 'docs';
  setDashboardTab: (v: 'list' | 'docs') => void;
  records: HealthRecord[];
  documents: PetDocument[];
  showCalendarModal: boolean;
  setShowCalendarModal: (v: boolean) => void;
  exportToCSV: () => void;
  exportToICS: () => void;
  isDark: boolean;
  startEditingRecord: (record: HealthRecord) => void;
  deleteRecord: (id: string) => void;
  uploadDocument: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deleteDocument: (id: string, path: string) => void;
  upcomingEvents: HealthRecord[];
  totalExpenses: number;
  getReminderStatus: (date: string | null) => { text: string; color: string } | null;
}

export default function PetTimeline({
  selectedPet, dashboardTab, setDashboardTab, records, documents,
  showCalendarModal, setShowCalendarModal, exportToCSV, exportToICS, isDark,
  startEditingRecord, deleteRecord, uploadDocument, deleteDocument,
  upcomingEvents, totalExpenses, getReminderStatus
}: PetTimelineProps) {
  if (!selectedPet) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center text-gray-500">
        Выберите питомца, чтобы увидеть историю.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col md:max-h-[calc(100vh-120px)]">
      
      {/* Шапка с вкладками */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 shrink-0">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Дневник: {selectedPet.name}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setDashboardTab('list')} 
            className={`px-3 py-1 text-sm rounded-lg transition ${dashboardTab === 'list' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Лента
          </button>
          <button 
            onClick={() => setDashboardTab('docs')} 
            className={`px-3 py-1 text-sm rounded-lg transition ${dashboardTab === 'docs' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Документы
          </button>
        </div>
      </div>

      {/* Наши новые карточки статистики */}
      <PetInsights records={records} upcomingEvents={upcomingEvents} totalExpenses={totalExpenses} />

      {/* Кнопки экспорта и Календаря */}
      <div className="flex flex-wrap gap-2 mb-4 print:hidden shrink-0">
        <button onClick={() => setShowCalendarModal(true)} className="text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 px-3 py-1.5 rounded-lg transition font-medium">
          📅 Открыть календарь
        </button>
        <button onClick={exportToCSV} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition">
          📊 Экспорт в Excel
        </button>
        <button onClick={exportToICS} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition">
          📅 Экспорт в Календарь (.ics)
        </button>
      </div>

      {/* Список записей */}
      <div className="flex-1 overflow-y-auto pr-2">
        {dashboardTab === 'list' ? (
          records.length === 0 ? (
             <p className="text-center text-gray-400 mt-4">Записей пока нет</p>
          ) : (
            <ul className="space-y-3">
               {records.map((r: HealthRecord) => (
                  <li key={r.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 group">
                     <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{RECORD_LABELS[r.type] || r.type}</span>
                          {r.value && <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{r.value}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{r.record_date}</span>
                          {/* Кнопки редактирования и удаления */}
                          <button onClick={() => startEditingRecord(r)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition text-xs">✎</button>
                          <button onClick={() => deleteRecord(r.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition text-xs">✕</button>
                        </div>
                     </div>
                     {r.note && <p className="text-sm text-gray-500 italic mt-1">{r.note}</p>}
                     {r.next_date && (
                       <p className={`text-xs mt-1 font-medium ${getReminderStatus(r.next_date)?.color}`}>
                         {getReminderStatus(r.next_date)?.text}
                       </p>
                     )}
                  </li>
               ))}
            </ul>
          )
        ) : (
          <p className="text-center text-gray-400 mt-4">Документов пока нет</p>
        )}
      </div>

    </div>
  )
}
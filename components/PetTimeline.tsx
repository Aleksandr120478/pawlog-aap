'use client'
import React from 'react'
import { RECORD_LABELS, Pet, HealthRecord, PetDocument } from './types'
import PetInsights from './PetInsights'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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
  weightData: { date: string; weight: number }[];
  getReminderStatus: (date: string | null) => { text: string; color: string } | null;
}

export default function PetTimeline({
  selectedPet, dashboardTab, setDashboardTab, records, documents,
  showCalendarModal, setShowCalendarModal, exportToCSV, exportToICS, isDark,
  startEditingRecord, deleteRecord, uploadDocument, deleteDocument,
  upcomingEvents, totalExpenses, weightData, getReminderStatus
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

      <PetInsights records={records} upcomingEvents={upcomingEvents} totalExpenses={totalExpenses} />

      {dashboardTab === 'list' && weightData.length > 0 && (
        <div className="mb-6 h-48 w-full bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shrink-0">
          <p className="text-xs font-semibold text-gray-500 mb-2 ml-2 uppercase tracking-wider">Динамика веса</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={30} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#e11d48', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="weight" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1f2937' : '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Кнопки экспорта и Календаря (только для Ленты) */}
      {dashboardTab === 'list' && (
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
      )}

      <div className="flex-1 overflow-y-auto pr-2">
        {dashboardTab === 'list' ? (
          records.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
               <div className="text-5xl mb-4 animate-in zoom-in duration-500">📝</div>
               <h3 className="text-gray-800 dark:text-gray-200 font-semibold mb-1">Пока нет записей</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mb-4">
                 Добавьте первую запись о здоровье, весе или прививке вашего питомца.
               </p>
               <button onClick={() => document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' })} className="bg-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-rose-600 active:scale-95 transition-all shadow-md shadow-rose-500/20">
                 Создать запись
               </button>
             </div>
          ) : (
            <ul className="space-y-3">
               {records.map((r: HealthRecord) => (
                  <li key={r.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 group transition-all hover:shadow-md">
                     <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{RECORD_LABELS[r.type] || r.type}</span>
                          {r.value && <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{r.value}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{r.record_date}</span>
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
          // ВКЛАДКА ДОКУМЕНТЫ
          <div className="h-full flex flex-col">
            {/* Кнопка добавления документа (всегда сверху) */}
            <div className="flex justify-between items-center mb-3 shrink-0">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ваши файлы</span>
              <label className="text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer">
                + Загрузить
                <input type="file" className="hidden" onChange={uploadDocument} accept="image/*,.pdf" />
              </label>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] text-center p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-5xl mb-4 animate-in zoom-in duration-500">📁</div>
                <h3 className="text-gray-800 dark:text-gray-200 font-semibold mb-1">Нет документов</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mb-4">
                  Здесь будут храниться анализы, справки и рентгены.
                </p>
                <label className="bg-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-rose-600 active:scale-95 transition-all shadow-md shadow-rose-500/20 cursor-pointer">
                  Загрузить файл
                  <input type="file" className="hidden" onChange={uploadDocument} accept="image/*,.pdf" />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {documents.map(doc => (
                  <div key={doc.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center group relative">
                    <span className="text-3xl mb-2">📄</span>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate w-full">{doc.name}</p>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 rounded-lg transition-opacity">
                       <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-white bg-blue-500 p-1.5 rounded-full hover:bg-blue-600">👁</a>
                       <button onClick={() => deleteDocument(doc.id, '')} className="text-white bg-red-500 p-1.5 rounded-full hover:bg-red-600">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
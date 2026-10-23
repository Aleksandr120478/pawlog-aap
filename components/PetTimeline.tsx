'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { HealthRecord, PetDocument, RECORD_LABELS } from './types'

interface PetTimelineProps {
  selectedPet: any;
  dashboardTab: 'list' | 'docs';
  setDashboardTab: (tab: 'list' | 'docs') => void;
  records: HealthRecord[];
  documents: PetDocument[];
  showCalendarModal: boolean;
  setShowCalendarModal: (v: boolean) => void;
  exportToCSV: () => void;
  isDark: boolean;
  startEditingRecord: (record: HealthRecord) => void;
  deleteRecord: (id: string) => void;
  uploadDocument: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deleteDocument: (id: string, url: string) => void;
  upcomingEvents: HealthRecord[];
  totalExpenses: number;
  weightData: any[];
  getReminderStatus: (nextDate: string | null) => any;
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--; months += 12;
  }
  if (years === 0 && months === 0) return 'Меньше месяца';
  return `${years > 0 ? years + ' г. ' : ''}${months > 0 ? months + ' мес.' : ''}`.trim();
}

export default function PetTimeline({
  selectedPet, dashboardTab, setDashboardTab, records, documents, setShowCalendarModal,
  exportToCSV, isDark, startEditingRecord, deleteRecord, uploadDocument, deleteDocument,
  upcomingEvents, totalExpenses, weightData, getReminderStatus
}: PetTimelineProps) {
  
  // Вычисляем последний вес из записей (записи идут от новых к старым, поэтому берем первую найденную)
  const lastWeightRecord = records.find(r => r.type === 'weight');

  return (
    <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:border-none print:shadow-none print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 print:mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">{selectedPet ? selectedPet.name : 'Лента'}</h2>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 print:hidden">
            <button onClick={() => setDashboardTab('list')} className={`px-2 py-1 text-xs rounded-md transition ${dashboardTab === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-500'}`}>📋 Список</button>
            <button onClick={() => setDashboardTab('docs')} className={`px-2 py-1 text-xs rounded-md transition ${dashboardTab === 'docs' ? 'bg-white dark:bg-gray-600 shadow-sm text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-500'}`}>📁 Документы</button>
          </div>
        </div>
        
        {selectedPet && (
          <button onClick={() => setShowCalendarModal(true)} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition flex items-center gap-1 print:hidden">
            📅 Открыть календарь
          </button>
        )}
        {selectedPet && records.length > 0 && dashboardTab === 'list' && (
          <div className="flex gap-2 print:hidden">
            <button onClick={exportToCSV} className="text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition flex items-center gap-1" title="Скачать в Excel">📊 Excel</button>
            <button onClick={() => window.print()} className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1">🖨️ PDF</button>
          </div>
        )}
      </div>

      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex items-center gap-4 mb-2">
          {selectedPet?.avatar_url && <img src={selectedPet.avatar_url} className="w-16 h-16 rounded-full object-cover" />}
          <div>
            <h1 className="text-2xl font-bold">{selectedPet?.name}</h1>
            <p className="text-sm text-gray-500">{selectedPet?.species} {selectedPet?.breed ? `• ${selectedPet.breed}` : ''} {selectedPet?.birth_date ? ` • Возраст: ${calculateAge(selectedPet.birth_date)}` : ''}</p>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg mt-3 text-sm grid grid-cols-2 gap-2">
          <div><b>Аллергии:</b> {selectedPet?.allergies || 'Нет'}</div>
          <div><b>Хронические:</b> {selectedPet?.chronic_diseases || 'Нет'}</div>
          <div><b>Корм:</b> {selectedPet?.food || 'Не указано'}</div>
          <div><b>Ветеринар:</b> {selectedPet?.vet_contact || 'Не указан'}</div>
        </div>
        <p className="text-sm text-gray-500 mt-3">Дата отчета: {new Date().toLocaleDateString('ru-RU')}</p>
      </div>

      {selectedPet ? (
        <>
          {dashboardTab === 'list' && (
            <>
              {/* БЛОК УМНОЙ СТАТИСТИКИ */}
              <div className="grid grid-cols-3 gap-2 mb-4 print:hidden">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Записей</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{records.length}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-center">
                  <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Расходы</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totalExpenses > 0 ? `${totalExpenses.toLocaleString('ru-RU')} ₽` : '0 ₽'}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 text-center">
                  <p className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400 mb-1">Вес</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{lastWeightRecord ? `${lastWeightRecord.value} кг` : '—'}</p>
                </div>
              </div>

              {upcomingEvents.length > 0 && (
                <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 print:hidden">
                  <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">⚠️ Внимание! Ближайшие события</h3>
                  <ul className="space-y-2">
                    {upcomingEvents.map(ev => (
                      <li key={ev.id} className="flex justify-between items-center text-sm text-orange-700 dark:text-orange-400 border-b border-orange-100 dark:border-orange-800/50 pb-1 last:border-0 last:pb-0">
                        <span className="font-medium truncate pr-2">{ev.value}</span>
                        <span className="shrink-0 bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{ev.next_date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {weightData.length > 1 && (
                <div className="mb-6 print:hidden bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Динамика веса (кг)</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280'}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280'}} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: isDark ? '#f3f4f6' : '#111827' }} itemStyle={{ color: isDark ? '#f43f5e' : '#e11d48', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: isDark ? '#1f2937' : '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {records.length === 0 ? (
                <div className="text-center p-6 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-dashed border-rose-200 dark:border-rose-800 mt-6">
                  <span className="text-4xl mb-2 block">📝</span>
                  <p className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">Шаг 2. Добавьте запись</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">Заполните форму слева.</p>
                  <div className="text-2xl animate-bounce mt-2">←</div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
                  {records.map(record => {
                    const reminder = getReminderStatus(record.next_date);
                    return (
                      <div key={record.id} className={`border-l-4 pl-3 py-1 print:break-inside-avoid ${record.type === 'note' ? 'border-yellow-400 print:border-gray-400' : record.type === 'expense' ? 'border-emerald-400 print:border-gray-400' : 'border-rose-200 dark:border-rose-700 print:border-gray-400'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-medium uppercase print:text-gray-800 ${record.type === 'note' ? 'text-yellow-600 dark:text-yellow-500' : record.type === 'expense' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500 dark:text-rose-400'}`}>{RECORD_LABELS[record.type] || record.type}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{record.record_date}</span>
                            <div className="flex gap-1 print:hidden">
                              <button onClick={() => startEditingRecord(record)} className="text-gray-300 hover:text-rose-500 p-1">✏️</button>
                              <button onClick={() => deleteRecord(record.id)} className="text-gray-300 hover:text-red-500 p-1">×</button>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{record.value}{record.type === 'weight' ? ' кг' : record.type === 'expense' ? ' ₽' : ''}</p>
                        {reminder && <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${reminder.color}`}>Следующий раз: {reminder.text}</div>}
                        {record.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{record.note}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {dashboardTab === 'docs' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition relative">
                <input type="file" onChange={uploadDocument} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-2xl mb-2">📄</p>
                  <p className="font-medium text-sm">Нажмите или перетащите файл</p>
                  <p className="text-xs mt-1">PDF, JPG, PNG (до 5 МБ)</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {documents.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Нет загруженных документов</p>}
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xl">📎</span>
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:text-rose-700 p-1 text-sm font-medium">Открыть</a>
                      <button onClick={() => deleteDocument(doc.id, doc.url)} className="text-red-400 hover:text-red-600 p-1 text-sm">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : <p className="text-sm text-gray-400 dark:text-gray-500">Выберите питомца</p>}
    </section>
  )
}

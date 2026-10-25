'use client'

import { Pet } from '@/components/types'

interface RecordFormProps {
  selectedPet: Pet | null;
  hasPremiumAccess: boolean;
  recordsCount: number;
  editingRecordId: string | null;
  addVaccineTemplates: () => void;
  saveRecord: (e: React.FormEvent) => void;
  recordType: string;
  setRecordType: (v: string) => void;
  recordValue: string;
  setRecordValue: (v: string) => void;
  recordDate: string;
  setRecordDate: (v: string) => void;
  recordNextDate: string;
  setRecordNextDate: (v: string) => void;
  recordNote: string;
  setRecordNote: (v: string) => void;
  savingRecord: boolean;
  resetRecordForm: () => void;
}

export default function RecordForm({
  selectedPet, hasPremiumAccess, recordsCount, editingRecordId, addVaccineTemplates,
  saveRecord, recordType, setRecordType, recordValue, setRecordValue, recordDate, setRecordDate,
  recordNextDate, setRecordNextDate, recordNote, setRecordNote, savingRecord, resetRecordForm
}: RecordFormProps) {
  const isNumberType = recordType === 'weight' || recordType === 'expense';

  return (
    <section id="record-form" className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">{editingRecordId ? 'Редактировать запись' : 'Новая запись'}</h2>
      </div>
      {selectedPet ? (
        <form onSubmit={saveRecord} className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Для: <span className="font-medium text-gray-700 dark:text-gray-200">{selectedPet.name}</span></p>
            {!hasPremiumAccess && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">Лимит: {recordsCount}/20</span>}
          </div>
          {(selectedPet.species === 'Собака' || selectedPet.species === 'Кошка') && !editingRecordId && (
            <button type="button" onClick={addVaccineTemplates} className="w-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs py-2 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center justify-center gap-1 font-medium">🪄 Добавить график прививок</button>
          )}
          
          <select value={recordType} onChange={e => setRecordType(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="weight">Вес (кг)</option>
            <option value="vaccine">Прививка</option>
            <option value="medication">Лекарство</option>
            <option value="expense">Расход (₽)</option>
            <option value="note">Заметка (Дневник)</option>
          </select>
          
          {/* УМНОЕ ПОЛЕ ВВОДА */}
          <input 
            type={isNumberType ? "number" : "text"} 
            inputMode={isNumberType ? "decimal" : "text"}
            step="any"
            required
            placeholder={recordType === 'weight' ? 'Например, 12.5' : recordType === 'expense' ? 'Сумма (например, 1500)' : recordType === 'note' ? 'Что случилось?' : 'Название'} 
            value={recordValue} 
            onChange={e => setRecordValue(e.target.value)} 
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
          />

          <div>
            <label htmlFor="record-date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Дата события</label>
            <input 
              id="record-date"
              type="date" 
              required
              value={recordDate} 
              onChange={e => setRecordDate(e.target.value)} 
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
            />
          </div>
          
          {(recordType === 'vaccine' || recordType === 'medication') && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-800/50">
              <label htmlFor="record-next-date" className="block text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Напоминание (Email)</label>
              <input 
                id="record-next-date"
                type="date" 
                value={recordNextDate} 
                onChange={e => setRecordNextDate(e.target.value)} 
                className="w-full px-3 py-2 border border-orange-200 dark:border-orange-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
              />
            </div>
          )}

          {recordType !== 'note' && (
            <textarea placeholder="Заметка (необязательно)" value={recordNote} onChange={e => setRecordNote(e.target.value)} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none h-16" />
          )}
          
          <div className="flex gap-2">
            <button type="submit" disabled={savingRecord} className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${editingRecordId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>{savingRecord ? 'Сохраняем...' : editingRecordId ? 'Обновить' : 'Сохранить'}</button>
            {editingRecordId && <button type="button" onClick={resetRecordForm} className="px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg text-sm hover:bg-gray-300">Отмена</button>}
          </div>
        </form>
      ) : <p className="text-sm text-gray-400 dark:text-gray-500">Сначала добавьте питомца</p>}
    </section>
  )
}
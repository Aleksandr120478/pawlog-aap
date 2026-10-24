import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { Pet, HealthRecord, RECORD_LABELS } from './types'

// Подключаем шрифт с поддержкой кириллицы (русского языка)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/roboto@1.0.4/Roboto-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/roboto@1.0.4/Roboto-Bold.ttf', fontWeight: 'bold' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/roboto@1.0.4/Roboto-Italic.ttf', fontStyle: 'italic' },
  ]
})

// Стили для PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', fontSize: 12, color: '#333' }, // Применили шрифт
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e11d48', paddingBottom: 10 },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#e11d48' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 4 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#111' },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 100, color: '#666', fontSize: 11 },
  value: { flex: 1, fontWeight: 'bold', fontSize: 11 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold', fontSize: 10, color: '#666' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4, marginBottom: 4 },
  colDate: { width: 80, fontSize: 10 },
  colType: { width: 100, fontSize: 10, fontWeight: 'bold' },
  colValue: { width: 80, fontSize: 10 },
  colNote: { flex: 1, fontSize: 10, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10, fontSize: 9, color: '#999', textAlign: 'center' }
})

interface PdfReportProps {
  pet: Pet;
  records: HealthRecord[];
  totalExpenses: number;
}

export default function PdfReport({ pet, records, totalExpenses }: PdfReportProps) {
  const today = new Date().toLocaleDateString('ru-RU')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Шапка */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>🐾 PawLog</Text>
            <Text style={styles.subtitle}>Медицинская карта питомца</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: '#666' }}>Дата отчета:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{today}</Text>
          </View>
        </View>

        {/* Данные питомца */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о питомце</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Кличка:</Text>
            <Text style={styles.value}>{pet.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Вид:</Text>
            <Text style={styles.value}>{pet.species} {pet.breed ? `(${pet.breed})` : ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Дата рождения:</Text>
            <Text style={styles.value}>{pet.birth_date || 'Не указана'}</Text>
          </View>
          {pet.allergies && (
            <View style={styles.row}>
              <Text style={styles.label}>Аллергии:</Text>
              <Text style={{ ...styles.value, color: '#e11d48' }}>{pet.allergies}</Text>
            </View>
          )}
        </View>

        {/* История записей */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>История здоровья</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Дата</Text>
            <Text style={styles.colType}>Событие</Text>
            <Text style={styles.colValue}>Значение</Text>
            <Text style={styles.colNote}>Заметка</Text>
          </View>

          {records.length === 0 ? (
            <Text style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>Записей пока нет.</Text>
          ) : (
            records.map((r) => (
              <View key={r.id} style={styles.tableRow}>
                <Text style={styles.colDate}>{r.record_date}</Text>
                <Text style={styles.colType}>{RECORD_LABELS[r.type] || r.type}</Text>
                <Text style={styles.colValue}>{r.value || '-'}</Text>
                <Text style={styles.colNote}>{r.note || '-'}</Text>
              </View>
            ))
          )}
        </View>

        {/* Итоги */}
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f9fafb', borderRadius: 5 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Всего расходов на лечение: {totalExpenses} ₽</Text>
        </View>

        {/* Подвал */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Сгенерировано в PawLog • Страница ${pageNumber} из ${totalPages}`
        )} />

      </Page>
    </Document>
  )
}
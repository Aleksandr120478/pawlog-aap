import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 1. Ищем записи, где есть напоминание и письмо еще не отправлено (false или NULL)
    const { data: records, error } = await supabase
      .from('health_records')
      .select(`
        id, value, next_date, reminder_sent,
        pets (name, user_id)
      `)
      .not('next_date', 'is', null)
      .or('reminder_sent.eq.false,reminder_sent.is.null')
      .limit(1)

    if (error) throw error

    if (!records || records.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'В базе нет записей с заполненным напоминанием, или они уже отправлены (reminder_sent = true)' 
      })
    }

    const record = records[0]
    
    // Безопасно достаем питомца
    const rawPet = record.pets as any
    const pet = Array.isArray(rawPet) ? rawPet[0] : rawPet
    
    if (!pet) throw new Error('Питомец не найден для этой записи')

    // Получаем email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(pet.user_id)
    if (userError) throw userError
    if (!user?.email) throw new Error('У пользователя нет email')

    // 2. Отправляем письмо и СМОТРИМ, что ответит Resend
    const emailResponse = await resend.emails.send({
      from: 'PawLog <onboarding@resend.dev>',
      to: user.email,
      subject: `Напоминание: ${pet.name}`,
      html: `<p>Привет! Тестовое напоминание для ${pet.name} на ${record.next_date}</p>`
    })

    // 3. Отмечаем как отправленное
    await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)

    // Выводим всё на экран
    return NextResponse.json({ 
      success: true, 
      message: 'Скрипт дошел до конца!',
      email_sent_to: user.email,
      resend_response: emailResponse, // <-- Здесь будет ответ от почты (ошибка или успех)
      record_id: record.id
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

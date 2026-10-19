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
    // 1. Ищем ОДНУ запись, где есть напоминание и письмо еще не отправлено
    // Добавлено .or(), чтобы ловить и false, и пустое значение (NULL)
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

    // Если записей нет — выходим с успешным статусом
    if (!records || records.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Нет новых напоминаний для отправки' })
    }

    const record = records[0]
    
    // 2. Безопасно извлекаем данные питомца (на случай массива или объекта)
    const rawPet = record.pets as any
    const pet = Array.isArray(rawPet) ? rawPet[0] : rawPet
    
    if (!pet) throw new Error('Питомец не найден для этой записи')
    if (!pet.user_id) throw new Error('У питомца нет привязки к пользователю')

    // 3. Получаем email владельца
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(pet.user_id)
    
    if (userError) throw userError
    if (!user?.email) throw new Error('У пользователя не найден email')

    // 4. Отправляем письмо
    await resend.emails.send({
      from: 'PawLog <onboarding@resend.dev>',
      to: user.email,
      subject: `Напоминание: ${pet.name} ждет процедура!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2>Привет! 🐾</h2>
          <p>Напоминаем, что у питомца <b>${pet.name}</b> запланировано событие:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <b>Событие:</b> ${record.value}<br>
            <b>Дата:</b> ${record.next_date}
          </div>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Открыть PawLog</a>
        </div>
      `
    })
    
    // 5. Помечаем, что письмо ушло, чтобы не спамить
    await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)
    
    return NextResponse.json({ 
      success: true, 
      sent: 1, 
      message: `Письмо для ${pet.name} успешно отправлено на ${user.email}!` 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

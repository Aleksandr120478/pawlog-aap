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
    const { data: records, error } = await supabase
      .from('health_records')
      .select(`
        id, value, next_date, reminder_sent,
        pets (name, user_id)
      `)
      .not('next_date', 'is', null)
      .eq('reminder_sent', false)
      .limit(1)

    if (error) throw error

    if (records && records.length > 0) {
      const record = records[0]
      
      // Защита от любых форматов данных: и массив, и объект
      const rawPet = record.pets as any
      const pet = Array.isArray(rawPet) ? rawPet[0] : rawPet
      
      if (!pet) {
        throw new Error('Связь с питомцем не найдена в базе данных')
      }

      // Получаем email пользователя
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(pet.user_id)
      
      if (userError) throw userError
      
      if (user?.email) {
        // Отправляем письмо
        await resend.emails.send({
          from: 'PawLog <onboarding@resend.dev>',
          to: user.email,
          subject: `Напоминание: ${pet.name} ждет процедура!`,
          html: `<h2>Привет! 🐾</h2><p>У питомца <b>${pet.name}</b> запланировано: ${record.value} на ${record.next_date}</p>`
        })
        
        // Помечаем, что письмо ушло
        await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)
        
        return NextResponse.json({ success: true, sent: 1, message: 'Письмо успешно отправлено!' })
      }
    }

    return NextResponse.json({ success: true, sent: 0, message: 'Нет записей, требующих отправки' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

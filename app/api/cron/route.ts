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
    // Ищем ЛЮБУЮ запись, где есть напоминание, и письмо еще не отправлено
    const { data: records, error } = await supabase
      .from('health_records')
      .select(`
        id, value, next_date, reminder_sent,
        pets (name, user_id)
      `)
      .not('next_date', 'is', null) // Главное, чтобы дата была заполнена
      .eq('reminder_sent', false)   // И чтобы письмо еще не уходило
      .limit(1) // Берем только одну для теста

    if (error) throw error

    // Если нашли запись — отправляем письмо
    if (records && records.length > 0) {
      const record = records[0]
      const { data: { user } } = await supabase.auth.admin.getUserById(record.pets[0].user_id)

      if (user?.email) {
        await resend.emails.send({
          from: 'PawLog <onboarding@resend.dev>',
          to: user.email,
          subject: `Напоминание: ${record.pets[0].name} ждет процедура!`,
          html: `<h2>Привет! 🐾</h2><p>У питомца <b>${record.pets[0].name}</b> запланировано: ${record.value} на ${record.next_date}</p>`
        })
        
        // Помечаем, что письмо отправлено
        await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)
      }
    }

    return NextResponse.json({ success: true, sent: records?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

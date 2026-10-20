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
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: records, error } = await supabase
      .from('health_records')
      .select(`id, value, next_date, reminder_sent, pets (name, user_id)`)
      .in('next_date', [today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]])
      .eq('reminder_sent', false)

    if (error) throw error
    if (!records || records.length === 0) return NextResponse.json({ success: true, sent: 0 })

    let sentCount = 0;

    for (const record of records) {
      const rawPet = record.pets as any
      const pet = Array.isArray(rawPet) ? rawPet[0] : rawPet
      if (!pet) continue;

      const { data: status } = await supabase.from('user_status').select('timezone').eq('user_id', pet.user_id).single()
      const { data: { user } } = await supabase.auth.admin.getUserById(pet.user_id)
      
      const userTimezone = status?.timezone || 'Europe/Moscow';
      
      // Проверяем, 9 ли сейчас утра по времени пользователя
      const userHourString = new Date().toLocaleString("en-US", { timeZone: userTimezone, hour: 'numeric', hour12: false });
      const userHour = parseInt(userHourString);

      if (userHour === 9 && user?.email) {
        await resend.emails.send({
          from: 'PawLog <no-reply@pawlog.ru>',
          to: user.email,
          subject: `Напоминание: ${pet.name}`,
          html: `<h2>Привет! 🐾</h2><p>У питомца <b>${pet.name}</b> запланировано: ${record.value} на ${record.next_date}</p>`
        })
        await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)
        sentCount++;
      }
    }
    return NextResponse.json({ success: true, sent: sentCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

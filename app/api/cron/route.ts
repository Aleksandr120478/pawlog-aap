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
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    const targetDateString = targetDate.toISOString().split('T')[0]

    const { data: records, error } = await supabase
      .from('health_records')
      .select(`
        id, value, next_date,
        pets (name, user_id)
      `)
      .eq('next_date', targetDateString)
      .eq('reminder_sent', false)

    if (error) throw error

    if (records && records.length > 0) {
      for (const record of records) {
        const { data: { user } } = await supabase.auth.admin.getUserById(record.pets[0].user_id)

        if (user?.email) {
          await resend.emails.send({
            from: 'PawLog <onboarding@resend.dev>',
            to: user.email,
            subject: `Напоминание: ${record.pets[0].name} ждет процедура!`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
                <h2>Привет! 🐾</h2>
                <p>Напоминаем, что через 3 дня (${record.next_date}) у питомца <b>${record.pets[0].name}</b> запланировано событие:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                  <b>Событие:</b> ${record.value}<br>
                  <b>Дата:</b> ${record.next_date}
                </div>
                <p>Не забудьте подготовиться или записаться к ветеринару!</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Открыть PawLog</a>
              </div>
            `
          })

          await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)
        }
      }
    }

    return NextResponse.json({ success: true, processed: records?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

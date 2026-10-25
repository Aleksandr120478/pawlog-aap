import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

type PetData = { name: string; user_id: string }

export async function GET(request: Request) {
  // 1. ЗАЩИТА: Проверка секретного ключа (Bearer Token)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Получаем сегодняшнюю дату в формате YYYY-MM-DD (UTC)
    const today = new Date().toISOString().split('T')[0]

    // 2. БАТЧИНГ И ДАТА: Берем до 50 записей, где дата уже наступила
    const { data: records, error } = await supabase
      .from('health_records')
      .select(`
        id, value, next_date, reminder_sent,
        pets (name, user_id)
      `)
      .not('next_date', 'is', null)
      .lte('next_date', today) // Дата напоминания сегодня или в прошлом
      .eq('reminder_sent', false)
      .limit(50)

    if (error) throw error

    if (!records || records.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    let sentCount = 0

    // 3. ЦИКЛ: Обрабатываем каждую запись
    for (const record of records) {
      // Убираем any, приводим тип аккуратно
      const rawPet = record.pets as unknown as PetData | PetData[] | null
      const pet = Array.isArray(rawPet) ? rawPet[0] : rawPet
      
      if (!pet) continue

      const { data: { user } } = await supabase.auth.admin.getUserById(pet.user_id)

      if (user?.email) {
        await resend.emails.send({
          from: 'PawLog <onboarding@resend.dev>',
          to: user.email,
          subject: `Напоминание: ${pet.name} ждет процедура!`,
          html: `<h2>Привет! 🐾</h2><p>У питомца <b>${pet.name}</b> запланировано: ${record.value} на ${record.next_date}</p>`
        })
        
        // Отмечаем как отправленное
        await supabase.from('health_records').update({ reminder_sent: true }).eq('id', record.id)
        sentCount++
      }
    }

    return NextResponse.json({ success: true, sent: sentCount })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
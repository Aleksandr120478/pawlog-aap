import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const response = await resend.emails.send({
      from: 'PawLog <onboarding@resend.dev>',
      to: '6222285@mail.ru',
      subject: 'Тест PawLog',
      html: '<h1>Ура! Почта работает!</h1>'
    })

    return NextResponse.json({ success: true, response })
  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}

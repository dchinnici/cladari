import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const sanitizedName = name.trim().slice(0, 200)
    const sanitizedEmail = email.trim().slice(0, 200)

    // Log to Vercel runtime logs as reliable backup
    console.log(`[Contact Form] Name: ${sanitizedName} | Email: ${sanitizedEmail} | Time: ${new Date().toISOString()}`)

    // Send Telegram notification (best-effort, don't fail the request if it fails)
    const telegramResult = await sendTelegramMessage(
      `🌱 <b>New Beta Request</b>\n\n` +
      `<b>Name:</b> ${sanitizedName}\n` +
      `<b>Email:</b> ${sanitizedEmail}\n` +
      `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`,
      { parseMode: 'HTML' }
    )

    if (!telegramResult.success) {
      console.warn('[Contact Form] Telegram notification failed:', telegramResult.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact Form] Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

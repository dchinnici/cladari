import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { category, message, page } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const sanitizedMessage = message.trim().slice(0, 2000)
    const sanitizedCategory = (category || 'General').slice(0, 50)
    const sanitizedPage = (page || '/').slice(0, 200)
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

    // Log to Vercel runtime logs as backup
    console.log(`[Feedback] From: ${user.email} | Category: ${sanitizedCategory} | Page: ${sanitizedPage} | Message: ${sanitizedMessage}`)

    const telegramResult = await sendTelegramMessage(
      `<b>Beta Feedback</b>\n\n` +
      `<b>From:</b> ${user.email}\n` +
      `<b>Category:</b> ${sanitizedCategory}\n` +
      `<b>Page:</b> ${sanitizedPage}\n` +
      `<b>Time:</b> ${timestamp}\n\n` +
      `${sanitizedMessage}`,
      { parseMode: 'HTML' }
    )

    if (!telegramResult.success) {
      console.warn('[Feedback] Telegram notification failed:', telegramResult.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Feedback] Error:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}

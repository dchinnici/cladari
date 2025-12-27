/**
 * Telegram Bot API Client
 *
 * Sends notifications via the Cladari Care Bot.
 *
 * Environment variables:
 *   TELEGRAM_BOT_TOKEN - Bot token from @BotFather
 *   TELEGRAM_CHAT_ID - Your personal chat ID
 */

const TELEGRAM_API = 'https://api.telegram.org'

interface TelegramResponse {
  ok: boolean
  result?: any
  description?: string
  error_code?: number
}

interface SendMessageOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableNotification?: boolean
  disableWebPagePreview?: boolean
}

/**
 * Send a message via the Cladari Care Bot
 */
export async function sendTelegramMessage(
  text: string,
  options: SendMessageOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.error('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    return { success: false, error: 'Telegram not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_notification: options.disableNotification || false,
        disable_web_page_preview: options.disableWebPagePreview || true
      })
    })

    const data: TelegramResponse = await response.json()

    if (!data.ok) {
      console.error('[Telegram] API error:', data.description)
      return { success: false, error: data.description }
    }

    return { success: true }
  } catch (error) {
    console.error('[Telegram] Send failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Format a daily care digest message
 */
export function formatDailyDigest(data: {
  overdue: Array<{ plantId: string; name: string; daysSince: number }>
  dueToday: Array<{ plantId: string; name: string }>
  alerts: Array<{ location: string; message: string }>
  stats: { healthy: number; flowering: number; total: number }
  date: Date
}): string {
  const lines: string[] = []

  // Header
  const dateStr = data.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
  lines.push(`🌿 <b>Cladari Daily Care</b> - ${dateStr}`)
  lines.push('')

  // Overdue plants (urgent)
  if (data.overdue.length > 0) {
    lines.push(`🔴 <b>OVERDUE</b> (${data.overdue.length}):`)
    for (const plant of data.overdue.slice(0, 5)) {
      lines.push(`• ${plant.plantId} - ${plant.name} (${plant.daysSince}d)`)
    }
    if (data.overdue.length > 5) {
      lines.push(`  <i>...and ${data.overdue.length - 5} more</i>`)
    }
    lines.push('')
  }

  // Due today (warning)
  if (data.dueToday.length > 0) {
    lines.push(`🟡 <b>DUE TODAY</b> (${data.dueToday.length}):`)
    for (const plant of data.dueToday.slice(0, 5)) {
      lines.push(`• ${plant.plantId} - ${plant.name}`)
    }
    if (data.dueToday.length > 5) {
      lines.push(`  <i>...and ${data.dueToday.length - 5} more</i>`)
    }
    lines.push('')
  }

  // Environmental alerts
  if (data.alerts.length > 0) {
    lines.push(`⚠️ <b>ALERTS</b>:`)
    for (const alert of data.alerts) {
      lines.push(`• ${alert.location}: ${alert.message}`)
    }
    lines.push('')
  }

  // All good message
  if (data.overdue.length === 0 && data.dueToday.length === 0 && data.alerts.length === 0) {
    lines.push(`✅ All plants on schedule!`)
    lines.push('')
  }

  // Stats footer
  const floweringStr = data.stats.flowering > 0 ? `, ${data.stats.flowering} flowering` : ''
  lines.push(`📊 ${data.stats.healthy}/${data.stats.total} healthy${floweringStr}`)

  return lines.join('\n')
}

/**
 * Send a quick test message
 */
export async function sendTestMessage(): Promise<{ success: boolean; error?: string }> {
  return sendTelegramMessage(
    '🧪 <b>Test Message</b>\n\nCladari Care Bot is working correctly!',
    { parseMode: 'HTML' }
  )
}

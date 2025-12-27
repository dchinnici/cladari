/**
 * Test Telegram notification
 *
 * Run with: npx tsx scripts/test-telegram.ts
 */

import 'dotenv/config'
import { sendTestMessage, sendTelegramMessage, formatDailyDigest } from '../src/lib/telegram'

async function main() {
  console.log('Testing Telegram integration...')
  console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? '✓ Set' : '✗ Missing')
  console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID ? '✓ Set' : '✗ Missing')
  console.log('')

  // Test simple message
  console.log('Sending test message...')
  const testResult = await sendTestMessage()
  console.log('Result:', testResult)

  if (!testResult.success) {
    process.exit(1)
  }

  // Test formatted digest
  console.log('\nSending sample digest...')
  const sampleDigest = formatDailyDigest({
    overdue: [
      { plantId: 'ANT-2025-0012', name: 'Papillilaminum', daysSince: 6 },
      { plantId: 'ANT-2025-0018', name: 'Crystallinum', daysSince: 5 },
    ],
    dueToday: [
      { plantId: 'ANT-2025-0007', name: 'Magnificum' },
    ],
    alerts: [
      { location: 'Balcony', message: 'Humidity 48% (below 55%)' },
    ],
    stats: { healthy: 65, flowering: 3, total: 70 },
    date: new Date()
  })

  const digestResult = await sendTelegramMessage(sampleDigest)
  console.log('Result:', digestResult)

  console.log('\n✅ Telegram integration working!')
}

main().catch(console.error)

/**
 * Test Daily Digest with Real Data
 *
 * Run with: npx tsx scripts/test-daily-digest.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { sendTelegramMessage, formatDailyDigest } from '../src/lib/telegram'
import { getWateringStatus } from '../src/lib/care-thresholds'

const prisma = new PrismaClient()

async function main() {
  const userId = process.env.NOTIFY_USER_ID

  if (!userId) {
    console.error('NOTIFY_USER_ID not configured')
    process.exit(1)
  }

  console.log('Fetching plants for user:', userId)

  const plants = await prisma.plant.findMany({
    where: { userId },
    include: {
      careLogs: {
        orderBy: { date: 'desc' },
        take: 20,
      }
    }
  })

  console.log(`Found ${plants.length} plants`)

  // Categorize plants by care status
  const overdue: Array<{ plantId: string; name: string; daysSince: number }> = []
  const dueToday: Array<{ plantId: string; name: string }> = []
  let healthyCount = 0
  let floweringCount = 0

  for (const plant of plants) {
    const careLogs = plant.careLogs.map(log => ({
      id: log.id,
      date: log.date.toISOString(),
      action: log.action || '',
    }))

    const status = getWateringStatus(careLogs)
    const name = plant.hybridName || plant.species || 'Unknown'

    if (status.status === 'overdue') {
      overdue.push({
        plantId: plant.plantId,
        name,
        daysSince: status.daysSinceLastCare || 0
      })
    } else if (status.status === 'warning') {
      dueToday.push({ plantId: plant.plantId, name })
    } else {
      healthyCount++
    }

    if (plant.healthStatus === 'flowering') {
      floweringCount++
    }
  }

  // Sort overdue by days since care (most overdue first)
  overdue.sort((a, b) => b.daysSince - a.daysSince)

  console.log('\nSummary:')
  console.log(`  Overdue: ${overdue.length}`)
  console.log(`  Due today: ${dueToday.length}`)
  console.log(`  Healthy: ${healthyCount}`)
  console.log(`  Flowering: ${floweringCount}`)

  // Format message
  const message = formatDailyDigest({
    overdue,
    dueToday,
    alerts: [],
    stats: {
      healthy: healthyCount,
      flowering: floweringCount,
      total: plants.length
    },
    date: new Date()
  })

  console.log('\nMessage preview:')
  console.log('─'.repeat(40))
  console.log(message.replace(/<[^>]+>/g, '')) // Strip HTML for console
  console.log('─'.repeat(40))

  console.log('\nSending to Telegram...')
  const result = await sendTelegramMessage(message)
  console.log('Result:', result)

  await prisma.$disconnect()
}

main().catch(console.error)

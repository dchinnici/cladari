/**
 * POST /api/notifications/daily-digest
 *
 * Sends a daily care digest via Telegram.
 * Called by Vercel Cron at 8am EST.
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized triggers.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTelegramMessage, formatDailyDigest } from '@/lib/telegram'
import { getWateringStatus } from '@/lib/care-thresholds'

// For now, hardcode the user ID - in multi-tenant, would iterate over subscribed users
const NOTIFY_USER_ID = process.env.NOTIFY_USER_ID

export async function POST(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow if: cron secret matches, or no secret configured (dev mode)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[Daily Digest] Unauthorized attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!NOTIFY_USER_ID) {
    console.error('[Daily Digest] NOTIFY_USER_ID not configured')
    return NextResponse.json({ error: 'User not configured' }, { status: 500 })
  }

  console.log('[Daily Digest] Starting digest generation...')

  try {
    // Fetch all plants with recent care logs
    const plants = await prisma.plant.findMany({
      where: { userId: NOTIFY_USER_ID },
      include: {
        careLogs: {
          orderBy: { date: 'desc' },
          take: 20, // Enough for threshold calculation
        }
      }
    })

    console.log(`[Daily Digest] Found ${plants.length} plants`)

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

      // Count flowering plants (check healthStatus field)
      if (plant.healthStatus === 'flowering') {
        floweringCount++
      }
    }

    // Sort overdue by days since care (most overdue first)
    overdue.sort((a, b) => b.daysSince - a.daysSince)

    // Environmental alerts - TODO: Add SensorPush API integration
    // For now, just send empty alerts array
    const alerts: Array<{ location: string; message: string }> = []

    // Format and send message
    const message = formatDailyDigest({
      overdue,
      dueToday,
      alerts,
      stats: {
        healthy: healthyCount,
        flowering: floweringCount,
        total: plants.length
      },
      date: new Date()
    })

    console.log('[Daily Digest] Sending message...')
    const result = await sendTelegramMessage(message)

    if (!result.success) {
      console.error('[Daily Digest] Failed to send:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log('[Daily Digest] Sent successfully')
    return NextResponse.json({
      success: true,
      summary: {
        overdue: overdue.length,
        dueToday: dueToday.length,
        alerts: alerts.length,
        total: plants.length
      }
    })

  } catch (error) {
    console.error('[Daily Digest] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing (with same auth)
export async function GET(req: NextRequest) {
  return POST(req)
}

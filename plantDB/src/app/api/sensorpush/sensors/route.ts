import { NextResponse } from 'next/server'
import { getSensors, getSamples, fahrenheitToCelsius } from '@/lib/sensorpush'
import prisma from '@/lib/prisma'

/**
 * GET /api/sensorpush/sensors
 *
 * Returns all SensorPush sensors from the account with:
 * - Sensor ID, name, battery level
 * - Latest reading (temp, humidity)
 * - Whether it's currently linked to a location
 */
export async function GET() {
  try {
    // Fetch sensors from SensorPush API
    const sensors = await getSensors()

    // Fetch latest readings for all sensors
    const samples = await getSamples([], 1)

    // Get current location mappings
    const locations = await prisma.location.findMany({
      where: { sensorPushId: { not: null } },
      select: { sensorPushId: true, name: true }
    })

    const locationMap = new Map(
      locations.map(l => [l.sensorPushId!, l.name])
    )

    // Build response with sensor info + latest readings + linked status
    const result = Object.entries(sensors).map(([id, sensor]) => {
      const latest = samples.sensors[id]?.[0]
      const linkedTo = locationMap.get(id)

      return {
        id,
        name: sensor.name,
        deviceId: sensor.deviceId,
        active: sensor.active,
        batteryVoltage: sensor.battery_voltage,
        rssi: sensor.rssi,
        linkedTo: linkedTo || null,
        latestReading: latest ? {
          temperature: fahrenheitToCelsius(latest.temperature),
          temperatureF: latest.temperature,
          humidity: latest.humidity,
          vpd: latest.vpd,
          observed: latest.observed
        } : null
      }
    })

    // Sort: unlinked first, then by name
    result.sort((a, b) => {
      if (a.linkedTo && !b.linkedTo) return 1
      if (!a.linkedTo && b.linkedTo) return -1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ sensors: result })

  } catch (error) {
    console.error('Error fetching sensors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sensors', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/supabase/server';
import { getSensors, getSamples, getAllLatestReadings, type SensorPushSample } from '@/lib/sensorpush';

/**
 * GET /api/sensorpush/sync
 *
 * Fetch latest readings from all SensorPush sensors and update
 * environmental data for mapped locations.
 *
 * Authentication: Requires either:
 * - CRON_SECRET header (for automated cron jobs)
 * - Valid user session (for manual triggers)
 *
 * Returns current readings for all sensors.
 */
export async function GET(request: Request) {
  try {
    // Validate cron secret OR user auth
    const headersList = await headers();
    const cronSecret = headersList.get('x-cron-secret') || headersList.get('authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, check it first
    if (expectedSecret && cronSecret === expectedSecret) {
      // Valid cron request - proceed
    } else {
      // Fall back to user authentication
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    // Get all sensors from SensorPush
    const sensors = await getSensors();

    // Get latest readings for all sensors
    const readings = await getAllLatestReadings();

    // Get all locations with sensorPushId mapped
    const locations = await prisma.location.findMany({
      where: {
        sensorPushId: { not: null },
      },
      select: {
        id: true,
        name: true,
        sensorPushId: true,
        lastSensorSync: true,
        temperature: true,
        humidity: true,
      },
    });

    // Detect and clean duplicate sensorPushId mappings (keep most recently synced)
    const sensorLocationMap = new Map<string, typeof locations>();
    for (const loc of locations) {
      const key = loc.sensorPushId!;
      if (!sensorLocationMap.has(key)) sensorLocationMap.set(key, []);
      sensorLocationMap.get(key)!.push(loc);
    }
    for (const [sensorId, locs] of sensorLocationMap) {
      if (locs.length > 1) {
        // Keep the one with the most recent sync, clear the rest
        const sorted = locs.sort((a, b) =>
          (b.lastSensorSync?.getTime() || 0) - (a.lastSensorSync?.getTime() || 0)
        );
        for (let i = 1; i < sorted.length; i++) {
          console.log(`[Sync] Clearing duplicate sensorPushId ${sensorId} from ${sorted[i].name} (keeping ${sorted[0].name})`);
          await prisma.location.update({
            where: { id: sorted[i].id },
            data: { sensorPushId: null, lastSensorSync: null, temperature: null, humidity: null, vpd: null },
          });
          // Remove from locations array so we don't try to sync it
          const idx = locations.indexOf(sorted[i]);
          if (idx !== -1) locations.splice(idx, 1);
        }
      }
    }

    const updates: Array<{
      locationName: string;
      sensorName: string;
      reading: SensorPushSample | null;
      updated: boolean;
    }> = [];

    // Update each mapped location
    for (const location of locations) {
      const sensorId = location.sensorPushId!;
      const sensor = sensors[sensorId];
      const reading = readings[sensorId];

      if (reading) {
        // Update location with latest environmental data
        // Note: SensorPush provides VPD directly, no need to calculate
        await prisma.location.update({
          where: { id: location.id },
          data: {
            temperature: reading.temperature,
            humidity: reading.humidity,
            vpd: reading.vpd,
            lastSensorSync: new Date(),
          },
        });

        updates.push({
          locationName: location.name,
          sensorName: sensor?.name || sensorId,
          reading,
          updated: true,
        });
      } else {
        updates.push({
          locationName: location.name,
          sensorName: sensor?.name || sensorId,
          reading: null,
          updated: false,
        });
      }
    }

    // Build sensor summary for unmapped sensors
    const mappedSensorIds = new Set(locations.map((l) => l.sensorPushId));
    const unmappedSensors = Object.entries(sensors)
      .filter(([id]) => !mappedSensorIds.has(id))
      .map(([id, sensor]) => ({
        id,
        name: sensor.name,
        reading: readings[id] || null,
      }));

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      updates,
      unmappedSensors,
      totalSensors: Object.keys(sensors).length,
      mappedLocations: locations.length,
    });
  } catch (error) {
    console.error('SensorPush sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sensorpush/sync
 *
 * Map a sensor to a location.
 *
 * Body: { locationId: string, sensorPushId: string }
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, sensorPushId } = body;

    if (!locationId || !sensorPushId) {
      return NextResponse.json(
        { error: 'locationId and sensorPushId are required' },
        { status: 400 }
      );
    }

    // Verify location ownership
    const existingLocation = await prisma.location.findFirst({
      where: { id: locationId, userId: user.id },
    });
    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Verify sensor exists
    const sensors = await getSensors();
    const sensor = sensors[sensorPushId];

    if (!sensor) {
      return NextResponse.json(
        { error: `Sensor ${sensorPushId} not found in SensorPush account` },
        { status: 404 }
      );
    }

    // Unlink this sensor from any other location first
    await prisma.location.updateMany({
      where: {
        sensorPushId,
        id: { not: locationId },
      },
      data: {
        sensorPushId: null,
        lastSensorSync: null,
      },
    });

    // Link sensor to new location
    const location = await prisma.location.update({
      where: { id: locationId },
      data: { sensorPushId },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        name: location.name,
        sensorPushId: location.sensorPushId,
      },
      sensor: {
        id: sensorPushId,
        name: sensor.name,
      },
    });
  } catch (error) {
    console.error('SensorPush mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sensorpush/sync
 *
 * Remove sensor mapping from a location.
 *
 * Body: { locationId: string }
 */
export async function DELETE(request: Request) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Verify location ownership
    const existingLocation = await prisma.location.findFirst({
      where: { id: locationId, userId: user.id },
    });
    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const location = await prisma.location.update({
      where: { id: locationId },
      data: {
        sensorPushId: null,
        lastSensorSync: null,
        temperature: null,
        humidity: null,
        vpd: null,
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        name: location.name,
      },
    });
  } catch (error) {
    console.error('SensorPush unmapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

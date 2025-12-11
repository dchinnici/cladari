import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSamples, getSensors, type SensorPushSample } from '@/lib/sensorpush';

/**
 * GET /api/sensorpush/history
 *
 * Fetch historical readings from SensorPush sensors.
 *
 * Query params:
 * - locationId: Get history for a specific location's sensor
 * - sensorId: Direct sensor ID (optional, alternative to locationId)
 * - hours: Number of hours of history (default: 24, max: 720 = 30 days)
 * - limit: Max samples to return (default: 100, max: 500)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const sensorIdParam = searchParams.get('sensorId');
    const hours = Math.min(parseInt(searchParams.get('hours') || '24'), 720);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    let sensorId = sensorIdParam;

    // If locationId provided, look up the sensor mapping
    if (locationId && !sensorId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { name: true, sensorPushId: true },
      });

      if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
      }

      if (!location.sensorPushId) {
        return NextResponse.json(
          { error: `Location "${location.name}" has no sensor mapped` },
          { status: 400 }
        );
      }

      sensorId = location.sensorPushId;
    }

    // Calculate time range
    const stopTime = new Date();
    const startTime = new Date(stopTime.getTime() - hours * 60 * 60 * 1000);

    // Fetch samples
    const sensorIds = sensorId ? [sensorId] : [];
    const samplesResponse = await getSamples(sensorIds, limit, startTime, stopTime);

    // Get sensor names for display
    const sensors = await getSensors();

    // Format response
    const history: Record<
      string,
      {
        sensorName: string;
        sensorId: string;
        samples: Array<{
          observed: string;
          temperature: number;
          humidity: number;
          vpd: number;
          dewpoint: number | null;
          barometricPressure?: number;
        }>;
        stats: {
          count: number;
          tempMin: number;
          tempMax: number;
          tempAvg: number;
          humidityMin: number;
          humidityMax: number;
          humidityAvg: number;
          vpdMin: number;
          vpdMax: number;
          vpdAvg: number;
        };
      }
    > = {};

    for (const [id, samples] of Object.entries(samplesResponse.sensors)) {
      const sensor = sensors[id];

      // Calculate stats
      const temps = samples.map((s) => s.temperature);
      const humidities = samples.map((s) => s.humidity);
      const vpds = samples.map((s) => s.vpd);

      history[id] = {
        sensorName: sensor?.name || id,
        sensorId: id,
        samples: samples.map((s) => ({
          observed: s.observed,
          temperature: s.temperature,
          humidity: s.humidity,
          vpd: s.vpd,
          dewpoint: s.dewpoint,
          barometricPressure: s.barometric_pressure,
        })),
        stats: {
          count: samples.length,
          tempMin: Math.min(...temps),
          tempMax: Math.max(...temps),
          tempAvg: temps.reduce((a, b) => a + b, 0) / temps.length,
          humidityMin: Math.min(...humidities),
          humidityMax: Math.max(...humidities),
          humidityAvg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
          vpdMin: Math.min(...vpds),
          vpdMax: Math.max(...vpds),
          vpdAvg: vpds.reduce((a, b) => a + b, 0) / vpds.length,
        },
      };
    }

    return NextResponse.json({
      success: true,
      query: {
        startTime: startTime.toISOString(),
        stopTime: stopTime.toISOString(),
        hours,
        limit,
        sensorId: sensorId || 'all',
      },
      totalSamples: samplesResponse.total_samples,
      truncated: samplesResponse.truncated,
      history,
    });
  } catch (error) {
    console.error('SensorPush history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

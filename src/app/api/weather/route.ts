import { NextResponse } from 'next/server';
import { getWeather, formatCurrentWeather } from '@/lib/weather';

// Cache weather data in memory (refreshed every 10 min by cron)
let cachedWeather: Awaited<ReturnType<typeof getWeather>> | null = null;
let lastFetch: Date | null = null;

/**
 * GET /api/weather
 *
 * Returns current weather and 7-day forecast for Fort Lauderdale.
 * Data is cached and refreshed every 10 minutes.
 */
export async function GET() {
  try {
    // Return cached data if fresh (less than 15 minutes old)
    if (cachedWeather && lastFetch && (Date.now() - lastFetch.getTime()) < 15 * 60 * 1000) {
      return NextResponse.json({
        success: true,
        cached: true,
        ...cachedWeather,
        formatted: formatCurrentWeather(cachedWeather.current),
      });
    }

    // Fetch fresh data
    const weather = await getWeather();
    cachedWeather = weather;
    lastFetch = new Date();

    return NextResponse.json({
      success: true,
      cached: false,
      ...weather,
      formatted: formatCurrentWeather(weather.current),
    });
  } catch (error) {
    console.error('Weather API error:', error);

    // Return cached data if available, even if stale
    if (cachedWeather) {
      return NextResponse.json({
        success: true,
        cached: true,
        stale: true,
        ...cachedWeather,
        formatted: formatCurrentWeather(cachedWeather.current),
      });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weather
 *
 * Force refresh weather data (called by cron).
 */
export async function POST() {
  try {
    const weather = await getWeather();
    cachedWeather = weather;
    lastFetch = new Date();

    return NextResponse.json({
      success: true,
      refreshed: true,
      ...weather,
      formatted: formatCurrentWeather(weather.current),
    });
  } catch (error) {
    console.error('Weather refresh error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

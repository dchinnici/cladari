import { NextResponse } from 'next/server';
import { getWeather, formatCurrentWeather } from '@/lib/weather';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/weather
 *
 * Returns current weather and 7-day forecast for the user's configured location.
 * Returns 404 if the user has no location set.
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { latitude: true, longitude: true, timezone: true, city: true },
    });

    if (!profile?.latitude || !profile?.longitude) {
      return NextResponse.json(
        { success: false, error: 'No location configured. Set your location in Settings to enable weather features.' },
        { status: 404 }
      );
    }

    const weather = await getWeather(
      profile.latitude,
      profile.longitude,
      profile.timezone || 'America/New_York'
    );

    return NextResponse.json({
      success: true,
      city: profile.city,
      ...weather,
      formatted: formatCurrentWeather(weather.current),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

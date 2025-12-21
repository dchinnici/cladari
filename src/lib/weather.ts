/**
 * Open-Meteo Weather API Integration
 *
 * Free, no API key required weather data for Fort Lauderdale.
 * Used to contextualize outdoor sensor readings (rain vs fog vs humid).
 *
 * API Docs: https://open-meteo.com/en/docs
 */

// Fort Lauderdale coordinates (445 N Andrews Ave)
const LATITUDE = 26.1276;
const LONGITUDE = -80.1440;

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// API timeout in milliseconds (10 seconds)
const API_TIMEOUT_MS = 10000;

/**
 * Fetch with timeout using AbortController
 * Prevents hanging requests from blocking the application
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Open-Meteo API request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export interface CurrentWeather {
  temperature: number; // Fahrenheit
  humidity: number; // Percentage
  apparentTemperature: number; // Feels like, Fahrenheit
  precipitation: number; // mm
  rain: number; // mm
  weatherCode: number;
  weatherDescription: string;
  cloudCover: number; // Percentage
  windSpeed: number; // mph
  windDirection: number; // degrees
  windGusts: number; // mph
  uvIndex: number;
  isDay: boolean;
  observedAt: string; // ISO timestamp
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  weatherDescription: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  fetchedAt: string;
}

/**
 * Fetch current weather and 7-day forecast from Open-Meteo
 */
export async function getWeather(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: LATITUDE.toString(),
    longitude: LONGITUDE.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(','),
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'mm',
    timezone: 'America/New_York',
    forecast_days: '7',
  });

  const response = await fetchWithTimeout(`${OPEN_METEO_BASE}?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = await response.json();

  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    apparentTemperature: data.current.apparent_temperature,
    precipitation: data.current.precipitation,
    rain: data.current.rain,
    weatherCode: data.current.weather_code,
    weatherDescription: WEATHER_CODES[data.current.weather_code] || 'Unknown',
    cloudCover: data.current.cloud_cover,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    windGusts: data.current.wind_gusts_10m,
    uvIndex: data.current.uv_index,
    isDay: data.current.is_day === 1,
    observedAt: data.current.time,
  };

  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    weatherDescription: WEATHER_CODES[data.daily.weather_code[i]] || 'Unknown',
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitationSum: data.daily.precipitation_sum[i],
    precipitationProbability: data.daily.precipitation_probability_max[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
    uvIndexMax: data.daily.uv_index_max[i],
  }));

  return {
    current,
    daily,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get wind direction as compass bearing
 */
export function windDirectionToCompass(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Format current weather for display
 */
export function formatCurrentWeather(weather: CurrentWeather): string {
  const windDir = windDirectionToCompass(weather.windDirection);
  let condition = weather.weatherDescription;

  // Add rain amount if raining
  if (weather.rain > 0) {
    condition += ` (${weather.rain.toFixed(1)}mm)`;
  }

  return `${condition}, ${weather.temperature.toFixed(0)}°F (feels ${weather.apparentTemperature.toFixed(0)}°F), Wind ${weather.windSpeed.toFixed(0)}mph ${windDir}, UV ${weather.uvIndex.toFixed(1)}`;
}

/**
 * Check if weather indicates precipitation
 */
export function isPrecipitating(weather: CurrentWeather): boolean {
  // Weather codes 51-99 indicate precipitation
  return weather.weatherCode >= 51 || weather.rain > 0 || weather.precipitation > 0;
}

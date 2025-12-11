/**
 * SensorPush Cloud API Integration
 *
 * Handles authentication and data retrieval from SensorPush sensors
 * for temperature/humidity monitoring of plant growing locations.
 *
 * API Docs: https://www.sensorpush.com/gateway-cloud-api
 */

const SENSORPUSH_API_BASE = 'https://api.sensorpush.com/api/v1';

// Token cache (in-memory, refreshed as needed)
let cachedAccessToken: string | null = null;
let tokenExpiry: Date | null = null;

interface SensorPushAuthResponse {
  authorization: string;
}

interface SensorPushAccessTokenResponse {
  accesstoken: string;
}

export interface SensorPushSensor {
  id: string;
  name: string;
  deviceId: string;
  active: boolean;
  alerts: {
    temperature: { enabled: boolean };
    humidity: { enabled: boolean };
  };
  calibration: {
    temperature: number;
    humidity: number;
  };
  battery_voltage: number;
  rssi: number;
}

export interface SensorPushSample {
  observed: string; // ISO timestamp
  temperature: number; // Fahrenheit
  humidity: number; // Percentage
  dewpoint: number;
  vpd: number; // Vapor Pressure Deficit in kPa
  barometric_pressure?: number;
}

export interface SensorPushSamplesResponse {
  last_time: string;
  sensors: {
    [sensorId: string]: SensorPushSample[];
  };
  status: string;
  total_samples: number;
  total_sensors: number;
  truncated: boolean;
}

/**
 * Get authorization code (step 1 of OAuth)
 */
async function getAuthorizationCode(email: string, password: string): Promise<string> {
  const response = await fetch(`${SENSORPUSH_API_BASE}/oauth/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SensorPush authorization failed: ${error}`);
  }

  const data: SensorPushAuthResponse = await response.json();
  return data.authorization;
}

/**
 * Exchange authorization code for access token (step 2 of OAuth)
 */
async function getAccessToken(authorizationCode: string): Promise<string> {
  const response = await fetch(`${SENSORPUSH_API_BASE}/oauth/accesstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorization: authorizationCode }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SensorPush access token failed: ${error}`);
  }

  const data: SensorPushAccessTokenResponse = await response.json();
  return data.accesstoken;
}

/**
 * Get a valid access token, refreshing if needed
 */
export async function getValidAccessToken(): Promise<string> {
  // Check if we have a valid cached token (with 5 min buffer)
  if (cachedAccessToken && tokenExpiry && new Date() < new Date(tokenExpiry.getTime() - 5 * 60 * 1000)) {
    return cachedAccessToken;
  }

  const email = process.env.SENSORPUSH_EMAIL;
  const password = process.env.SENSORPUSH_PASSWORD;

  if (!email || !password) {
    throw new Error('SENSORPUSH_EMAIL and SENSORPUSH_PASSWORD environment variables required');
  }

  // Get new token
  const authCode = await getAuthorizationCode(email, password);
  cachedAccessToken = await getAccessToken(authCode);

  // SensorPush tokens are valid for ~1 hour, set expiry to 55 minutes
  tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

  return cachedAccessToken;
}

/**
 * Fetch all sensors from account
 */
export async function getSensors(): Promise<Record<string, SensorPushSensor>> {
  const token = await getValidAccessToken();

  const response = await fetch(`${SENSORPUSH_API_BASE}/devices/sensors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch sensors: ${error}`);
  }

  return response.json();
}

/**
 * Fetch samples from specific sensors
 *
 * @param sensorIds - Array of sensor IDs to fetch (empty = all sensors)
 * @param limit - Max samples per sensor (default 1 = most recent only)
 * @param startTime - Optional start time for historical data
 * @param stopTime - Optional end time for historical data
 */
export async function getSamples(
  sensorIds: string[] = [],
  limit: number = 1,
  startTime?: Date,
  stopTime?: Date
): Promise<SensorPushSamplesResponse> {
  const token = await getValidAccessToken();

  const body: Record<string, unknown> = {
    limit,
  };

  if (sensorIds.length > 0) {
    body.sensors = sensorIds;
  }

  if (startTime) {
    body.startTime = startTime.toISOString();
  }

  if (stopTime) {
    body.stopTime = stopTime.toISOString();
  }

  const response = await fetch(`${SENSORPUSH_API_BASE}/samples`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch samples: ${error}`);
  }

  return response.json();
}

/**
 * Get the latest reading for a specific sensor
 */
export async function getLatestReading(sensorId: string): Promise<SensorPushSample | null> {
  const data = await getSamples([sensorId], 1);
  const samples = data.sensors[sensorId];
  return samples && samples.length > 0 ? samples[0] : null;
}

/**
 * Get latest readings for all sensors mapped to locations
 */
export async function getAllLatestReadings(): Promise<Record<string, SensorPushSample>> {
  const data = await getSamples([], 1);
  const result: Record<string, SensorPushSample> = {};

  for (const [sensorId, samples] of Object.entries(data.sensors)) {
    if (samples && samples.length > 0) {
      result[sensorId] = samples[0];
    }
  }

  return result;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5 / 9;
}

/**
 * Format sensor reading for display
 */
export function formatReading(sample: SensorPushSample, useCelsius: boolean = false): {
  temperature: string;
  humidity: string;
  vpd: string;
  observed: string;
} {
  const temp = useCelsius
    ? `${fahrenheitToCelsius(sample.temperature).toFixed(1)}°C`
    : `${sample.temperature.toFixed(1)}°F`;

  return {
    temperature: temp,
    humidity: `${sample.humidity.toFixed(1)}%`,
    vpd: `${sample.vpd.toFixed(2)} kPa`,
    observed: new Date(sample.observed).toLocaleString(),
  };
}

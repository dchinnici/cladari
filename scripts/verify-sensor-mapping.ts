/**
 * Verify Sensor Mapping
 * Shows current sensor readings with both ID and name to confirm mapping
 */

import 'dotenv/config';
import { getSensors, getSamples } from '../src/lib/sensorpush';

async function main() {
  console.log('🔍 Fetching current sensor readings...\n');

  const sensors = await getSensors();

  // Get latest samples (last 5 minutes)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const samples = await getSamples(fiveMinutesAgo, now);

  console.log('📡 Current Sensors:\n');
  console.log('Name'.padEnd(15) + 'Temp (°F)'.padEnd(15) + 'Humidity (%)'.padEnd(15) + 'Device ID');
  console.log('─'.repeat(80));

  for (const [sensorId, sensor] of Object.entries(sensors)) {
    const name = sensor.name || '(unnamed)';

    // Find most recent sample for this sensor
    const sensorSamples = samples[sensorId];
    const latestSample = sensorSamples?.[sensorSamples.length - 1];

    const temp = latestSample?.temperature?.toFixed(1) || '—';
    const humidity = latestSample?.humidity?.toFixed(1) || '—';

    console.log(
      name.padEnd(15) +
      temp.padEnd(15) +
      humidity.padEnd(15) +
      sensorId
    );
  }

  console.log('\n✅ Mapping verification complete!\n');
}

main().catch(console.error);

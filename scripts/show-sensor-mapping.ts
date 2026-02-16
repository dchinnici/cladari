/**
 * Show Sensor Mapping
 * Displays the mapping between sensor names, device IDs, and locations
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { getSensors } from '../src/lib/sensorpush';

async function main() {
  console.log('🔍 Fetching sensor mapping...\n');

  // Get sensors from SensorPush API
  const sensors = await getSensors();

  // Get locations from database
  const locations = await prisma.location.findMany({
    where: {
      sensorPushId: { not: null }
    },
    select: {
      name: true,
      sensorPushId: true,
      _count: {
        select: { plants: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('📡 Sensor to Location Mapping:\n');
  console.log('Sensor'.padEnd(10) + 'Device ID (prefix)'.padEnd(25) + 'Location'.padEnd(20) + 'Plants');
  console.log('─'.repeat(75));

  // Create a map of device ID prefix to sensor name
  const sensorMap = new Map<string, string>();
  for (const [deviceId, sensor] of Object.entries(sensors)) {
    const prefix = deviceId.substring(0, 8);
    sensorMap.set(prefix, sensor.name || '(unnamed)');
  }

  for (const location of locations) {
    const deviceIdPrefix = location.sensorPushId?.substring(0, 8) || '—';
    const sensorName = sensorMap.get(deviceIdPrefix) || '?';
    const plantCount = location._count.plants.toString();

    console.log(
      sensorName.padEnd(10) +
      deviceIdPrefix.padEnd(25) +
      location.name.padEnd(20) +
      plantCount
    );
  }

  console.log('\n✅ Mapping complete!\n');
  console.log('💡 To update location sensor mappings in the database:');
  console.log('   Visit: https://www.cladari.ai/locations');
  console.log('   Or run: npx tsx scripts/update-sensor-mappings.ts\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

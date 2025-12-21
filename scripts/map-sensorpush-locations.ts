/**
 * Map SensorPush sensors to PlantDB locations
 *
 * Sensor mappings (from API discovery):
 * - 16938503.1326776003983611910 (Balcony OUTDOOR) → Balcony
 * - 16938552.30398449015631689 (Anthurium Shelf) → Ambient Display, Grow Center 2
 * - 16944137.39549430426932661 (Grow Tent) → Grow Tent 1
 *
 * Run with: npx tsx scripts/map-sensorpush-locations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sensor to location mappings
const SENSOR_MAPPINGS: Array<{
  sensorId: string;
  sensorName: string;
  locationNames: string[];
}> = [
  {
    sensorId: '16938503.1326776003983611910',
    sensorName: 'Balcony OUTDOOR',
    locationNames: ['Balcony'],
  },
  {
    sensorId: '16938552.30398449015631689',
    sensorName: 'Anthurium Shelf',
    locationNames: ['Ambient Display', 'Grow Center 2 (main floor)'],
  },
  {
    sensorId: '16944137.39549430426932661',
    sensorName: 'Grow Tent',
    locationNames: ['Grow Tent 1'],
  },
];

async function main() {
  console.log('Mapping SensorPush sensors to PlantDB locations...\n');

  for (const mapping of SENSOR_MAPPINGS) {
    console.log(`Sensor: ${mapping.sensorName} (${mapping.sensorId})`);

    for (const locationName of mapping.locationNames) {
      const location = await prisma.location.findFirst({
        where: { name: locationName },
      });

      if (!location) {
        console.log(`  ⚠️  Location "${locationName}" not found`);
        continue;
      }

      await prisma.location.update({
        where: { id: location.id },
        data: { sensorPushId: mapping.sensorId },
      });

      console.log(`  ✅ Mapped to: ${locationName} (${location.id})`);
    }
    console.log();
  }

  // Show unmapped locations
  const unmappedLocations = await prisma.location.findMany({
    where: { sensorPushId: null },
    select: { name: true },
  });

  if (unmappedLocations.length > 0) {
    console.log('Unmapped locations (no sensor):');
    for (const loc of unmappedLocations) {
      console.log(`  - ${loc.name}`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

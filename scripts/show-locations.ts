/**
 * Show Current Locations
 * Quick script to view all locations and their sensor mappings
 */

import prisma from '../src/lib/prisma';

async function main() {
  const locations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      sensorPushId: true,
      isOutdoor: true,
      _count: {
        select: { plants: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('\n📍 Current Locations:\n');
  console.log('ID'.padEnd(30) + 'Name'.padEnd(25) + 'Sensor ID'.padEnd(20) + 'Plants'.padEnd(10) + 'Outdoor');
  console.log('─'.repeat(100));

  locations.forEach(loc => {
    const id = loc.id.substring(0, 28);
    const name = loc.name || '(unnamed)';
    const sensor = loc.sensorPushId || '—';
    const plants = loc._count.plants.toString();
    const outdoor = loc.isOutdoor ? 'Yes' : 'No';

    console.log(
      id.padEnd(30) +
      name.padEnd(25) +
      sensor.padEnd(20) +
      plants.padEnd(10) +
      outdoor
    );
  });

  console.log('\n📊 Total: ' + locations.length + ' locations\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

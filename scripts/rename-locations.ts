/**
 * Location Rename Script
 *
 * Updates location names after move to new home
 * Preserves sensor mappings (sensorPushId stays linked)
 */

import prisma from '../src/lib/prisma';

const LOCATION_RENAMES: Record<string, string> = {
  // Old name → New name
  'Balcony': 'Outdoor',                  // Sensor 16938503... → will become sensor 0
  'Grow Center 1 (loft)': 'Plant Rack',  // Sensor 16944607... → will become sensor 1
  'Grow Tent 1': 'Sunroom',              // Sensor 16944137... → will become sensor 2
  'Bathtub': 'Bathroom',                 // Sensor 16938552... → will become sensor 3
  // Bedroom and Guestroom - will be created below
};

const NEW_LOCATIONS = [
  { name: 'Bedroom', type: 'indoor', sensorPushId: null },
  { name: 'Guestroom', type: 'indoor', sensorPushId: null },
];

async function main() {
  console.log('🏠 Starting location rename process...\n');

  // Get current locations
  const existingLocations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      sensorPushId: true,
      _count: {
        select: { plants: true }
      }
    }
  });

  console.log('📍 Current locations:');
  existingLocations.forEach(loc => {
    const sensor = loc.sensorPushId ? `Sensor: ${loc.sensorPushId}` : 'No sensor';
    const plants = `${loc._count.plants} plants`;
    console.log(`  - ${loc.name} (${sensor}, ${plants})`);
  });
  console.log('');

  // Rename existing locations
  let renamedCount = 0;
  for (const [oldName, newName] of Object.entries(LOCATION_RENAMES)) {
    const location = existingLocations.find(l => l.name === oldName);

    if (location) {
      console.log(`🔄 Renaming: "${oldName}" → "${newName}"`);

      await prisma.location.update({
        where: { id: location.id },
        data: { name: newName }
      });

      renamedCount++;
    } else {
      console.log(`⚠️  Skipped: "${oldName}" (not found)`);
    }
  }
  console.log('');

  // Create new locations if they don't exist
  let createdCount = 0;
  for (const newLoc of NEW_LOCATIONS) {
    const exists = existingLocations.find(l => l.name === newLoc.name);

    if (!exists) {
      console.log(`✨ Creating: "${newLoc.name}"`);

      // Note: Need userId for multi-tenant - get first user or prompt
      const firstUser = await prisma.profile.findFirst();
      if (!firstUser) {
        console.log(`❌ Error: No users found. Cannot create locations.`);
        continue;
      }

      await prisma.location.create({
        data: {
          name: newLoc.name,
          type: newLoc.type,
          userId: firstUser.id,
          sensorPushId: newLoc.sensorPushId,
        }
      });

      createdCount++;
    } else {
      console.log(`ℹ️  "${newLoc.name}" already exists`);
    }
  }
  console.log('');

  // Show final state
  const updatedLocations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      sensorPushId: true,
      _count: {
        select: { plants: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('✅ Updated locations:');
  updatedLocations.forEach(loc => {
    const sensor = loc.sensorPushId ? `Sensor: ${loc.sensorPushId}` : 'No sensor';
    const plants = `${loc._count.plants} plants`;
    console.log(`  - ${loc.name} (${sensor}, ${plants})`);
  });
  console.log('');

  console.log(`📊 Summary:`);
  console.log(`  - Renamed: ${renamedCount} locations`);
  console.log(`  - Created: ${createdCount} locations`);
  console.log(`  - Total: ${updatedLocations.length} locations`);
  console.log('');
  console.log('🎉 Location rename complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

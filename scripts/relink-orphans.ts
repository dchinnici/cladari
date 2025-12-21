import prisma from '../src/lib/prisma';

const orphans = [
  'ANT-2025-0003_1765480662940.jpg',
  'ANT-2025-0004_1762983222054.jpeg',
  'ANT-2025-0010_1762905915475.jpeg',
  'ANT-2025-0029_1762964739409.jpeg',
  'ANT-2025-0031_1762965734995.jpeg',
  'ANT-2025-0035_1762989019844.jpeg',
  'ANT-2025-0035_1762989021327.png',
  'ANT-2025-0035_1762989021785.jpeg',
  'ANT-2025-0038_1762903896587.jpeg',
  'ANT-2025-0041_1762926967842.jpeg',
  'ANT-2025-0041_1762926968640.jpeg',
  'ANT-2025-0046_1762706918925.jpeg',
  'ANT-2025-0057_1762927755476.jpeg',
  'ANT-2025-0057_1762927757122.dng',
  'ANT-2025-0057_1762927758998.dng',
  'ANT-2025-0057_1762927760453.dng',
  'ANT-2025-0057_1762927760813.jpeg',
  'ANT-2025-0057_1762927761224.jpeg'
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const filename of orphans) {
    // Extract plantId from filename (ANT-2025-XXXX)
    const match = filename.match(/^(ANT-2025-\d{4})/);
    if (!match) {
      console.log(`Could not parse plantId from: ${filename}`);
      continue;
    }

    const plantIdCode = match[1];

    // Find the plant
    const plant = await prisma.plant.findFirst({
      where: { plantId: plantIdCode }
    });

    if (!plant) {
      console.log(`Plant not found: ${plantIdCode}`);
      continue;
    }

    // Extract timestamp from filename for dateTaken
    const timestampMatch = filename.match(/_(\d+)\./);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

    // Determine photo type from extension
    const ext = filename.split('.').pop()?.toLowerCase();

    // Skip DNG files - they're not displayable in browser
    if (ext === 'dng') {
      console.log(`Skipping DNG file: ${filename}`);
      skipped++;
      continue;
    }

    // Check if already exists
    const existing = await prisma.photo.findFirst({
      where: { url: `/uploads/photos/${filename}` }
    });

    if (existing) {
      console.log(`Already exists: ${filename}`);
      skipped++;
      continue;
    }

    // Create the photo record
    await prisma.photo.create({
      data: {
        plantId: plant.id,
        url: `/uploads/photos/${filename}`,
        photoType: 'whole_plant',
        dateTaken: new Date(timestamp),
      }
    });

    console.log(`✓ Created: ${filename} -> ${plantIdCode} (${plant.hybridName})`);
    created++;
  }

  console.log(`\nDone! Created ${created} records, skipped ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

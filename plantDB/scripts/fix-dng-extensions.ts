/**
 * Fix mislabeled .dng files (actually JPEGs) by renaming to .jpg
 * Run: npx tsx scripts/fix-dng-extensions.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const LOCAL_PHOTOS_PATH = './public/uploads/photos'
const prisma = new PrismaClient()

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🔄 Fixing .dng → .jpg extensions')
  console.log('═══════════════════════════════════════════════════════════════')

  // Find all DNG files
  const files = fs.readdirSync(LOCAL_PHOTOS_PATH)
  const dngFiles = files.filter(f => f.toLowerCase().endsWith('.dng'))

  console.log(`\n📋 Found ${dngFiles.length} .dng files to rename\n`)

  let renamed = 0
  let failed = 0

  for (const dngFile of dngFiles) {
    const dngPath = path.join(LOCAL_PHOTOS_PATH, dngFile)
    const jpgFile = dngFile.replace(/\.dng$/i, '.jpg')
    const jpgPath = path.join(LOCAL_PHOTOS_PATH, jpgFile)

    try {
      // Rename the file
      fs.renameSync(dngPath, jpgPath)

      // Update database
      const oldUrl = `/uploads/photos/${dngFile}`
      const newUrl = `/uploads/photos/${jpgFile}`

      await prisma.photo.updateMany({
        where: { url: oldUrl },
        data: {
          url: newUrl,
          storagePath: null // Reset so photo migration picks it up
        }
      })

      console.log(`   ✓ ${dngFile} → ${jpgFile}`)
      renamed++

    } catch (err: any) {
      console.error(`   ❌ ${dngFile}: ${err.message}`)
      failed++
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(`   ✓ Renamed: ${renamed}`)
  console.log(`   ✗ Failed: ${failed}`)
  console.log('═══════════════════════════════════════════════════════════════')

  if (failed === 0) {
    console.log('\n🎉 All files renamed!')
    console.log('\nNext: Re-run photo migration:')
    console.log('   MIGRATION_USER_ID=01b9f666-3b6f-4a7f-8028-5ca833c4b02e npx tsx scripts/migrate-photos-to-supabase.ts')
  }

  await prisma.$disconnect()
}

main()

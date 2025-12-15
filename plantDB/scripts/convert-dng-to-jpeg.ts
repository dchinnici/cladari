/**
 * Convert DNG files to high-quality JPEG
 * Requires ImageMagick: brew install imagemagick
 *
 * Run: npx tsx scripts/convert-dng-to-jpeg.ts
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const LOCAL_PHOTOS_PATH = './public/uploads/photos'
const prisma = new PrismaClient()

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🔄 DNG → JPEG Conversion')
  console.log('═══════════════════════════════════════════════════════════════')

  // Check ImageMagick is installed
  try {
    execSync('which convert', { stdio: 'pipe' })
  } catch {
    console.error('❌ ImageMagick not found. Install with: brew install imagemagick')
    process.exit(1)
  }

  // Find all DNG files
  const files = fs.readdirSync(LOCAL_PHOTOS_PATH)
  const dngFiles = files.filter(f => f.toLowerCase().endsWith('.dng'))

  console.log(`\n📋 Found ${dngFiles.length} DNG files to convert\n`)

  let converted = 0
  let failed = 0

  for (const dngFile of dngFiles) {
    const dngPath = path.join(LOCAL_PHOTOS_PATH, dngFile)
    const jpegFile = dngFile.replace(/\.dng$/i, '.jpg')
    const jpegPath = path.join(LOCAL_PHOTOS_PATH, jpegFile)

    console.log(`🔄 Converting: ${dngFile}`)

    try {
      // Convert with ImageMagick - quality 95 for high fidelity
      execSync(`convert "${dngPath}" -quality 95 "${jpegPath}"`, {
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout per file
      })

      // Update database: change photo URL from .dng to .jpg
      const oldUrl = `/uploads/photos/${dngFile}`
      const newUrl = `/uploads/photos/${jpegFile}`

      const updated = await prisma.photo.updateMany({
        where: { url: oldUrl },
        data: {
          url: newUrl,
          storagePath: null // Reset so photo migration picks it up
        }
      })

      if (updated.count > 0) {
        console.log(`   ✓ Converted and DB updated (${updated.count} record)`)
        converted++
      } else {
        console.log(`   ✓ Converted (no matching DB record)`)
        converted++
      }

    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`)
      failed++
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('📊 Conversion Summary')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   ✓ Converted: ${converted}`)
  console.log(`   ✗ Failed: ${failed}`)
  console.log('═══════════════════════════════════════════════════════════════')

  if (failed === 0) {
    console.log('\n🎉 All DNG files converted!')
    console.log('\nNext: Re-run photo migration to upload the new JPEGs:')
    console.log('   MIGRATION_USER_ID=01b9f666-3b6f-4a7f-8028-5ca833c4b02e npx tsx scripts/migrate-photos-to-supabase.ts')
  }

  await prisma.$disconnect()
}

main()

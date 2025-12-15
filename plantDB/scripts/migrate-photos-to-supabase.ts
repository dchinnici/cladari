/**
 * Photo Migration Script: Local Files → Supabase Storage
 *
 * Migrates all photos from /public/uploads/ to Supabase Storage bucket
 * Run: npx tsx scripts/migrate-photos-to-supabase.ts
 *
 * Prerequisites:
 * 1. Data migration must be complete (photos table populated)
 * 2. Supabase Storage bucket "cladari-photos" created
 * 3. MIGRATION_USER_ID set (same as data migration)
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MIGRATION_USER_ID = process.env.MIGRATION_USER_ID || ''
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'cladari-photos'
const LOCAL_PHOTOS_PATH = './public/uploads/photos'
const LOCAL_THUMBNAILS_PATH = './public/uploads/thumbnails'

if (!MIGRATION_USER_ID) {
  console.error('❌ ERROR: MIGRATION_USER_ID not set!')
  console.error('   Run: MIGRATION_USER_ID=<uuid> npx tsx scripts/migrate-photos-to-supabase.ts')
  process.exit(1)
}

// Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic'
  }
  return types[ext] || 'application/octet-stream'
}

async function uploadFile(localPath: string, storagePath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(localPath)) {
      console.log(`   ⚠️  File not found: ${localPath}`)
      return false
    }

    const fileBuffer = fs.readFileSync(localPath)
    const contentType = getContentType(localPath)

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true // Overwrite if exists
      })

    if (error) {
      console.error(`   ❌ Upload failed: ${storagePath}`, error.message)
      return false
    }

    return true
  } catch (err) {
    console.error(`   ❌ Error uploading ${localPath}:`, err)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION
// ═══════════════════════════════════════════════════════════════════════════

async function migratePhotos() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📸 CLADARI Photo Migration: Local → Supabase Storage')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   Bucket: ${BUCKET_NAME}`)
  console.log(`   User ID: ${MIGRATION_USER_ID}`)
  console.log('═══════════════════════════════════════════════════════════════')

  // Get all photos from database
  const photos = await prisma.photo.findMany({
    include: { plant: { select: { plantId: true } } }
  })

  console.log(`\n📋 Found ${photos.length} photos to migrate\n`)

  let successCount = 0
  let failCount = 0
  let skippedCount = 0

  for (const photo of photos) {
    // Skip if already migrated (has storagePath)
    if (photo.storagePath) {
      skippedCount++
      continue
    }

    const plantId = photo.plant?.plantId || 'unknown'

    // Extract filename from URL
    // URL format: /uploads/photos/ANT-2025-0003_1762902888348.jpeg
    const urlParts = photo.url?.split('/') || []
    const filename = urlParts[urlParts.length - 1]

    if (!filename) {
      console.log(`   ⚠️  No filename found for photo ${photo.id}`)
      failCount++
      continue
    }

    // Storage paths
    const photoStoragePath = `${MIGRATION_USER_ID}/photos/${filename}`
    const thumbnailStoragePath = `${MIGRATION_USER_ID}/thumbnails/${filename}`

    // Local paths
    const localPhotoPath = path.join(LOCAL_PHOTOS_PATH, filename)
    const localThumbPath = path.join(LOCAL_THUMBNAILS_PATH, filename)

    console.log(`📤 ${plantId} - ${filename}`)

    // Upload photo
    const photoUploaded = await uploadFile(localPhotoPath, photoStoragePath)

    // Upload thumbnail (optional - may not exist)
    let thumbnailUploaded = false
    if (fs.existsSync(localThumbPath)) {
      thumbnailUploaded = await uploadFile(localThumbPath, thumbnailStoragePath)
    }

    if (photoUploaded) {
      // Update database with storage paths
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          storagePath: photoStoragePath,
          thumbnailPath: thumbnailUploaded ? thumbnailStoragePath : null
        }
      })
      successCount++
      console.log(`   ✓ Uploaded and DB updated`)
    } else {
      failCount++
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('📊 Migration Summary')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   ✓ Successful: ${successCount}`)
  console.log(`   ✗ Failed: ${failCount}`)
  console.log(`   ⏭ Skipped (already migrated): ${skippedCount}`)
  console.log('═══════════════════════════════════════════════════════════════')

  if (failCount === 0) {
    console.log('\n🎉 Photo migration complete!')
    console.log('\nNext steps:')
    console.log('   1. Update photo API routes to use Supabase Storage')
    console.log('   2. Test photo display in UI')
    console.log('   3. Archive local files: tar -czf uploads-backup.tar.gz public/uploads/')
  } else {
    console.log('\n⚠️  Some photos failed to migrate. Check logs above.')
  }
}

async function createBucket() {
  console.log('\n🪣 Checking/creating storage bucket...')

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('❌ Failed to list buckets:', listError)
    return false
  }

  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (bucketExists) {
    console.log(`   ✓ Bucket "${BUCKET_NAME}" exists`)
    return true
  }

  // Create bucket
  const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: false, // Private - require signed URLs
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
  })

  if (createError) {
    console.error('❌ Failed to create bucket:', createError)
    return false
  }

  console.log(`   ✓ Bucket "${BUCKET_NAME}" created`)
  return true
}

async function main() {
  try {
    // Ensure bucket exists
    const bucketReady = await createBucket()
    if (!bucketReady) {
      console.error('\n❌ Cannot proceed without storage bucket')
      process.exit(1)
    }

    // Migrate photos
    await migratePhotos()

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

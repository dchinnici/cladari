import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import prisma from '@/lib/prisma'
import { exiftool } from 'exiftool-vendored'
import { getUser, uploadToStorage, deleteFromStorage } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const plantId = formData.get('plantId') as string
    const photoType = formData.get('photoType') as string || 'whole_plant'
    const growthStage = formData.get('growthStage') as string || null
    const notes = formData.get('notes') as string || null
    const manualDateTaken = formData.get('dateTaken') as string || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!plantId) {
      return NextResponse.json({ error: 'Plant ID is required' }, { status: 400 })
    }

    // Verify plant exists and belongs to user
    const plant = await prisma.plant.findUnique({ where: { id: plantId } })
    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate temporary file path for EXIF extraction
    const tempDir = path.join(process.cwd(), 'tmp')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${file.name}`)

    // Write buffer to temp file for exiftool processing
    await writeFile(tempFilePath, buffer)

    // Extract EXIF data from photo using exiftool (handles all formats: JPEG, DNG, RAW, HEIC, etc.)
    let exifDate: Date | null = null
    let exifTags: any = null
    let exifOrientation: number = 1 // Default: normal orientation
    try {
      exifTags = await exiftool.read(tempFilePath)

      // Try DateTimeOriginal first (most accurate - when photo was taken)
      if (exifTags.DateTimeOriginal) {
        exifDate = exifTags.DateTimeOriginal instanceof Date ? exifTags.DateTimeOriginal : new Date(exifTags.DateTimeOriginal)
      }
      // Fall back to CreateDate
      else if (exifTags.CreateDate) {
        exifDate = exifTags.CreateDate instanceof Date ? exifTags.CreateDate : new Date(exifTags.CreateDate)
      }
      // Last resort: DateTime
      else if (exifTags.DateTime) {
        exifDate = exifTags.DateTime instanceof Date ? exifTags.DateTime : new Date(exifTags.DateTime)
      }

      // Extract orientation for rotation correction
      // EXIF Orientation values:
      // 1: Normal (0°)
      // 3: Rotated 180°
      // 6: Rotated 90° CW (phone held portrait, home button bottom)
      // 8: Rotated 270° CW (90° CCW)
      if (exifTags.Orientation) {
        exifOrientation = typeof exifTags.Orientation === 'number'
          ? exifTags.Orientation
          : parseInt(exifTags.Orientation, 10) || 1
      }

      console.log(`EXIF extraction successful: date=${exifDate?.toISOString() || 'No date found'}, orientation=${exifOrientation}`)
    } catch (error) {
      console.log('Could not extract EXIF data, will use defaults:', error)
    } finally {
      // Clean up temp file
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError)
      }
    }

    // Map EXIF orientation to rotation degrees
    // This explicit mapping handles cases where sharp's auto-rotate fails (e.g., HEIC)
    const orientationToRotation: Record<number, number> = {
      1: 0,    // Normal
      2: 0,    // Mirrored horizontal (flip handled separately if needed)
      3: 180,  // Rotated 180°
      4: 0,    // Mirrored vertical
      5: 270,  // Mirrored horizontal + 270° CW
      6: 90,   // Rotated 90° CW
      7: 90,   // Mirrored horizontal + 90° CW
      8: 270,  // Rotated 270° CW
    }
    const rotationDegrees = orientationToRotation[exifOrientation] || 0

    // Determine final date: prefer EXIF date, fall back to manual or current date
    let dateTaken: Date
    if (exifDate && !isNaN(exifDate.getTime())) {
      dateTaken = exifDate
    } else if (manualDateTaken) {
      // Fix timezone issue: interpret date string as local date, not UTC
      const [year, month, day] = manualDateTaken.split('-').map(Number)
      dateTaken = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid timezone edge cases
    } else {
      dateTaken = new Date()
    }

    // Generate unique filename (always use .jpeg since we convert)
    const timestamp = Date.now()
    const sanitizedPlantId = plant.plantId.replace(/[^a-zA-Z0-9-]/g, '_')
    const filename = `${sanitizedPlantId}_${timestamp}.jpeg`
    const thumbnailFilename = `${sanitizedPlantId}_${timestamp}_thumb.jpeg`

    // Build comprehensive metadata object using sharp + exiftool data
    let metadata: any = {}
    try {
      const imageMetadata = await sharp(buffer).metadata()

      metadata = {
        width: imageMetadata.width,
        height: imageMetadata.height,
        format: imageMetadata.format,
        space: imageMetadata.space,
        hasAlpha: imageMetadata.hasAlpha,
        orientation: exifOrientation,
        exif: exifTags ? {
          dateTimeOriginal: exifTags.DateTimeOriginal ?
            (exifTags.DateTimeOriginal instanceof Date ? exifTags.DateTimeOriginal.toISOString() : new Date(exifTags.DateTimeOriginal).toISOString())
            : null,
          make: exifTags.Make || null,
          model: exifTags.Model || null,
          software: exifTags.Software || null,
          lensModel: exifTags.LensModel || null,
          focalLength: exifTags.FocalLength || null,
          fNumber: exifTags.FNumber || null,
          iso: exifTags.ISO || null,
          exposureTime: exifTags.ExposureTime || null,
          flash: exifTags.Flash || null,
          gpsLatitude: exifTags.GPSLatitude || null,
          gpsLongitude: exifTags.GPSLongitude || null
        } : {}
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
    }

    // Process full-size image (max 2000px, maintain aspect ratio) to buffer
    const processedImageBuffer = await sharp(buffer)
      .rotate(rotationDegrees) // Explicit rotation based on EXIF orientation
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Process thumbnail (300px square crop) to buffer
    const thumbnailBuffer = await sharp(buffer)
      .rotate(rotationDegrees) // Explicit rotation based on EXIF orientation
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Upload to Supabase Storage
    // Path structure: {userId}/photos/{filename} and {userId}/thumbnails/{filename}
    const photoStoragePath = `${user.id}/photos/${filename}`
    const thumbStoragePath = `${user.id}/thumbnails/${thumbnailFilename}`

    const photoUploadResult = await uploadToStorage(processedImageBuffer, photoStoragePath, 'image/jpeg')
    if ('error' in photoUploadResult) {
      console.error('Failed to upload photo to Supabase:', photoUploadResult.error)
      return NextResponse.json(
        { error: 'Failed to upload photo to storage', details: photoUploadResult.error.message },
        { status: 500 }
      )
    }

    const thumbUploadResult = await uploadToStorage(thumbnailBuffer, thumbStoragePath, 'image/jpeg')
    if ('error' in thumbUploadResult) {
      // Clean up the photo we just uploaded
      await deleteFromStorage(photoStoragePath)
      console.error('Failed to upload thumbnail to Supabase:', thumbUploadResult.error)
      return NextResponse.json(
        { error: 'Failed to upload thumbnail to storage', details: thumbUploadResult.error.message },
        { status: 500 }
      )
    }

    // Save to database with Supabase Storage paths
    const photo = await prisma.photo.create({
      data: {
        plantId,
        userId: user.id,
        storagePath: photoStoragePath,
        thumbnailPath: thumbStoragePath,
        // Keep legacy fields null for new uploads
        url: null,
        thumbnailUrl: null,
        dateTaken,
        photoType,
        growthStage,
        notes,
        metadata
      }
    })

    return NextResponse.json({
      success: true,
      photo,
      exifDateUsed: exifDate !== null
    })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve photos for a plant
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const plantId = searchParams.get('plantId')

    if (!plantId) {
      return NextResponse.json({ error: 'Plant ID is required' }, { status: 400 })
    }

    const photos = await prisma.photo.findMany({
      where: { plantId },
      orderBy: { dateTaken: 'desc' }
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update photo details
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const photoId = searchParams.get('id')

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { photoType, growthStage, notes, dateTaken } = body

    // Validate photo exists
    const existingPhoto = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!existingPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Parse date if provided
    let parsedDate: Date | undefined
    if (dateTaken) {
      const [year, month, day] = dateTaken.split('-').map(Number)
      parsedDate = new Date(year, month - 1, day, 12, 0, 0)
    }

    // Update photo
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        photoType: photoType || undefined,
        growthStage: growthStage || null,
        notes: notes || null,
        dateTaken: parsedDate || undefined
      }
    })

    return NextResponse.json({ success: true, photo: updatedPhoto })
  } catch (error) {
    console.error('Error updating photo:', error)
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a photo
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const photoId = searchParams.get('id')

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Get photo to get storage paths before deleting from DB
    const photo = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from database first
    await prisma.photo.delete({ where: { id: photoId } })

    // Delete from Supabase Storage if paths exist
    if (photo.storagePath) {
      const photoDeleted = await deleteFromStorage(photo.storagePath)
      if (!photoDeleted) {
        console.warn(`Failed to delete photo from storage: ${photo.storagePath}`)
      }
    }
    if (photo.thumbnailPath) {
      const thumbDeleted = await deleteFromStorage(photo.thumbnailPath)
      if (!thumbDeleted) {
        console.warn(`Failed to delete thumbnail from storage: ${photo.thumbnailPath}`)
      }
    }

    return NextResponse.json({ success: true, message: 'Photo deleted' })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

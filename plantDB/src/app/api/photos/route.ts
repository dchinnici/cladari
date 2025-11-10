import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import prisma from '@/lib/prisma'
import { exiftool } from 'exiftool-vendored'

export async function POST(request: NextRequest) {
  try {
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

    // Verify plant exists
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

      console.log(`EXIF extraction successful: ${exifDate?.toISOString() || 'No date found'}`)
    } catch (error) {
      console.log('Could not extract EXIF date, will use manual date:', error)
    } finally {
      // Clean up temp file
      try {
        const fs = await import('fs/promises')
        await fs.unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError)
      }
    }

    // Determine final date: prefer EXIF date, fall back to manual or current date
    let dateTaken: Date
    if (exifDate && !isNaN(exifDate.getTime())) {
      dateTaken = exifDate
    } else if (manualDateTaken) {
      // Fix timezone issue: interpret date string as local date, not UTC
      // Split the date string and create Date with local timezone
      const [year, month, day] = manualDateTaken.split('-').map(Number)
      dateTaken = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid timezone edge cases
    } else {
      dateTaken = new Date()
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedPlantId = plant.plantId.replace(/[^a-zA-Z0-9-]/g, '_')
    const fileExt = file.name.split('.').pop() || 'jpg'
    const filename = `${sanitizedPlantId}_${timestamp}.${fileExt}`
    const thumbnailFilename = `${sanitizedPlantId}_${timestamp}_thumb.${fileExt}`

    // Define paths
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos')
    const thumbnailsDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails')
    const filePath = path.join(uploadsDir, filename)
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename)

    // Ensure directories exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true })
    }

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
        orientation: imageMetadata.orientation,
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

    // Process and save full-size image (max 2000px width, maintain aspect ratio)
    await sharp(buffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .rotate() // Auto-rotate based on EXIF orientation
      .jpeg({ quality: 90 })
      .toFile(filePath)

    // Create thumbnail (300px width)
    await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .rotate() // Auto-rotate based on EXIF orientation
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    // Save to database
    const photo = await prisma.photo.create({
      data: {
        plantId,
        url: `/uploads/photos/${filename}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        dateTaken: dateTaken, // Already a Date object
        photoType,
        growthStage,
        notes,
        metadata: JSON.stringify(metadata)
      }
    })

    return NextResponse.json({
      success: true,
      photo,
      exifDateUsed: exifDate !== null // Tell the client if EXIF date was used
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
    const searchParams = request.nextUrl.searchParams
    const photoId = searchParams.get('id')

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Get photo to get file paths before deleting from DB
    const photo = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from database
    await prisma.photo.delete({ where: { id: photoId } })

    // Optionally delete files from filesystem (commented out for safety - can be enabled later)
    // const fs = require('fs').promises
    // try {
    //   await fs.unlink(path.join(process.cwd(), 'public', photo.url))
    //   if (photo.thumbnailUrl) {
    //     await fs.unlink(path.join(process.cwd(), 'public', photo.thumbnailUrl))
    //   }
    // } catch (fileError) {
    //   console.error('Error deleting files:', fileError)
    // }

    return NextResponse.json({ success: true, message: 'Photo deleted' })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}


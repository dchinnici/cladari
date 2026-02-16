/**
 * Photo URL utilities with Supabase Image Transformations
 *
 * Supabase Pro provides on-the-fly image transformations via the /render/ endpoint.
 * This significantly reduces bandwidth by serving appropriately-sized images.
 *
 * URL patterns:
 * - Original: /storage/v1/object/public/{bucket}/{path}
 * - Transformed: /storage/v1/render/image/public/{bucket}/{path}?width=X&format=webp
 */

// Bucket name must match server.ts and Supabase Storage configuration
const STORAGE_BUCKET = 'cladari-photos'

export interface PhotoTransformOptions {
  /** Width in pixels (1-2500) */
  width?: number
  /** Height in pixels (1-2500) */
  height?: number
  /** Quality 20-100 (default 80) */
  quality?: number
  /** Resize mode */
  resize?: 'cover' | 'contain' | 'fill'
  // Note: Supabase automatically optimizes format based on Accept header
}

/** Preset sizes for common use cases */
export const PHOTO_SIZES = {
  /** Tiny thumbnail for lists (150px) */
  thumbnail: { width: 150, quality: 75 },
  /** Card preview (300px) */
  card: { width: 300, quality: 80 },
  /** Medium detail view (600px) */
  medium: { width: 600, quality: 85 },
  /** Large detail view (1200px) */
  large: { width: 1200, quality: 90 },
  /** Full size (no transformation) */
  full: undefined,
} as const

type PhotoInput = {
  storagePath?: string | null
  url?: string | null
}

/**
 * Get optimized photo URL with Supabase Image Transformations
 *
 * @param photo - Photo object with storagePath or legacy url
 * @param options - Transform options or preset name
 * @returns Optimized image URL
 *
 * @example
 * // Using preset
 * getPhotoUrl(photo, 'thumbnail')
 *
 * // Using custom options
 * getPhotoUrl(photo, { width: 400, format: 'webp' })
 *
 * // Full size (no transformation)
 * getPhotoUrl(photo, 'full')
 * getPhotoUrl(photo) // defaults to full
 */
export function getPhotoUrl(
  photo: PhotoInput,
  options?: keyof typeof PHOTO_SIZES | PhotoTransformOptions
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Resolve preset name to options
  const transformOptions = typeof options === 'string'
    ? PHOTO_SIZES[options]
    : options

  // Supabase Storage path
  if (photo.storagePath && supabaseUrl) {
    // If transformations requested, use Supabase Image Transformation /render/ endpoint
    if (transformOptions) {
      const params = new URLSearchParams()
      if (transformOptions.width) params.set('width', transformOptions.width.toString())
      if (transformOptions.height) params.set('height', transformOptions.height.toString())
      if (transformOptions.quality) params.set('quality', transformOptions.quality.toString())

      // Use 'contain' mode to preserve aspect ratio (no cropping)
      // Default is 'cover' which crops to fit exact dimensions
      params.set('resize', transformOptions.resize || 'contain')

      return `${supabaseUrl}/storage/v1/render/image/public/${STORAGE_BUCKET}/${photo.storagePath}?${params}`
    }

    // Full size - use object endpoint (no transformation)
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${photo.storagePath}`
  }

  // Legacy local URL - can't transform, return as-is
  return photo.url || ''
}

/**
 * Get thumbnail URL (convenience wrapper)
 */
export function getThumbnailUrl(photo: PhotoInput): string {
  return getPhotoUrl(photo, 'thumbnail')
}

/**
 * Get card-sized URL (convenience wrapper)
 */
export function getCardUrl(photo: PhotoInput): string {
  return getPhotoUrl(photo, 'card')
}

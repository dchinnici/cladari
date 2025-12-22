/**
 * Photo URL utilities with Supabase Image Transformations
 *
 * Supabase Pro provides on-the-fly image transformations via the /render/ endpoint.
 * This significantly reduces bandwidth by serving appropriately-sized images.
 *
 * URL patterns:
 * - Original: /storage/v1/object/public/photos/{path}
 * - Transformed: /storage/v1/render/image/public/photos/{path}?width=X&format=webp
 */

export interface PhotoTransformOptions {
  /** Width in pixels (1-2500) */
  width?: number
  /** Height in pixels (1-2500) */
  height?: number
  /** Quality 20-100 (default 80) */
  quality?: number
  /** Resize mode */
  resize?: 'cover' | 'contain' | 'fill'
  /** Output format */
  format?: 'webp' | 'jpeg' | 'png'
}

/** Preset sizes for common use cases */
export const PHOTO_SIZES = {
  /** Tiny thumbnail for lists (150px) */
  thumbnail: { width: 150, format: 'webp' as const, quality: 75 },
  /** Card preview (300px) */
  card: { width: 300, format: 'webp' as const, quality: 80 },
  /** Medium detail view (600px) */
  medium: { width: 600, format: 'webp' as const, quality: 85 },
  /** Large detail view (1200px) */
  large: { width: 1200, format: 'webp' as const, quality: 90 },
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

  // Supabase Storage path - use render endpoint for transformations
  if (photo.storagePath && supabaseUrl) {
    if (transformOptions) {
      // Use /render/ endpoint for transformed images
      const params = new URLSearchParams()
      if (transformOptions.width) params.set('width', String(transformOptions.width))
      if (transformOptions.height) params.set('height', String(transformOptions.height))
      if (transformOptions.quality) params.set('quality', String(transformOptions.quality))
      if (transformOptions.resize) params.set('resize', transformOptions.resize)
      if (transformOptions.format) params.set('format', transformOptions.format)

      return `${supabaseUrl}/storage/v1/render/image/public/photos/${photo.storagePath}?${params.toString()}`
    }
    // No transformation - use object endpoint
    return `${supabaseUrl}/storage/v1/object/public/photos/${photo.storagePath}`
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

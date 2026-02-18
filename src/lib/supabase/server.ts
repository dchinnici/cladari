import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for server-side operations (API routes, server components)
 * Uses cookies for auth session management
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the authenticated user or return null.
 * Supports admin "View As" — when an admin has the cladari-view-as cookie set,
 * returns a synthetic user with the target's ID so all queries return their data.
 */
export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Admin View-As: check for impersonation cookie
  const cookieStore = await cookies()
  const viewAsUserId = cookieStore.get('cladari-view-as')?.value

  if (viewAsUserId && viewAsUserId !== user.id) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return user // Non-admin — ignore cookie silently
    }

    const prisma = (await import('@/lib/prisma')).default
    const targetProfile = await prisma.profile.findUnique({
      where: { id: viewAsUserId },
      select: { id: true, email: true, displayName: true },
    })

    if (!targetProfile) {
      return user // Target doesn't exist — ignore cookie
    }

    return {
      ...user,
      id: targetProfile.id,
      email: targetProfile.email,
      user_metadata: {
        ...user.user_metadata,
        _viewAsAdmin: user.email,
        _viewAsTarget: targetProfile.email,
        _viewAsTargetName: targetProfile.displayName,
      },
    }
  }

  return user
}

/**
 * Check if the real authenticated user (ignoring view-as) is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(user.email.toLowerCase())
}

/**
 * Get the authenticated user or throw an error (for protected routes)
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Create a Supabase admin client with service role (bypasses RLS)
 * Use only for server-side operations like migrations, admin tasks
 */
export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Get signed URL for Supabase Storage
 * @param storagePath - Path within the bucket (e.g., "userId/photos/filename.jpg")
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 */
export async function getSignedPhotoUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'cladari-photos')
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }

  return data.signedUrl
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  file: Buffer,
  storagePath: string,
  contentType: string
): Promise<{ path: string } | { error: Error }> {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'cladari-photos')
    .upload(storagePath, file, {
      contentType,
      upsert: false
    })

  if (error) {
    return { error: new Error(error.message) }
  }

  return { path: data.path }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromStorage(storagePath: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'cladari-photos')
    .remove([storagePath])

  if (error) {
    console.error('Failed to delete from storage:', error)
    return false
  }

  return true
}

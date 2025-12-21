import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for client-side (browser) operations
 * Uses cookies for auth session management
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

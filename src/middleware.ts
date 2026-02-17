import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Define protected paths
  const protectedPaths = [
    '/plants',
    '/dashboard',
    '/breeding',
    '/batches',
    '/locations',
    '/batch-care',
    '/genetics'
  ]

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Check if API route (except public endpoints)
  const isProtectedApi = request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/api/auth/') &&
    !request.nextUrl.pathname.startsWith('/api/sensorpush/sync') && // Cron job endpoint
    !request.nextUrl.pathname.startsWith('/api/contact') // Public contact form

  // Redirect to login if accessing protected route without auth
  if ((isProtectedPath || isProtectedApi) && !user) {
    // For API routes, return 401
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await request.json()
  const cookieStore = await cookies()

  if (userId) {
    cookieStore.set('cladari-view-as', userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 hours
    })
  } else {
    cookieStore.delete('cladari-view-as')
  }

  return NextResponse.json({ ok: true })
}

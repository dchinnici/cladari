'use client'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { LogOut, User, ChevronDown, Eye } from 'lucide-react'

export default function UserMenu() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [viewingAs, setViewingAs] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0]
        })
      }
      setLoading(false)
    })

    // Check admin status
    fetch('/api/admin/users')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setIsAdminUser(true)
          setAdminUsers(data)
        }
      })
      .catch(() => {})

    // Check if viewing as someone
    const match = document.cookie.match(/cladari-view-as=([^;]+)/)
    if (match) setViewingAs(match[1])

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleViewAs(userId: string | null) {
    await fetch('/api/admin/view-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    window.location.reload()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="px-3 py-1.5 text-sm font-medium text-[var(--forest)] hover:bg-black/[0.04] rounded transition-colors"
      >
        Sign In
      </a>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/[0.04] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[var(--forest)] text-white flex items-center justify-center text-xs font-medium">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-[var(--bark)] hidden lg:block max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-black/[0.08] py-1 z-50">
          <div className="px-4 py-2 border-b border-black/[0.08]">
            <p className="text-sm font-medium text-[var(--bark)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--clay)] truncate">{user.email}</p>
          </div>

          {isAdminUser && (
            <div className="border-t border-black/[0.08]">
              <p className="px-4 py-1.5 text-[10px] font-semibold text-[var(--clay)] uppercase tracking-wider">
                Admin
              </p>
              {viewingAs ? (
                <button
                  onClick={() => handleViewAs(null)}
                  className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Exit View As
                </button>
              ) : (
                adminUsers
                  .filter(u => u.email !== user?.email)
                  .map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleViewAs(u.id)}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--bark)] hover:bg-black/[0.04] flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-[var(--clay)]" />
                      <span className="truncate">{u.displayName || u.email}</span>
                      <span className="text-[10px] text-[var(--clay)] ml-auto">{u._count.plants}p</span>
                    </button>
                  ))
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// Compact version for mobile
export function UserMenuMobile() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ email: user.email })
    })
  }, [supabase.auth])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) return null

  return (
    <button
      onClick={handleLogout}
      className="flex flex-col items-center justify-center text-[var(--clay)] active:text-red-500"
    >
      <LogOut className="w-5 h-5" />
      <span className="text-[10px] mt-0.5">Logout</span>
    </button>
  )
}

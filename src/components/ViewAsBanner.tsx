'use client'

import { useState, useEffect } from 'react'
import { Eye, X } from 'lucide-react'

export default function ViewAsBanner() {
  const [viewAsEmail, setViewAsEmail] = useState<string | null>(null)

  useEffect(() => {
    const match = document.cookie.match(/cladari-view-as=([^;]+)/)
    if (!match) return

    fetch('/api/admin/users')
      .then(r => r.ok ? r.json() : null)
      .then(users => {
        if (users) {
          const target = users.find((u: any) => u.id === match[1])
          if (target) setViewAsEmail(target.displayName || target.email)
        }
      })
      .catch(() => {})
  }, [])

  if (!viewAsEmail) return null

  async function exitViewAs() {
    await fetch('/api/admin/view-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null }),
    })
    window.location.reload()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-1.5 flex items-center justify-center gap-3 text-sm font-medium shadow-md">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>Viewing as: {viewAsEmail}</span>
      <button
        onClick={exitViewAs}
        className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs flex items-center gap-1 transition-colors"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  )
}

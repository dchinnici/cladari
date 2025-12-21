'use client'

import { useState, useEffect, useRef } from 'react'
import { BookOpen, Plus, X, Clock, ChevronRight } from 'lucide-react'
import { showToast } from '../toast'

interface JournalEntry {
  id: string
  timestamp: string
  entry: string
  entryType: string
  context?: string
  author?: string
}

interface JournalIconProps {
  plantId: string
  plantName?: string
  context?: string
  className?: string
  onOpenFull?: () => void
}

export default function JournalIcon({
  plantId,
  plantName = 'Plant',
  context = 'unknown',
  className = '',
  onOpenFull
}: JournalIconProps) {
  const [mode, setMode] = useState<'icon' | 'quick-add' | 'preview'>('icon')
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch recent entries
  useEffect(() => {
    if (mode === 'preview') {
      fetchRecentEntries()
    }
  }, [mode, plantId])

  // Auto-focus input when opening quick-add
  useEffect(() => {
    if (mode === 'quick-add' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMode('icon')
      }
    }

    if (mode !== 'icon') {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mode])

  const fetchRecentEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/plants/${plantId}/journal?limit=3`)
      const data = await response.json()
      setRecentEntries(data.entries || [])
    } catch (error) {
      console.error('Failed to fetch journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEntry = async () => {
    if (!newEntry.trim()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/plants/${plantId}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: newEntry,
          context,
          entryType: 'manual'
        })
      })

      if (response.ok) {
        showToast({ type: 'success', title: 'Journal entry added' })
        setNewEntry('')
        setMode('icon')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to save journal entry' })
    } finally {
      setSaving(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'care': return '💧'
      case 'measurement': return '📏'
      case 'trait': return '🌿'
      case 'photo': return '📸'
      case 'breeding': return '🧬'
      default: return '📝'
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Icon Mode */}
      {mode === 'icon' && (
        <button
          onClick={() => setMode('preview')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
          title={`${plantName} Journal`}
        >
          <BookOpen className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2
                         bg-gray-900 text-white text-xs px-2 py-1 rounded
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Journal
          </span>
        </button>
      )}

      {/* Preview Mode */}
      {mode === 'preview' && (
        <div className="absolute top-0 right-0 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-sm">Journal</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMode('quick-add')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Add entry"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMode('icon')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
            ) : recentEntries.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentEntries.map(entry => (
                  <div key={entry.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">{getEntryIcon(entry.entryType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.context && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                              {entry.context.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{entry.entry}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No journal entries yet
              </div>
            )}
          </div>

          {/* View All Button */}
          {onOpenFull && (
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={onOpenFull}
                className="w-full px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50
                         rounded flex items-center justify-center gap-1"
              >
                View all entries
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Mode */}
      {mode === 'quick-add' && (
        <div className="absolute top-0 right-0 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-sm">Add Journal Entry</span>
              </div>
              <button
                onClick={() => setMode('preview')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3">
            <textarea
              ref={inputRef}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="What's happening with this plant?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSaveEntry()
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {context && `From: ${context.replace('_', ' ')}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setNewEntry('')
                    setMode('preview')
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={!newEntry.trim() || saving}
                  className="px-3 py-1 text-sm bg-emerald-500 text-white rounded
                           hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Tip: Press Cmd+Enter to save
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, BookOpen, Loader2, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchResult {
  id: string
  chunkType: string
  content: string
  summary: string | null
  similarity: number
  qualityWeightedScore: number
  chatLogId: string
  chatLogTitle: string | null
  conversationDate: string
  plantId: string        // internal UUID
  plantDisplayId: string // ANT-2025-0001 format
  plantName: string | null
}

const CHUNK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  damage_analysis: { label: 'Damage', color: 'bg-red-100 text-red-700' },
  care_analysis: { label: 'Care', color: 'bg-emerald-100 text-emerald-700' },
  environmental: { label: 'Environment', color: 'bg-sky-100 text-sky-700' },
  recommendation: { label: 'Recommendation', color: 'bg-violet-100 text-violet-700' },
  observation: { label: 'Observation', color: 'bg-amber-100 text-amber-700' },
  diagnosis: { label: 'Diagnosis', color: 'bg-rose-100 text-rose-700' },
  breeding: { label: 'Breeding', color: 'bg-pink-100 text-pink-700' },
  history: { label: 'History', color: 'bg-gray-100 text-gray-700' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-700' },
}

export default function KnowledgeSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/ml/semantic-search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      if (!res.ok) {
        throw new Error('Search failed')
      }
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search knowledge base')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-search when query changes (debounced)
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
  }

  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery)
    }
  }, [debouncedQuery, search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search(query)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
    setError(null)
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).trim() + '...'
  }

  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-[var(--moss)]" />
        <h2 className="text-sm font-medium text-[var(--bark)]">Knowledge Search</h2>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--clay)]" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search past consultations..."
          className="w-full pl-9 pr-9 py-2 text-sm border border-black/[0.08] rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]
                     placeholder:text-[var(--clay)]/60"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--clay)] hover:text-[var(--bark)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--moss)]" />
          <span className="ml-2 text-sm text-[var(--clay)]">Searching...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && hasSearched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[var(--clay)]">No matching consultations found</p>
              <p className="text-xs text-[var(--clay)]/60 mt-1">Try different keywords or phrases</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--clay)]">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result) => {
                const chunkInfo = CHUNK_TYPE_LABELS[result.chunkType] || CHUNK_TYPE_LABELS.general
                const similarity = Math.round(result.similarity * 100)

                return (
                  <Link
                    key={result.id}
                    href={`/plants/${result.plantId}?tab=journal`}
                    className="block p-3 rounded-lg border border-black/[0.04] hover:border-[var(--moss)]/30
                               hover:bg-[var(--bg-primary)] transition-colors group"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[var(--forest)]">
                          {result.plantDisplayId}
                        </span>
                        {result.plantName && (
                          <span className="text-xs text-[var(--clay)]">
                            {result.plantName}
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${chunkInfo.color}`}>
                          {chunkInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--clay)]">
                          {similarity}% match
                        </span>
                        <ExternalLink className="w-3 h-3 text-[var(--clay)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-[var(--bark)] leading-relaxed">
                      {truncateContent(result.summary || result.content)}
                    </p>

                    {/* Footer */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-[var(--clay)]">
                      <span>{new Date(result.conversationDate).toLocaleDateString()}</span>
                      {result.chatLogTitle && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{result.chatLogTitle}</span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasSearched && (
        <div className="py-6 text-center">
          <Search className="w-8 h-8 text-[var(--clay)]/30 mx-auto mb-2" />
          <p className="text-sm text-[var(--clay)]">Search your AI consultation history</p>
          <p className="text-xs text-[var(--clay)]/60 mt-1">
            Find past damage analyses, care recommendations, and more
          </p>
        </div>
      )}
    </div>
  )
}

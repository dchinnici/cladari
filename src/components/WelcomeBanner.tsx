'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Leaf, MapPin, Camera, FlaskConical, X, BookOpen } from 'lucide-react'

export default function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-white border border-[var(--forest)]/20 rounded-xl p-6 mb-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-[var(--clay)] hover:text-[var(--bark)] transition-colors"
        aria-label="Dismiss welcome message"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--forest)]">
          Welcome to the Cladari Private Beta
        </h2>
        <p className="text-sm text-[var(--clay)] mt-1">
          Thanks for being one of the first to try Cladari. This is a breeding intelligence
          platform built in South Florida for serious growers and breeders. Some features are
          still being generalized from single-user mode — you may encounter rough edges.
          Your feedback helps shape what this becomes.
        </p>
      </div>

      <div className="border-t border-black/[0.06] pt-4 mb-4">
        <p className="text-sm font-medium text-[var(--bark)] mb-3">Get started</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/locations"
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--parchment)] transition-colors"
          >
            <MapPin className="w-4 h-4 text-[var(--moss)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--bark)]">Create a location</p>
              <p className="text-xs text-[var(--clay)]">Where your plants live (shelf, greenhouse, etc.)</p>
            </div>
          </Link>

          <Link
            href="/plants"
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--parchment)] transition-colors"
          >
            <Leaf className="w-4 h-4 text-[var(--moss)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--bark)]">Add your first plant</p>
              <p className="text-xs text-[var(--clay)]">Name, species, source, acquisition date</p>
            </div>
          </Link>

          <Link
            href="/plants"
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--parchment)] transition-colors"
          >
            <Camera className="w-4 h-4 text-[var(--moss)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--bark)]">Upload photos</p>
              <p className="text-xs text-[var(--clay)]">Document your collection over time</p>
            </div>
          </Link>

          <Link
            href="/breeding"
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--parchment)] transition-colors"
          >
            <FlaskConical className="w-4 h-4 text-[var(--moss)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--bark)]">Track a cross</p>
              <p className="text-xs text-[var(--clay)]">Full breeding pipeline from pollination to accession</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--clay)]">
        <BookOpen className="w-3.5 h-3.5" />
        <span>
          Questions? Ask Dave for the operator manual — it covers every feature in detail.
        </span>
      </div>
    </div>
  )
}

import { Dna } from 'lucide-react'
import Link from 'next/link'

// TODO: Wire this page to the Genetics model (raNumber, provenance, breedingValue)
// Currently a placeholder — genetics data lives on individual plant records (Lineage tab)
export default function GeneticsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--forest)]">Genetics</h1>
          <p className="text-sm text-[var(--clay)]">Collection-wide genetic analysis and lineage tracking</p>
        </div>

        <div className="text-center py-16">
          <Dna className="w-14 h-14 text-[var(--clay)] mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[var(--bark)] mb-2">Coming Soon</h2>
          <p className="text-sm text-[var(--clay)] max-w-md mx-auto mb-6">
            Collection-wide genetic analysis is in development. In the meantime,
            breeding genetics, lineage, and progeny data are available on individual
            plant records that have been bred.
          </p>
          <Link
            href="/breeding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--forest)] text-white text-sm rounded hover:opacity-90 transition-opacity"
          >
            <Dna className="w-4 h-4" />
            View Breeding Records
          </Link>
        </div>
      </div>
    </div>
  )
}

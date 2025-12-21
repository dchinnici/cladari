'use client'

import { useEffect, useState } from 'react'
import { Dna, TrendingUp, BarChart3, Search } from 'lucide-react'

export default function GeneticsPage() {
  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPlants()
  }, [])

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants')
      if (response.ok) {
        const data = await response.json()
        setPlants(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching plants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract genetic lineages (RA codes) from plant names
  const getGeneticCode = (plant: any) => {
    const name = plant.name || ''
    const match = name.match(/RA-?\d+/i)
    return match ? match[0].toUpperCase() : null
  }

  // Group plants by genetic lineage
  const lineageGroups = plants.reduce((acc: any, plant) => {
    const code = getGeneticCode(plant)
    if (code) {
      if (!acc[code]) {
        acc[code] = []
      }
      acc[code].push(plant)
    }
    return acc
  }, {})

  const lineages = Object.entries(lineageGroups)
    .map(([code, plants]: [string, any]) => ({
      code,
      count: plants.length,
      plants
    }))
    .sort((a, b) => b.count - a.count)

  // Filter lineages by search
  const filteredLineages = searchTerm
    ? lineages.filter(l =>
        l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.plants.some((p: any) =>
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.species || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : lineages

  // Calculate stats
  const totalWithLineage = Object.values(lineageGroups).flat().length
  const uniqueLineages = lineages.length
  const topLineage = lineages[0]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading genetics data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--forest)]">Genetics</h1>
          <p className="text-sm text-[var(--clay)]">Analyze lineages and genetic traits</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="w-4 h-4 text-[var(--moss)]" />
              <span className="text-xs text-[var(--clay)]">Unique Lineages</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{uniqueLineages}</p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[var(--water-blue)]" />
              <span className="text-xs text-[var(--clay)]">Tagged Plants</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{totalWithLineage}</p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <p className="text-xs text-[var(--clay)] mb-2">Total Plants</p>
            <p className="text-3xl font-semibold text-[var(--bark)]">{plants.length}</p>
          </div>
          {topLineage && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--spadix-yellow)]" />
                <span className="text-xs text-[var(--clay)]">Top Lineage</span>
              </div>
              <p className="text-2xl font-bold text-[var(--forest)]">{topLineage.code}</p>
              <p className="text-xs text-[var(--clay)]">{topLineage.count} plants</p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--clay)]" />
            <input
              type="text"
              placeholder="Search lineages or plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black/[0.08] rounded text-sm focus:outline-none focus:border-[var(--moss)]"
            />
          </div>
        </div>

        {/* Lineage Distribution */}
        {filteredLineages.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-[var(--bark)]">Lineage Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLineages.map((lineage) => (
                <div key={lineage.code} className="bg-white border border-black/[0.08] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--forest)]">{lineage.code}</h3>
                      <p className="text-xs text-[var(--clay)]">{lineage.count} plant{lineage.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-[var(--parchment)] flex items-center justify-center">
                      <Dna className="w-6 h-6 text-[var(--moss)]" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="w-full h-2 bg-[var(--parchment)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--moss)]"
                        style={{ width: `${(lineage.count / (topLineage?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Plant list preview */}
                  <div className="space-y-1">
                    {lineage.plants.slice(0, 3).map((plant: any) => (
                      <div key={plant.id} className="flex justify-between text-xs">
                        <span className="text-[var(--bark)] truncate">{plant.name || plant.plantId}</span>
                        <span className="text-[var(--clay)] font-mono">{plant.plantId}</span>
                      </div>
                    ))}
                    {lineage.count > 3 && (
                      <p className="text-xs text-[var(--clay)] pt-1">
                        +{lineage.count - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Dna className="w-12 h-12 text-[var(--clay)] mx-auto mb-3" />
            {searchTerm ? (
              <>
                <p className="text-[var(--bark)] mb-1">No matching lineages</p>
                <p className="text-sm text-[var(--clay)]">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-[var(--bark)] mb-1">No genetic lineages detected</p>
                <p className="text-sm text-[var(--clay)]">
                  Add RA codes to plant names to track lineages
                </p>
                <p className="text-xs text-[var(--clay)] mt-2">
                  Example: "Anthurium RA-42 Clone"
                </p>
              </>
            )}
          </div>
        )}

        {/* Plants without lineage */}
        {plants.length > 0 && totalWithLineage < plants.length && (
          <div className="mt-6 bg-white border border-black/[0.08] rounded-lg p-4">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-2">Untagged Plants</h2>
            <p className="text-xs text-[var(--clay)] mb-3">
              {plants.length - totalWithLineage} plant{plants.length - totalWithLineage !== 1 ? 's' : ''} without RA lineage codes
            </p>
            <div className="flex flex-wrap gap-2">
              {plants
                .filter(p => !getGeneticCode(p))
                .slice(0, 10)
                .map((plant) => (
                  <span
                    key={plant.id}
                    className="text-xs px-2 py-1 bg-[var(--parchment)] text-[var(--bark)] rounded"
                  >
                    {plant.plantId}
                  </span>
                ))}
              {plants.filter(p => !getGeneticCode(p)).length > 10 && (
                <span className="text-xs px-2 py-1 text-[var(--clay)]">
                  +{plants.filter(p => !getGeneticCode(p)).length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

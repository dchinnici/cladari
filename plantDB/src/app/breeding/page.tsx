'use client'

import { useEffect, useState } from 'react'
import {
  Heart, Plus, ChevronRight, Sprout, Leaf,
  FlaskConical, TreeDeciduous, Calendar, Target,
  ChevronDown, X, Droplets, Trash2, MoreVertical
} from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'

interface Plant {
  id: string
  plantId: string
  hybridName: string | null
  species: string | null
  section: string | null
}

interface Seedling {
  id: string
  seedlingId: string
  selectionStatus: string
  healthStatus: string
  emergenceDate: string
  leafCount: number | null
  graduatedToPlant?: { plantId: string } | null
}

interface SeedBatch {
  id: string
  batchId: string
  status: string
  seedCount: number
  germinatedCount: number | null
  substrate: string
  sowDate: string
  seedlings: Seedling[]
  _count: { seedlings: number }
}

interface Harvest {
  id: string
  harvestNumber: number
  harvestDate: string
  seedCount: number
  seedViability: string | null
  seedBatches: SeedBatch[]
}

interface BreedingRecord {
  id: string
  crossId: string
  crossDate: string
  crossType: string
  crossCategory: string | null
  pollinationMethod: string | null
  targetTraits: string | null
  notes: string | null
  femalePlant: Plant
  malePlant: Plant
  harvests: Harvest[]
  offspring: { id: string; plantId: string; hybridName: string | null }[]
  summary: {
    totalHarvests: number
    totalSeeds: number
    totalSeedlings: number
    totalGraduated: number
  }
}

// Helper to get display name for a plant
function getPlantDisplayName(plant: Plant | null): string {
  if (!plant) return 'Unknown'
  const name = plant.hybridName || plant.species || 'Unknown'
  return `${name} (${plant.plantId})`
}

function getPlantShortName(plant: Plant | null): string {
  if (!plant) return 'Unknown'
  return plant.hybridName || plant.species || plant.plantId
}

// Category badge colors
function getCategoryColor(category: string | null): string {
  switch (category) {
    case 'INTERSECTIONAL': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'INTERSPECIFIC': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'INTRASPECIFIC': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

// Status colors for seedlings
function getSelectionColor(status: string): string {
  switch (status) {
    case 'KEEPER': return 'bg-emerald-100 text-emerald-700'
    case 'HOLDBACK': return 'bg-amber-100 text-amber-700'
    case 'GROWING': return 'bg-sky-100 text-sky-700'
    case 'CULLED': return 'bg-gray-100 text-gray-500'
    case 'DIED': return 'bg-red-100 text-red-600'
    case 'GRADUATED': return 'bg-violet-100 text-violet-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getBatchStatusColor(status: string): string {
  switch (status) {
    case 'SOWN': return 'bg-amber-50 text-amber-600 border-amber-200'
    case 'GERMINATING': return 'bg-lime-50 text-lime-600 border-lime-200'
    case 'PRICKING_OUT': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    case 'SELECTING': return 'bg-sky-50 text-sky-600 border-sky-200'
    case 'COMPLETE': return 'bg-violet-50 text-violet-600 border-violet-200'
    case 'FAILED': return 'bg-red-50 text-red-600 border-red-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

export default function BreedingPage() {
  const [crosses, setCrosses] = useState<BreedingRecord[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedCross, setExpandedCross] = useState<string | null>(null)

  // Form state
  const [crossForm, setCrossForm] = useState({
    femalePlantId: '',
    malePlantId: '',
    crossDate: new Date().toISOString().split('T')[0],
    crossType: 'CONTROLLED',
    crossCategory: '',
    pollinationMethod: 'fresh',
    targetTraits: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [crossesRes, plantsRes] = await Promise.all([
        fetch('/api/breeding'),
        fetch('/api/plants')
      ])

      if (crossesRes.ok) {
        const data = await crossesRes.json()
        setCrosses(Array.isArray(data) ? data : [])
      }

      if (plantsRes.ok) {
        const data = await plantsRes.json()
        setPlants(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCross = async () => {
    if (!crossForm.femalePlantId || !crossForm.malePlantId) {
      showToast({ type: 'error', title: 'Select both parents' })
      return
    }

    try {
      const payload = {
        femalePlantId: crossForm.femalePlantId,
        malePlantId: crossForm.malePlantId,
        crossDate: crossForm.crossDate,
        crossType: crossForm.crossType,
        crossCategory: crossForm.crossCategory || null,
        pollinationMethod: crossForm.pollinationMethod || null,
        targetTraits: crossForm.targetTraits
          ? crossForm.targetTraits.split(',').map(t => t.trim()).filter(Boolean)
          : null,
        notes: crossForm.notes || null
      }

      const response = await fetch('/api/breeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const newCross = await response.json()
        await fetchData()
        setModalOpen(false)
        resetForm()
        showToast({
          type: 'success',
          title: `Cross ${newCross.crossId} created`
        })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to create cross' })
      }
    } catch (error) {
      console.error('Error saving cross:', error)
      showToast({ type: 'error', title: 'Error creating cross' })
    }
  }

  const resetForm = () => {
    setCrossForm({
      femalePlantId: '',
      malePlantId: '',
      crossDate: new Date().toISOString().split('T')[0],
      crossType: 'CONTROLLED',
      crossCategory: '',
      pollinationMethod: 'fresh',
      targetTraits: '',
      notes: ''
    })
  }

  const handleDeleteCross = async (cross: BreedingRecord, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding the card

    if (cross.summary.totalHarvests > 0 || cross.offspring.length > 0) {
      showToast({
        type: 'error',
        title: 'Cannot delete cross with harvests or graduated plants'
      })
      return
    }

    if (!confirm(`Delete ${cross.crossId}? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/breeding/${cross.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        showToast({ type: 'success', title: `${cross.crossId} deleted` })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to delete' })
      }
    } catch (error) {
      console.error('Error deleting cross:', error)
      showToast({ type: 'error', title: 'Error deleting cross' })
    }
  }

  // Auto-detect cross category based on parent sections
  const detectCrossCategory = (femaleId: string, maleId: string): string => {
    const female = plants.find(p => p.id === femaleId)
    const male = plants.find(p => p.id === maleId)

    if (!female?.section || !male?.section) return ''
    if (female.section === male.section) return 'INTRASPECIFIC'

    // Different sections = intersectional
    return 'INTERSECTIONAL'
  }

  const handleParentChange = (field: 'femalePlantId' | 'malePlantId', value: string) => {
    const newForm = { ...crossForm, [field]: value }

    // Auto-detect category
    if (newForm.femalePlantId && newForm.malePlantId) {
      const detected = detectCrossCategory(newForm.femalePlantId, newForm.malePlantId)
      if (detected && !crossForm.crossCategory) {
        newForm.crossCategory = detected
      }
    }

    setCrossForm(newForm)
  }

  // Stats
  const totalSeeds = crosses.reduce((sum, c) => sum + c.summary.totalSeeds, 0)
  const totalSeedlings = crosses.reduce((sum, c) => sum + c.summary.totalSeedlings, 0)
  const totalGraduated = crosses.reduce((sum, c) => sum + c.summary.totalGraduated, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--clay)]">Loading breeding data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--forest)]">Breeding Program</h1>
            <p className="text-sm text-[var(--clay)]">
              Track crosses from pollination to graduated plants
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--forest)] text-white text-sm rounded-lg hover:bg-[var(--forest)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Cross
          </button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-black/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Crosses</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{crosses.length}</p>
          </div>
          <div className="bg-white border border-black/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Seeds</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{totalSeeds}</p>
          </div>
          <div className="bg-white border border-black/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="w-4 h-4 text-lime-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Seedlings</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{totalSeedlings}</p>
          </div>
          <div className="bg-white border border-black/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TreeDeciduous className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Graduated</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{totalGraduated}</p>
          </div>
        </div>

        {/* Crosses List */}
        {crosses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-black/[0.06] rounded-xl">
            <Heart className="w-12 h-12 text-[var(--clay)]/40 mx-auto mb-4" />
            <p className="text-[var(--bark)] mb-2">No crosses recorded yet</p>
            <p className="text-sm text-[var(--clay)] mb-6">Start your breeding program by documenting your first cross</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-[var(--forest)] text-white text-sm rounded-lg"
            >
              Record First Cross
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {crosses.map((cross) => (
              <div
                key={cross.id}
                className="bg-white border border-black/[0.06] rounded-xl overflow-hidden"
              >
                {/* Cross Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-black/[0.01] transition-colors"
                  onClick={() => setExpandedCross(expandedCross === cross.id ? null : cross.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Cross ID and Category */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-medium text-[var(--forest)]">
                          {cross.crossId}
                        </span>
                        {cross.crossCategory && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColor(cross.crossCategory)}`}>
                            {cross.crossCategory}
                          </span>
                        )}
                      </div>

                      {/* Parents */}
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <span className="text-[var(--bark)] font-medium">
                          {getPlantShortName(cross.femalePlant)}
                        </span>
                        <span className="text-[var(--clay)]">×</span>
                        <span className="text-[var(--bark)] font-medium">
                          {getPlantShortName(cross.malePlant)}
                        </span>
                      </div>

                      {/* Pipeline mini-stats */}
                      <div className="flex items-center gap-4 text-xs text-[var(--clay)]">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {cross.summary.totalHarvests} harvest{cross.summary.totalHarvests !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FlaskConical className="w-3 h-3" />
                          {cross.summary.totalSeeds} seeds
                        </span>
                        <span className="flex items-center gap-1">
                          <Sprout className="w-3 h-3" />
                          {cross.summary.totalSeedlings} seedlings
                        </span>
                        {cross.summary.totalGraduated > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <TreeDeciduous className="w-3 h-3" />
                            {cross.summary.totalGraduated} graduated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-xs text-[var(--clay)]">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(cross.crossDate).toLocaleDateString()}
                      </div>
                      {/* Delete button - only show if no harvests/offspring */}
                      {cross.summary.totalHarvests === 0 && cross.offspring.length === 0 && (
                        <button
                          onClick={(e) => handleDeleteCross(cross, e)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Delete cross"
                        >
                          <Trash2 className="w-4 h-4 text-[var(--clay)] group-hover:text-red-500" />
                        </button>
                      )}
                      <ChevronDown
                        className={`w-5 h-5 text-[var(--clay)] transition-transform ${
                          expandedCross === cross.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Pipeline View */}
                {expandedCross === cross.id && (
                  <div className="border-t border-black/[0.04] bg-[var(--bg-primary)]/50">
                    {/* Target Traits */}
                    {cross.targetTraits && (
                      <div className="px-4 py-3 border-b border-black/[0.04]">
                        <div className="flex items-center gap-2 text-xs text-[var(--clay)] mb-2">
                          <Target className="w-3 h-3" />
                          <span>Target Traits</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(cross.targetTraits).map((trait: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-[var(--moss)]/10 text-[var(--moss)] rounded-full"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Harvests */}
                    {cross.harvests.length > 0 ? (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-medium text-[var(--bark)] uppercase tracking-wide">
                            Harvests & Seed Batches
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              showToast({ type: 'info', title: 'Add Harvest coming soon' })
                            }}
                            className="text-xs text-[var(--moss)] hover:text-[var(--forest)] flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Harvest
                          </button>
                        </div>
                        <div className="space-y-3">
                          {cross.harvests.map((harvest) => (
                            <div key={harvest.id} className="bg-white rounded-lg border border-black/[0.06] p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-[var(--forest)]">
                                    Harvest #{harvest.harvestNumber}
                                  </span>
                                  <span className="text-xs text-[var(--clay)]">
                                    {new Date(harvest.harvestDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                  {harvest.seedCount} seeds
                                </span>
                              </div>

                              {/* Seed Batches */}
                              {harvest.seedBatches.length > 0 ? (
                                <div className="mt-3 space-y-2">
                                  {harvest.seedBatches.map((batch) => (
                                    <div
                                      key={batch.id}
                                      className="bg-[var(--bg-primary)] rounded-lg p-3"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-xs text-[var(--bark)]">
                                            {batch.batchId}
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getBatchStatusColor(batch.status)}`}>
                                            {batch.status.replace('_', ' ')}
                                          </span>
                                        </div>
                                        <span className="text-xs text-[var(--clay)]">
                                          {batch._count.seedlings} seedlings
                                        </span>
                                      </div>

                                      <div className="text-xs text-[var(--clay)] mb-2">
                                        {batch.substrate}
                                      </div>

                                      {/* Seedlings */}
                                      {batch.seedlings && batch.seedlings.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-black/[0.04]">
                                          {batch.seedlings.slice(0, 10).map((seedling) => (
                                            <span
                                              key={seedling.id}
                                              className={`text-[10px] px-1.5 py-0.5 rounded ${getSelectionColor(seedling.selectionStatus)}`}
                                              title={`${seedling.seedlingId} - ${seedling.selectionStatus}`}
                                            >
                                              {seedling.seedlingId.split('-').pop()}
                                            </span>
                                          ))}
                                          {batch.seedlings.length > 10 && (
                                            <span className="text-[10px] text-[var(--clay)]">
                                              +{batch.seedlings.length - 10} more
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-[var(--clay)] italic mt-2">
                                  No seed batches yet. Create one when you sow these seeds.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-[var(--clay)] mb-3">No harvests yet. Record one when berries ripen.</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            showToast({ type: 'info', title: 'Add Harvest coming soon' })
                          }}
                          className="text-xs px-3 py-1.5 bg-[var(--moss)]/10 text-[var(--moss)] rounded-lg hover:bg-[var(--moss)]/20 transition-colors"
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          Add First Harvest
                        </button>
                      </div>
                    )}

                    {/* Graduated Offspring */}
                    {cross.offspring.length > 0 && (
                      <div className="px-4 pb-4">
                        <h4 className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">
                          Graduated Plants
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cross.offspring.map((plant) => (
                            <a
                              key={plant.id}
                              href={`/plants/${plant.id}`}
                              className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              {plant.plantId}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {cross.notes && (
                      <div className="px-4 pb-4 text-xs text-[var(--clay)]">
                        <span className="font-medium">Notes:</span> {cross.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Cross Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title="Record New Cross"
      >
        <div className="space-y-4">
          {/* Female Parent (Seed) */}
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">
              Female Parent (Seed) <span className="text-rose-500">*</span>
            </label>
            <select
              value={crossForm.femalePlantId}
              onChange={(e) => handleParentChange('femalePlantId', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            >
              <option value="">Select plant...</option>
              {plants
                .sort((a, b) => (a.hybridName || a.species || '').localeCompare(b.hybridName || b.species || ''))
                .map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.hybridName || plant.species || 'Unknown'} ({plant.plantId})
                  </option>
                ))}
            </select>
          </div>

          {/* Male Parent (Pollen) */}
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">
              Male Parent (Pollen) <span className="text-rose-500">*</span>
            </label>
            <select
              value={crossForm.malePlantId}
              onChange={(e) => handleParentChange('malePlantId', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            >
              <option value="">Select plant...</option>
              {plants
                .sort((a, b) => (a.hybridName || a.species || '').localeCompare(b.hybridName || b.species || ''))
                .map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.hybridName || plant.species || 'Unknown'} ({plant.plantId})
                  </option>
                ))}
            </select>
          </div>

          {/* Cross Date */}
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Cross Date</label>
            <input
              type="date"
              value={crossForm.crossDate}
              onChange={(e) => setCrossForm({ ...crossForm, crossDate: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            />
          </div>

          {/* Cross Type & Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Type</label>
              <select
                value={crossForm.crossType}
                onChange={(e) => setCrossForm({ ...crossForm, crossType: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              >
                <option value="CONTROLLED">Controlled</option>
                <option value="OPEN">Open</option>
                <option value="SELF">Self</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Category</label>
              <select
                value={crossForm.crossCategory}
                onChange={(e) => setCrossForm({ ...crossForm, crossCategory: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              >
                <option value="">Auto-detect</option>
                <option value="INTRASPECIFIC">Intraspecific</option>
                <option value="INTERSPECIFIC">Interspecific</option>
                <option value="INTERSECTIONAL">Intersectional</option>
              </select>
            </div>
          </div>

          {/* Pollination Method */}
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Pollen Source</label>
            <select
              value={crossForm.pollinationMethod}
              onChange={(e) => setCrossForm({ ...crossForm, pollinationMethod: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            >
              <option value="fresh">Fresh pollen</option>
              <option value="stored">Stored pollen</option>
              <option value="mixed">Mixed (fresh + stored)</option>
            </select>
          </div>

          {/* Target Traits */}
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Target Traits</label>
            <input
              type="text"
              value={crossForm.targetTraits}
              onChange={(e) => setCrossForm({ ...crossForm, targetTraits: e.target.value })}
              placeholder="bullate texture, dark velvet, vigor (comma-separated)"
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            />
            <p className="text-xs text-[var(--clay)] mt-1">Comma-separated list of breeding goals</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={crossForm.notes}
              onChange={(e) => setCrossForm({ ...crossForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              rows={2}
              placeholder="Additional notes about this cross..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveCross}
              disabled={!crossForm.femalePlantId || !crossForm.malePlantId}
              className="flex-1 px-4 py-2.5 bg-[var(--forest)] text-white text-sm rounded-lg hover:bg-[var(--forest)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Cross
            </button>
            <button
              onClick={() => {
                setModalOpen(false)
                resetForm()
              }}
              className="flex-1 px-4 py-2.5 border border-black/[0.08] text-sm rounded-lg text-[var(--bark)] hover:bg-black/[0.02] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

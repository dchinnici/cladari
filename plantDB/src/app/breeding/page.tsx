'use client'

import { useEffect, useState } from 'react'
import {
  Heart, Plus, ChevronRight, Sprout, Leaf,
  FlaskConical, TreeDeciduous, Calendar, Target,
  ChevronDown, X, Droplets, Trash2, Pencil
} from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'
import { getTodayString } from '@/lib/timezone'

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
  container: string | null
  temperature: number | null
  humidity: number | null
  heatMat: boolean
  domed: boolean
  notes: string | null
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

  // Harvest modal state
  const [harvestModalOpen, setHarvestModalOpen] = useState(false)
  const [harvestCrossId, setHarvestCrossId] = useState<string | null>(null)
  const [harvestForm, setHarvestForm] = useState({
    harvestDate: getTodayString(),
    berryCount: '',
    seedCount: '',
    seedViability: 'good',
    notes: ''
  })

  // Seed Batch modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchHarvestId, setBatchHarvestId] = useState<string | null>(null)
  const [batchForm, setBatchForm] = useState({
    sowDate: getTodayString(),
    seedCount: '',
    substrate: 'sphagnum',
    container: '4-inch pot',
    temperature: '75',
    humidity: '90',
    heatMat: true,
    domed: true,
    notes: ''
  })

  // Edit Seed Batch modal state
  const [editBatchModalOpen, setEditBatchModalOpen] = useState(false)
  const [editBatchId, setEditBatchId] = useState<string | null>(null)
  const [editBatchForm, setEditBatchForm] = useState({
    sowDate: '',
    seedCount: '',
    substrate: '',
    container: '',
    temperature: '',
    humidity: '',
    heatMat: false,
    domed: false,
    status: '',
    notes: ''
  })

  // Seedling modal state
  const [seedlingModalOpen, setSeedlingModalOpen] = useState(false)
  const [seedlingBatchId, setSeedlingBatchId] = useState<string | null>(null)
  const [seedlingForm, setSeedlingForm] = useState({
    count: '1',
    emergenceDate: getTodayString(),
    positionLabel: '',
    notes: ''
  })

  // Seedling detail/graduate modal state
  const [selectedSeedling, setSelectedSeedling] = useState<Seedling | null>(null)
  const [seedlingDetailOpen, setSeedlingDetailOpen] = useState(false)
  const [graduateForm, setGraduateForm] = useState({
    hybridName: '',
    notes: ''
  })

  // Form state
  const [crossForm, setCrossForm] = useState({
    femalePlantId: '',
    malePlantId: '',
    crossDate: getTodayString(),
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
      crossDate: getTodayString(),
      crossType: 'CONTROLLED',
      crossCategory: '',
      pollinationMethod: 'fresh',
      targetTraits: '',
      notes: ''
    })
  }

  const handleDeleteCross = async (cross: BreedingRecord, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding the card

    if (cross.offspring.length > 0) {
      showToast({
        type: 'error',
        title: 'Cannot delete cross with graduated plants'
      })
      return
    }

    // Build confirmation message with warning about cascading deletes
    let confirmMsg = `Delete ${cross.crossId}?`
    if (cross.summary.totalHarvests > 0) {
      confirmMsg += `\n\nThis will also delete:\n- ${cross.summary.totalHarvests} harvest(s)\n- ${cross.summary.totalSeeds} seed records\n- ${cross.summary.totalSeedlings} seedling records`
    }
    confirmMsg += '\n\nThis cannot be undone.'

    if (!confirm(confirmMsg)) {
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

  // Harvest handlers
  const openHarvestModal = (crossId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHarvestCrossId(crossId)
    setHarvestForm({
      harvestDate: getTodayString(),
      berryCount: '',
      seedCount: '',
      seedViability: 'good',
      notes: ''
    })
    setHarvestModalOpen(true)
  }

  const handleSaveHarvest = async () => {
    if (!harvestCrossId) return

    try {
      const response = await fetch(`/api/breeding/${harvestCrossId}/harvests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          harvestDate: harvestForm.harvestDate,
          berryCount: harvestForm.berryCount ? parseInt(harvestForm.berryCount) : null,
          seedCount: parseInt(harvestForm.seedCount) || 0,
          seedViability: harvestForm.seedViability || null,
          notes: harvestForm.notes || null
        })
      })

      if (response.ok) {
        await fetchData()
        setHarvestModalOpen(false)
        showToast({ type: 'success', title: 'Harvest recorded' })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to save harvest' })
      }
    } catch (error) {
      console.error('Error saving harvest:', error)
      showToast({ type: 'error', title: 'Error saving harvest' })
    }
  }

  // Seed Batch handlers
  const openBatchModal = (harvestId: string, seedCount: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setBatchHarvestId(harvestId)
    setBatchForm({
      sowDate: getTodayString(),
      seedCount: seedCount.toString(),
      substrate: 'sphagnum',
      container: '4-inch pot',
      temperature: '75',
      humidity: '90',
      heatMat: true,
      domed: true,
      notes: ''
    })
    setBatchModalOpen(true)
  }

  const handleSaveBatch = async () => {
    if (!batchHarvestId) return

    try {
      const response = await fetch('/api/seed-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          harvestId: batchHarvestId,
          sowDate: batchForm.sowDate,
          seedCount: parseInt(batchForm.seedCount) || 0,
          substrate: batchForm.substrate,
          container: batchForm.container,
          temperature: batchForm.temperature,
          humidity: batchForm.humidity,
          heatMat: batchForm.heatMat,
          domed: batchForm.domed,
          notes: batchForm.notes || null
        })
      })

      if (response.ok) {
        const batch = await response.json()
        await fetchData()
        setBatchModalOpen(false)
        showToast({ type: 'success', title: `Seed batch ${batch.batchId} created` })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to create batch' })
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      showToast({ type: 'error', title: 'Error creating batch' })
    }
  }

  // Edit Seed Batch handlers
  const openEditBatchModal = (batch: SeedBatch, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditBatchId(batch.id)
    setEditBatchForm({
      sowDate: batch.sowDate ? batch.sowDate.split('T')[0] : '',
      seedCount: batch.seedCount?.toString() || '',
      substrate: batch.substrate || 'sphagnum',
      container: batch.container || '',
      temperature: batch.temperature?.toString() || '',
      humidity: batch.humidity?.toString() || '',
      heatMat: batch.heatMat ?? false,
      domed: batch.domed ?? true,
      status: batch.status || 'SOWN',
      notes: batch.notes || ''
    })
    setEditBatchModalOpen(true)
  }

  const handleUpdateBatch = async () => {
    if (!editBatchId) return

    try {
      const response = await fetch(`/api/seed-batches/${editBatchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sowDate: editBatchForm.sowDate || undefined,
          seedCount: editBatchForm.seedCount ? parseInt(editBatchForm.seedCount) : undefined,
          substrate: editBatchForm.substrate || undefined,
          container: editBatchForm.container || undefined,
          temperature: editBatchForm.temperature || undefined,
          humidity: editBatchForm.humidity || undefined,
          heatMat: editBatchForm.heatMat,
          domed: editBatchForm.domed,
          status: editBatchForm.status || undefined,
          notes: editBatchForm.notes || undefined
        })
      })

      if (response.ok) {
        await fetchData()
        setEditBatchModalOpen(false)
        showToast({ type: 'success', title: 'Seed batch updated' })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to update batch' })
      }
    } catch (error) {
      console.error('Error updating batch:', error)
      showToast({ type: 'error', title: 'Error updating batch' })
    }
  }

  const handleDeleteBatch = async (batch: SeedBatch, e: React.MouseEvent) => {
    e.stopPropagation()

    if (batch._count.seedlings > 0) {
      showToast({
        type: 'error',
        title: 'Cannot delete batch with seedlings - remove seedlings first'
      })
      return
    }

    if (!confirm(`Delete seed batch ${batch.batchId}?\n\nThis cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/seed-batches/${batch.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        showToast({ type: 'success', title: `${batch.batchId} deleted` })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to delete' })
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      showToast({ type: 'error', title: 'Error deleting batch' })
    }
  }

  // Seedling handlers
  const openSeedlingModal = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSeedlingBatchId(batchId)
    setSeedlingForm({
      count: '1',
      emergenceDate: getTodayString(),
      positionLabel: '',
      notes: ''
    })
    setSeedlingModalOpen(true)
  }

  const handleSaveSeedling = async () => {
    if (!seedlingBatchId) return

    try {
      const count = parseInt(seedlingForm.count) || 1
      const seedlings = []

      for (let i = 0; i < count; i++) {
        seedlings.push({
          seedBatchId: seedlingBatchId,
          emergenceDate: seedlingForm.emergenceDate,
          positionLabel: count > 1 ? `${seedlingForm.positionLabel || ''}${i + 1}`.trim() : seedlingForm.positionLabel || null,
          notes: seedlingForm.notes || null
        })
      }

      const response = await fetch('/api/seedlings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(count === 1 ? seedlings[0] : seedlings)
      })

      if (response.ok) {
        await fetchData()
        setSeedlingModalOpen(false)
        showToast({ type: 'success', title: `${count} seedling${count > 1 ? 's' : ''} added` })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to add seedling' })
      }
    } catch (error) {
      console.error('Error adding seedling:', error)
      showToast({ type: 'error', title: 'Error adding seedling' })
    }
  }

  // Seedling detail/graduate handlers
  const openSeedlingDetail = (seedling: Seedling, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSeedling(seedling)
    setGraduateForm({ hybridName: '', notes: '' })
    setSeedlingDetailOpen(true)
  }

  const handleUpdateSeedlingStatus = async (status: string) => {
    if (!selectedSeedling) return

    try {
      const response = await fetch(`/api/seedlings/${selectedSeedling.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectionStatus: status })
      })

      if (response.ok) {
        await fetchData()
        setSeedlingDetailOpen(false)
        showToast({ type: 'success', title: `Status updated to ${status}` })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to update' })
      }
    } catch (error) {
      console.error('Error updating seedling:', error)
      showToast({ type: 'error', title: 'Error updating seedling' })
    }
  }

  const handleGraduateSeedling = async () => {
    if (!selectedSeedling) return

    try {
      const response = await fetch(`/api/seedlings/${selectedSeedling.id}/graduate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hybridName: graduateForm.hybridName || null,
          notes: graduateForm.notes || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        await fetchData()
        setSeedlingDetailOpen(false)
        showToast({
          type: 'success',
          title: `Graduated to ${result.plant.plantId}`
        })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to graduate' })
      }
    } catch (error) {
      console.error('Error graduating seedling:', error)
      showToast({ type: 'error', title: 'Error graduating seedling' })
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
                      {/* Delete button - only hide if graduated plants exist */}
                      {cross.offspring.length === 0 && (
                        <button
                          onClick={(e) => handleDeleteCross(cross, e)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                          title={cross.summary.totalHarvests > 0 ? "Delete cross (will delete harvests/seedlings too)" : "Delete cross"}
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
                          {(Array.isArray(cross.targetTraits) ? cross.targetTraits : []).map((trait: string, i: number) => (
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
                            onClick={(e) => openHarvestModal(cross.id, e)}
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
                                  <div className="flex justify-end mb-1">
                                    <button
                                      onClick={(e) => openBatchModal(harvest.id, harvest.seedCount, e)}
                                      className="text-[10px] text-[var(--moss)] hover:text-[var(--forest)] flex items-center gap-0.5"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      Add Batch
                                    </button>
                                  </div>
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
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-[var(--clay)]">
                                            {batch._count.seedlings} seedlings
                                          </span>
                                          <button
                                            onClick={(e) => openEditBatchModal(batch, e)}
                                            className="p-1 hover:bg-black/[0.04] rounded transition-colors"
                                            title="Edit batch"
                                          >
                                            <Pencil className="w-3 h-3 text-[var(--clay)] hover:text-[var(--moss)]" />
                                          </button>
                                          {batch._count.seedlings === 0 && (
                                            <button
                                              onClick={(e) => handleDeleteBatch(batch, e)}
                                              className="p-1 hover:bg-red-50 rounded transition-colors"
                                              title="Delete batch"
                                            >
                                              <Trash2 className="w-3 h-3 text-[var(--clay)] hover:text-red-500" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-xs text-[var(--clay)] mb-2">
                                        {batch.substrate}
                                      </div>

                                      {/* Seedlings */}
                                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/[0.04]">
                                        <div className="flex flex-wrap gap-1">
                                          {batch.seedlings && batch.seedlings.slice(0, 10).map((seedling) => (
                                            <button
                                              key={seedling.id}
                                              onClick={(e) => openSeedlingDetail(seedling, e)}
                                              className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-[var(--moss)]/30 transition-all ${getSelectionColor(seedling.selectionStatus)}`}
                                              title={`${seedling.seedlingId} - ${seedling.selectionStatus} (click to manage)`}
                                            >
                                              {seedling.seedlingId.split('-').pop()}
                                            </button>
                                          ))}
                                          {batch.seedlings && batch.seedlings.length > 10 && (
                                            <span className="text-[10px] text-[var(--clay)]">
                                              +{batch.seedlings.length - 10} more
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={(e) => openSeedlingModal(batch.id, e)}
                                          className="text-[10px] text-lime-600 hover:text-lime-700 flex items-center gap-0.5 ml-2"
                                        >
                                          <Plus className="w-2.5 h-2.5" />
                                          Add Seedling
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="text-xs text-[var(--clay)] italic">
                                    No seed batches yet
                                  </p>
                                  <button
                                    onClick={(e) => openBatchModal(harvest.id, harvest.seedCount, e)}
                                    className="text-xs text-[var(--moss)] hover:text-[var(--forest)] flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Sow Seeds
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-[var(--clay)] mb-3">No harvests yet. Record one when berries ripen.</p>
                        <button
                          onClick={(e) => openHarvestModal(cross.id, e)}
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

      {/* Harvest Modal */}
      <Modal
        isOpen={harvestModalOpen}
        onClose={() => setHarvestModalOpen(false)}
        title="Record Harvest"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">
              Harvest Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={harvestForm.harvestDate}
              onChange={(e) => setHarvestForm({ ...harvestForm, harvestDate: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Berry Count</label>
              <input
                type="number"
                value={harvestForm.berryCount}
                onChange={(e) => setHarvestForm({ ...harvestForm, berryCount: e.target.value })}
                placeholder="e.g., 5"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">
                Seed Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={harvestForm.seedCount}
                onChange={(e) => setHarvestForm({ ...harvestForm, seedCount: e.target.value })}
                placeholder="e.g., 25"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Seed Viability</label>
            <select
              value={harvestForm.seedViability}
              onChange={(e) => setHarvestForm({ ...harvestForm, seedViability: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            >
              <option value="excellent">Excellent - fully developed</option>
              <option value="good">Good - mostly viable</option>
              <option value="fair">Fair - some underdeveloped</option>
              <option value="poor">Poor - many empty/underdeveloped</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={harvestForm.notes}
              onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              rows={2}
              placeholder="Berry color, size, extraction notes..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveHarvest}
              disabled={!harvestForm.seedCount}
              className="flex-1 px-4 py-2.5 bg-[var(--forest)] text-white text-sm rounded-lg hover:bg-[var(--forest)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Harvest
            </button>
            <button
              onClick={() => setHarvestModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-black/[0.08] text-sm rounded-lg text-[var(--bark)] hover:bg-black/[0.02] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Seed Batch Modal */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title="Create Seed Batch"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Sow Date</label>
              <input
                type="date"
                value={batchForm.sowDate}
                onChange={(e) => setBatchForm({ ...batchForm, sowDate: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Seed Count</label>
              <input
                type="number"
                value={batchForm.seedCount}
                onChange={(e) => setBatchForm({ ...batchForm, seedCount: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Substrate</label>
              <select
                value={batchForm.substrate}
                onChange={(e) => setBatchForm({ ...batchForm, substrate: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              >
                <option value="sphagnum">Sphagnum moss</option>
                <option value="perlite">Perlite</option>
                <option value="sphagnum-perlite">Sphagnum + Perlite</option>
                <option value="pon">PON</option>
                <option value="seed-mix">Seed starting mix</option>
                <option value="paper-towel">Paper towel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Container</label>
              <input
                type="text"
                value={batchForm.container}
                onChange={(e) => setBatchForm({ ...batchForm, container: e.target.value })}
                placeholder="e.g., 4-inch pot, takeout container"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Temperature (°F)</label>
              <input
                type="text"
                value={batchForm.temperature}
                onChange={(e) => setBatchForm({ ...batchForm, temperature: e.target.value })}
                placeholder="e.g., 75-80"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Humidity (%)</label>
              <input
                type="text"
                value={batchForm.humidity}
                onChange={(e) => setBatchForm({ ...batchForm, humidity: e.target.value })}
                placeholder="e.g., 80-90"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--bark)]">
              <input
                type="checkbox"
                checked={batchForm.heatMat}
                onChange={(e) => setBatchForm({ ...batchForm, heatMat: e.target.checked })}
                className="rounded border-black/[0.08]"
              />
              Heat mat
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--bark)]">
              <input
                type="checkbox"
                checked={batchForm.domed}
                onChange={(e) => setBatchForm({ ...batchForm, domed: e.target.checked })}
                className="rounded border-black/[0.08]"
              />
              Domed/covered
            </label>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={batchForm.notes}
              onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              rows={2}
              placeholder="Sowing method, pre-treatment..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveBatch}
              className="flex-1 px-4 py-2.5 bg-[var(--forest)] text-white text-sm rounded-lg hover:bg-[var(--forest)]/90 transition-colors"
            >
              Create Batch
            </button>
            <button
              onClick={() => setBatchModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-black/[0.08] text-sm rounded-lg text-[var(--bark)] hover:bg-black/[0.02] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Seedling Detail/Graduate Modal */}
      <Modal
        isOpen={seedlingDetailOpen}
        onClose={() => setSeedlingDetailOpen(false)}
        title={selectedSeedling ? `Seedling ${selectedSeedling.seedlingId}` : 'Seedling Details'}
      >
        {selectedSeedling && (
          <div className="space-y-4">
            {/* Current Status */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg">
              <span className="text-sm text-[var(--bark)]">Current Status</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getSelectionColor(selectedSeedling.selectionStatus)}`}>
                {selectedSeedling.selectionStatus}
              </span>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--clay)]">Emerged:</span>
                <span className="ml-2 text-[var(--bark)]">
                  {new Date(selectedSeedling.emergenceDate).toLocaleDateString()}
                </span>
              </div>
              {selectedSeedling.leafCount && (
                <div>
                  <span className="text-[var(--clay)]">Leaves:</span>
                  <span className="ml-2 text-[var(--bark)]">{selectedSeedling.leafCount}</span>
                </div>
              )}
            </div>

            {/* Status Actions */}
            {selectedSeedling.selectionStatus !== 'GRADUATED' && (
              <div>
                <label className="block text-sm text-[var(--bark)] mb-2">Change Status</label>
                <div className="flex flex-wrap gap-2">
                  {['GROWING', 'KEEPER', 'HOLDBACK', 'CULLED', 'DIED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateSeedlingStatus(status)}
                      disabled={selectedSeedling.selectionStatus === status}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedSeedling.selectionStatus === status
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-black/[0.02]'
                      } ${getSelectionColor(status)} border-current/20`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Graduate Section */}
            {(selectedSeedling.selectionStatus === 'KEEPER' || selectedSeedling.selectionStatus === 'HOLDBACK') && (
              <div className="border-t border-black/[0.06] pt-4 mt-4">
                <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-2">
                  <TreeDeciduous className="w-4 h-4" />
                  Graduate to Plant
                </h4>
                <p className="text-xs text-[var(--clay)] mb-3">
                  Promote this seedling to a full Plant record with an ANT-YYYY-#### ID.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[var(--bark)] mb-1">Hybrid Name (optional)</label>
                    <input
                      type="text"
                      value={graduateForm.hybridName}
                      onChange={(e) => setGraduateForm({ ...graduateForm, hybridName: e.target.value })}
                      placeholder="Auto-generated from parents if empty"
                      className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
                    <textarea
                      value={graduateForm.notes}
                      onChange={(e) => setGraduateForm({ ...graduateForm, notes: e.target.value })}
                      placeholder="Why this seedling was selected..."
                      className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleGraduateSeedling}
                    className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <TreeDeciduous className="w-4 h-4" />
                    Graduate Seedling
                  </button>
                </div>
              </div>
            )}

            {/* Already Graduated */}
            {selectedSeedling.selectionStatus === 'GRADUATED' && selectedSeedling.graduatedToPlant && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Graduated to{' '}
                  <a
                    href={`/plants/${selectedSeedling.graduatedToPlant.plantId}`}
                    className="font-medium underline"
                  >
                    {selectedSeedling.graduatedToPlant.plantId}
                  </a>
                </p>
              </div>
            )}

            <button
              onClick={() => setSeedlingDetailOpen(false)}
              className="w-full px-4 py-2.5 border border-black/[0.08] text-sm rounded-lg text-[var(--bark)] hover:bg-black/[0.02] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* Seedling Modal */}
      <Modal
        isOpen={seedlingModalOpen}
        onClose={() => setSeedlingModalOpen(false)}
        title="Add Seedlings"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Number of Seedlings</label>
              <input
                type="number"
                min="1"
                value={seedlingForm.count}
                onChange={(e) => setSeedlingForm({ ...seedlingForm, count: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
              <p className="text-xs text-[var(--clay)] mt-1">IDs auto-generated (SDL-YYYY-####)</p>
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Emergence Date</label>
              <input
                type="date"
                value={seedlingForm.emergenceDate}
                onChange={(e) => setSeedlingForm({ ...seedlingForm, emergenceDate: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Position Label (optional)</label>
            <input
              type="text"
              value={seedlingForm.positionLabel}
              onChange={(e) => setSeedlingForm({ ...seedlingForm, positionLabel: e.target.value })}
              placeholder="e.g., A, Row-1, Corner"
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
            />
            <p className="text-xs text-[var(--clay)] mt-1">
              {parseInt(seedlingForm.count) > 1 ? 'Numbers will be appended (A1, A2, A3...)' : 'Physical position in tray/pot'}
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={seedlingForm.notes}
              onChange={(e) => setSeedlingForm({ ...seedlingForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              rows={2}
              placeholder="Observations about emergence..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveSeedling}
              className="flex-1 px-4 py-2.5 bg-lime-600 text-white text-sm rounded-lg hover:bg-lime-700 transition-colors"
            >
              Add {parseInt(seedlingForm.count) > 1 ? `${seedlingForm.count} Seedlings` : 'Seedling'}
            </button>
            <button
              onClick={() => setSeedlingModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-black/[0.08] text-sm rounded-lg text-[var(--bark)] hover:bg-black/[0.02] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Seed Batch Modal */}
      <Modal
        isOpen={editBatchModalOpen}
        onClose={() => setEditBatchModalOpen(false)}
        title="Edit Seed Batch"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Sow Date</label>
              <input
                type="date"
                value={editBatchForm.sowDate}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, sowDate: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Seed Count</label>
              <input
                type="number"
                value={editBatchForm.seedCount}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, seedCount: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Substrate</label>
              <select
                value={editBatchForm.substrate}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, substrate: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              >
                <option value="sphagnum">Sphagnum moss</option>
                <option value="perlite">Perlite</option>
                <option value="sphagnum-perlite">Sphagnum + Perlite</option>
                <option value="pon">PON</option>
                <option value="seed-mix">Seed starting mix</option>
                <option value="paper-towel">Paper towel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Status</label>
              <select
                value={editBatchForm.status}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, status: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              >
                <option value="SOWN">Sown</option>
                <option value="GERMINATING">Germinating</option>
                <option value="PRICKING_OUT">Pricking Out</option>
                <option value="SELECTING">Selecting</option>
                <option value="COMPLETE">Complete</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Container</label>
              <input
                type="text"
                value={editBatchForm.container}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, container: e.target.value })}
                placeholder="e.g., 4-inch pot"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Temperature (F)</label>
              <input
                type="text"
                value={editBatchForm.temperature}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, temperature: e.target.value })}
                placeholder="e.g., 75"
                className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--bark)]">
              <input
                type="checkbox"
                checked={editBatchForm.heatMat}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, heatMat: e.target.checked })}
                className="rounded border-black/[0.08]"
              />
              Heat mat
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--bark)]">
              <input
                type="checkbox"
                checked={editBatchForm.domed}
                onChange={(e) => setEditBatchForm({ ...editBatchForm, domed: e.target.checked })}
                className="rounded border-black/[0.08]"
              />
              Domed/covered
            </label>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={editBatchForm.notes}
              onChange={(e) => setEditBatchForm({ ...editBatchForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--moss)]/20 focus:border-[var(--moss)]"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpdateBatch}
              className="flex-1 px-4 py-2.5 bg-[var(--forest)] text-white text-sm rounded-lg hover:bg-[var(--forest)]/90 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditBatchModalOpen(false)}
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

'use client'

import Link from 'next/link'
import { Droplets, Search, SlidersHorizontal, Plus, AlertTriangle, Clock } from 'lucide-react'
import { showToast } from '@/components/toast'
import { Modal } from '@/components/modal'
import QuickCare from '@/components/QuickCare'
import { useEffect, useState, useRef } from 'react'
import { getTodayString } from '@/lib/timezone'
import { isPlantStale, getWateringStatus, type CareStatus } from '@/lib/care-thresholds'
import { getPhotoUrl } from '@/lib/photo-url'

export default function PlantsPage() {
  // Helper to check if plant needs attention - now uses dynamic thresholds
  const isStale = (plant: any) => {
    return isPlantStale(plant.careLogs || [], plant.lastActivityDate || plant.updatedAt)
  }

  // Helper to get care status with dynamic thresholds
  const getCareStatus = (plant: any): CareStatus => {
    return getWateringStatus(plant.careLogs || [])
  }

  // Helper to get days since last care
  const getDaysSinceLastCare = (plant: any) => {
    if (!plant.careLogs || plant.careLogs.length === 0) return null
    const lastCare = new Date(plant.careLogs[0].date)
    return Math.floor((Date.now() - lastCare.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Format last care for display
  const formatLastCare = (plant: any) => {
    if (!plant.careLogs || plant.careLogs.length === 0) return 'No care logged'
    const days = getDaysSinceLastCare(plant)
    const action = plant.careLogs[0].action || 'Care'
    if (days === 0) return `${action} today`
    if (days === 1) return `${action} yesterday`
    return `${action} ${days}d ago`
  }

  // Helper to get the most recent activity date
  const getLastActivityDate = (plant: any) => {
    return plant.lastActivityDate ? new Date(plant.lastActivityDate) : new Date(plant.updatedAt)
  }

  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [quickCareOpen, setQuickCareOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState({
    healthStatus: '',
    breederCode: '',
    locationId: '',
    section: '',
    needsAttention: false
  })
  const [sortBy, setSortBy] = useState('oldest') // Default to oldest = plants needing attention first
  const [locations, setLocations] = useState<any[]>([])
  const [createForm, setCreateForm] = useState({
    hybridName: '',
    species: '',
    speciesComplex: '',
    breederCode: '',
    acquisitionCost: '',
    accessionDate: '', // Set on client side to avoid hydration mismatch
    healthStatus: 'healthy',
  })

  // Set date on client to avoid hydration mismatch
  useEffect(() => {
    setCreateForm(f => ({ ...f, accessionDate: getTodayString() }))
  }, [])

  useEffect(() => {
    // Check if we're returning from plant detail (flag indicates care may have been added)
    const returningFromDetail = sessionStorage.getItem('plantsPageScroll') !== null

    fetchPlants()
    fetchLocations()

    // Restore scroll position, filters, and sort if returning from plant detail
    const savedScroll = sessionStorage.getItem('plantsPageScroll')
    const savedFilters = sessionStorage.getItem('plantsPageFilters')
    const savedSort = sessionStorage.getItem('plantsPageSort')
    const savedSearch = sessionStorage.getItem('plantsPageSearch')

    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll))
        sessionStorage.removeItem('plantsPageScroll')
      }, 100)
    }

    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters))
        sessionStorage.removeItem('plantsPageFilters')
      } catch (e) {
        console.error('Failed to restore filters:', e)
      }
    }

    if (savedSort) {
      setSortBy(savedSort)
      sessionStorage.removeItem('plantsPageSort')
    }

    if (savedSearch) {
      setSearchTerm(savedSearch)
      sessionStorage.removeItem('plantsPageSearch')
    }
  }, [])

  // Refetch plants when page becomes visible (handles back navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPlants()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Cmd/Ctrl + K for Quick Care
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setQuickCareOpen(true)
      }

      // / to focus search (like GitHub)
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // N for new plant
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setCreateOpen(true)
      }

      // F for filter
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setFilterOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants')
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPlants(data)
      } else if (data.error) {
        console.error('API Error:', data.error)
        setPlants([])
      } else {
        setPlants([])
      }
    } catch (error) {
      console.error('Error fetching plants:', error)
      setPlants([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPlants = plants
    .filter(plant => {
      // Search filter
      const search = searchTerm.toLowerCase()
      const matchesSearch = (
        plant.plantId?.toLowerCase().includes(search) ||
        plant.species?.toLowerCase().includes(search) ||
        plant.hybridName?.toLowerCase().includes(search) ||
        plant.breederCode?.toLowerCase().includes(search)
      )

      // Additional filters
      const matchesHealth = !filters.healthStatus || plant.healthStatus === filters.healthStatus
      const matchesBreeder = !filters.breederCode || plant.breederCode === filters.breederCode
      const matchesLocation = !filters.locationId || plant.locationId === filters.locationId
      const matchesSection = !filters.section || plant.section === filters.section
      const matchesAttention = !filters.needsAttention || isStale(plant)

      return matchesSearch && matchesHealth && matchesBreeder && matchesLocation && matchesSection && matchesAttention
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        // Plants with oldest activity first (no recent activity = needs attention)
        return getLastActivityDate(a).getTime() - getLastActivityDate(b).getTime()
      } else if (sortBy === 'newest') {
        // Newest activity first - considers ALL activity
        return getLastActivityDate(b).getTime() - getLastActivityDate(a).getTime()
      } else if (sortBy === 'alphabetical') {
        // Sort by hybrid name, then species, then plantId as fallback
        const nameA = (a.hybridName || a.species || a.plantId || '').toLowerCase()
        const nameB = (b.hybridName || b.species || b.plantId || '').toLowerCase()
        return nameA.localeCompare(nameB)
      }
      return 0
    })

  const clearFilters = () => {
    setFilters({
      healthStatus: '',
      breederCode: '',
      locationId: '',
      section: '',
      needsAttention: false
    })
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/plants/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cladari-plants-${getTodayString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast({ type: 'success', title: 'Database exported', message: 'CSV file downloaded successfully' })
      } else {
        showToast({ type: 'error', title: 'Export failed' })
      }
    } catch (error) {
      console.error('Error exporting plants:', error)
      showToast({ type: 'error', title: 'Export error' })
    }
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== false).length
  const stalePlantCount = plants.filter(isStale).length
  const needsWaterCount = plants.filter(p => getDaysSinceLastCare(p) !== null && getDaysSinceLastCare(p)! >= 5).length

  return (
    <div className="min-h-screen">
      {/* Mobile: Care summary bar - immediately visible */}
      <div className="sm:hidden bg-white border-b border-black/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stalePlantCount > 0 && (
              <button
                onClick={() => setFilters({ ...filters, needsAttention: !filters.needsAttention })}
                className={`flex items-center gap-1.5 text-sm ${
                  filters.needsAttention ? 'text-[var(--alert-red)] font-medium' : 'text-[var(--bark)]'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{stalePlantCount} stale</span>
              </button>
            )}
            <span className="text-sm text-[var(--clay)]">{plants.length} plants</span>
          </div>
          <button
            onClick={() => setQuickCareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--forest)] text-white text-sm rounded"
          >
            <Droplets className="w-4 h-4" />
            Log Care
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Desktop header - minimal */}
        <div className="hidden sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--forest)]">Plants</h1>
            <p className="text-sm text-[var(--clay)] mt-1">{plants.length} specimens</p>
          </div>
          <div className="flex items-center gap-3">
            {stalePlantCount > 0 && (
              <button
                onClick={() => setFilters({ ...filters, needsAttention: !filters.needsAttention })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded ${
                  filters.needsAttention
                    ? 'bg-[var(--alert-red)] text-white'
                    : 'text-[var(--alert-red)] border border-[var(--alert-red)]/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                {stalePlantCount} need attention
              </button>
            )}
            <button
              onClick={() => setQuickCareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--forest)] text-white text-sm rounded"
            >
              <Droplets className="w-4 h-4" />
              Log Care
            </button>
          </div>
        </div>

        {/* Search and filters - compact */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--clay)]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-black/[0.08] rounded text-sm focus:outline-none focus:border-[var(--moss)]"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className={`p-2 border rounded ${
              activeFilterCount > 0 ? 'border-[var(--forest)] bg-[var(--forest)]/5' : 'border-black/[0.08]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--bark)]" />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="p-2 border border-black/[0.08] rounded"
          >
            <Plus className="w-4 h-4 text-[var(--bark)]" />
          </button>
        </div>

        {/* Sort options - text links, not fancy dropdown */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="text-[var(--clay)]">Sort:</span>
          {[
            { key: 'oldest', label: 'Needs attention' },
            { key: 'newest', label: 'Recent activity' },
            { key: 'alphabetical', label: 'A-Z' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={sortBy === option.key ? 'text-[var(--forest)] font-medium' : 'text-[var(--bark)]'}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Plant grid */}
        {loading ? (
          <div className="text-center py-12 text-[var(--clay)]">
            <p>Loading plants...</p>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="text-center py-12 text-[var(--clay)]">
            <p>{searchTerm ? 'No plants match your search' : 'Add your first plant to get started'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredPlants.map((plant) => (
              <Link
                href={`/plants/${plant.id}`}
                key={plant.id}
                onClick={() => {
                  sessionStorage.setItem('plantsPageScroll', window.scrollY.toString())
                  sessionStorage.setItem('plantsPageFilters', JSON.stringify(filters))
                  sessionStorage.setItem('plantsPageSort', sortBy)
                  sessionStorage.setItem('plantsPageSearch', searchTerm)
                }}
                className="card-interactive overflow-hidden block"
              >
                {/* Photo - square for minimal cropping from any orientation */}
                {plant.photos && plant.photos.length > 0 ? (
                  <div className="aspect-square bg-[var(--parchment)]">
                    <img
                      src={getPhotoUrl(plant.photos[0], 'card')}
                      alt={plant.hybridName || plant.species || 'Plant'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-[var(--parchment)] flex items-center justify-center">
                    <span className="text-3xl text-[var(--sage)]">🌿</span>
                  </div>
                )}

                <div className="p-3">
                  {/* Plant name */}
                  <h3 className="font-medium text-sm text-[var(--forest)] leading-tight line-clamp-2">
                    {plant.hybridName || plant.species || 'Unknown'}
                  </h3>

                  {/* Plant ID */}
                  <p className="text-xs text-[var(--clay)] font-mono mt-0.5">{plant.plantId}</p>

                  {/* Last care - key info */}
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <Clock className="w-3 h-3 text-[var(--clay)]" />
                    <span className={`${
                      getDaysSinceLastCare(plant) === null || getDaysSinceLastCare(plant)! >= 7
                        ? 'text-[var(--alert-red)]'
                        : getDaysSinceLastCare(plant)! >= 5
                        ? 'text-[var(--spadix-yellow)]'
                        : 'text-[var(--moss)]'
                    }`}>
                      {formatLastCare(plant)}
                    </span>
                  </div>

                  {/* Location if available */}
                  {plant.currentLocation && (
                    <p className="text-xs text-[var(--clay)] mt-1 truncate">
                      {plant.currentLocation.name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Plant Modal */}
        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Plant">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Hybrid Name</label>
                <input value={createForm.hybridName} onChange={e=>setCreateForm({...createForm, hybridName: e.target.value})} className="w-full p-2 rounded border border-black/[0.08] text-sm" placeholder="e.g., RA8 x RA5" />
              </div>
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Species</label>
                <input value={createForm.species} onChange={e=>setCreateForm({...createForm, species: e.target.value})} className="w-full p-2 rounded border border-black/[0.08] text-sm" placeholder="e.g., papillilaminum" />
              </div>
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Section</label>
                <input value={createForm.speciesComplex} onChange={e=>setCreateForm({...createForm, speciesComplex: e.target.value})} className="w-full p-2 rounded border border-black/[0.08] text-sm" placeholder="e.g., Cardiolonchium" />
              </div>
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Breeder Code</label>
                <input value={createForm.breederCode} onChange={e=>setCreateForm({...createForm, breederCode: e.target.value})} className="w-full p-2 rounded border border-black/[0.08] text-sm" placeholder="e.g., RA8" />
              </div>
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Acquisition Cost</label>
                <input type="number" value={createForm.acquisitionCost} onChange={e=>setCreateForm({...createForm, acquisitionCost: e.target.value})} className="w-full p-2 rounded border border-black/[0.08] text-sm" placeholder="e.g., 250" />
              </div>
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Accession Date</label>
                <input type="date" value={createForm.accessionDate} onChange={e=>setCreateForm({...createForm, accessionDate: e.target.value})} className="w-full p-2 rounded border border-black/[0.08] text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setCreateOpen(false)} className="px-4 py-2 rounded border border-black/[0.08] text-sm text-[var(--bark)]">Cancel</button>
              <button disabled={creating} onClick={async ()=>{
                setCreating(true)
                try{
                  const res = await fetch('/api/plants', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(createForm)
                  })
                  if(res.ok){
                    showToast({ type: 'success', title: 'Plant created', message: 'New plant was added successfully.' })
                    setCreateOpen(false)
                    setCreateForm({ hybridName:'', species:'', speciesComplex:'', breederCode:'', acquisitionCost:'', accessionDate: getTodayString(), healthStatus: 'healthy' })
                    await fetchPlants()
                  } else {
                    showToast({ type: 'error', title: 'Create failed', message: 'Could not create plant. Please try again.' })
                  }
                } catch(e){
                  console.error('Create plant failed', e)
                  showToast({ type: 'error', title: 'Network or server error' })
                } finally {
                  setCreating(false)
                }
              }} className="px-4 py-2 rounded bg-[var(--forest)] text-white text-sm">{creating ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>

        {/* Filter Modal */}
        <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Plants">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Health Status</label>
              <select
                value={filters.healthStatus}
                onChange={(e) => setFilters({ ...filters, healthStatus: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
              >
                <option value="">All statuses</option>
                <option value="healthy">Healthy</option>
                <option value="recovering">Recovering</option>
                <option value="struggling">Struggling</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Breeder Code</label>
              <select
                value={filters.breederCode}
                onChange={(e) => setFilters({ ...filters, breederCode: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
              >
                <option value="">All breeder codes</option>
                {Array.from(new Set(plants.map(p => p.breederCode).filter(Boolean)))
                  .sort((a, b) => a.localeCompare(b))
                  .map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Location</label>
              <select
                value={filters.locationId}
                onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
              >
                <option value="">All locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Section</label>
              <select
                value={filters.section}
                onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
              >
                <option value="">All sections</option>
                <option value="Cardiolonchium">Cardiolonchium</option>
                <option value="Belolonchium">Belolonchium</option>
                <option value="Pachyneurium">Pachyneurium</option>
                <option value="Chamaerepium">Chamaerepium</option>
                <option value="Tetraspermium">Tetraspermium</option>
                <option value="Calomystrium">Calomystrium</option>
                <option value="Digitinervium">Digitinervium</option>
                <option value="Porphyrochitonium">Porphyrochitonium</option>
                <option value="Xialophyllum">Xialophyllum</option>
                <option value="Semaeophyllum">Semaeophyllum</option>
                <option value="Urospadix">Urospadix</option>
                <option value="Dactylophyllium">Dactylophyllium</option>
                <option value="Polyneurium">Polyneurium</option>
                <option value="cross-section hybrid">cross-section hybrid</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 rounded border border-black/[0.08] text-sm text-[var(--bark)]"
              >
                Clear All
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 px-4 py-2 rounded bg-[var(--forest)] text-white text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </Modal>

        {/* Quick Care Modal */}
        <QuickCare
          isOpen={quickCareOpen}
          onClose={() => setQuickCareOpen(false)}
          plants={filteredPlants}
          onSuccess={() => {
            fetchPlants()
            showToast({ type: 'success', title: 'Care logs saved' })
          }}
        />
      </div>
    </div>
  )
}

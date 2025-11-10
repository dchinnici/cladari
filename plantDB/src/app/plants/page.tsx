'use client'

import Link from 'next/link'
import { ArrowLeft, Search, Plus, Filter, Leaf, DollarSign, MapPin, Calendar, Droplets, AlertTriangle, Download } from 'lucide-react'
import { showToast } from '@/components/toast'
import { Modal } from '@/components/modal'
import { useEffect, useState } from 'react'
import { getDaysSinceLastWatering, getDaysSinceLastFertilizing, calculateWateringFrequency, calculateFertilizingFrequency } from '@/lib/careLogUtils'
import { DEFAULT_INTERVALS } from '@/lib/care/types'

export default function PlantsPage() {
  // Helper to check if plant hasn't had ANY activity in 7+ days
  const isStale = (plant: any) => {
    const lastActivity = plant.lastActivityDate || plant.updatedAt
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceUpdate >= 7
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
    accessionDate: new Date().toISOString().split('T')[0],
    healthStatus: 'healthy',
  })

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
        // Plants needing care first - based on watering/fertilizing frequency
        const aWaterDays = getDaysSinceLastWatering(a.careLogs || [])
        const aWaterFreq = calculateWateringFrequency(a.careLogs || []) || DEFAULT_INTERVALS.water
        const aWaterOverdue = (aWaterDays === null ? 999 : aWaterDays) - aWaterFreq

        const aFertDays = getDaysSinceLastFertilizing(a.careLogs || [])
        const aFertFreq = calculateFertilizingFrequency(a.careLogs || []) || DEFAULT_INTERVALS.fertilize
        const aFertOverdue = (aFertDays === null ? 999 : aFertDays) - aFertFreq

        // Use the worst overdue status (watering or fertilizing)
        const aMaxOverdue = Math.max(aWaterOverdue, aFertOverdue)

        const bWaterDays = getDaysSinceLastWatering(b.careLogs || [])
        const bWaterFreq = calculateWateringFrequency(b.careLogs || []) || DEFAULT_INTERVALS.water
        const bWaterOverdue = (bWaterDays === null ? 999 : bWaterDays) - bWaterFreq

        const bFertDays = getDaysSinceLastFertilizing(b.careLogs || [])
        const bFertFreq = calculateFertilizingFrequency(b.careLogs || []) || DEFAULT_INTERVALS.fertilize
        const bFertOverdue = (bFertDays === null ? 999 : bFertDays) - bFertFreq

        const bMaxOverdue = Math.max(bWaterOverdue, bFertOverdue)

        // Sort by most overdue first (descending)
        return bMaxOverdue - aMaxOverdue
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
        a.download = `cladari-plants-${new Date().toISOString().split('T')[0]}.csv`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Plant Collection</span>
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600">Manage your {plants.length} anthurium specimens</p>
            {stalePlantCount > 0 && (
              <button
                onClick={() => setFilters({ ...filters, needsAttention: !filters.needsAttention })}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-all ${
                  filters.needsAttention
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
                title="Click to filter plants needing attention"
              >
                <AlertTriangle className="w-4 h-4" />
                {stalePlantCount} need attention
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="oldest">⚠️ Needs Attention (No Recent Activity)</option>
              <option value="newest">🕐 Recently Active</option>
              <option value="alphabetical">🔤 Alphabetical (A-Z)</option>
            </select>
            <button onClick={() => setFilterOpen(true)} className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 relative">
              <Filter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button onClick={handleExport} className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <Link
              href="/batch-care"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              Batch Care
            </Link>
            <button onClick={() => setCreateOpen(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Plant
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">Loading plants...</p>
            </div>
          ) : filteredPlants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">No plants found</p>
              <p className="text-sm">
                {searchTerm ? 'Try a different search' : 'Add your first plant to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlants.map((plant) => (
                <Link
                  href={`/plants/${plant.id}`}
                  key={plant.id}
                  onClick={() => {
                    // Save scroll position, filters, sort, and search before navigating
                    sessionStorage.setItem('plantsPageScroll', window.scrollY.toString())
                    sessionStorage.setItem('plantsPageFilters', JSON.stringify(filters))
                    sessionStorage.setItem('plantsPageSort', sortBy)
                    sessionStorage.setItem('plantsPageSearch', searchTerm)
                  }}
                  className="bg-white/50 rounded-2xl p-5 hover:bg-white/80 transition-all hover-lift cursor-pointer block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {plant.hybridName || plant.species || 'Unknown Species'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-12">
                        <p className="text-sm text-gray-600">{plant.plantId}</p>
                        {plant.breederCode && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {plant.breederCode}
                          </span>
                        )}
                        {isStale(plant) && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1" title="No activity (care, measurements, etc.) in 7+ days">
                            <AlertTriangle className="w-3 h-3" />
                            Stale
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {plant.crossNotation && (
                    <p className="text-xs text-gray-600 italic mb-1">{plant.crossNotation}</p>
                  )}

                  {plant.species && plant.species !== plant.hybridName && (
                    <p className="text-xs text-gray-500">{plant.species}</p>
                  )}

                  <div className="space-y-1 text-sm text-gray-600">
                    {plant.acquisitionCost && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${plant.acquisitionCost}</span>
                      </div>
                    )}
                    {plant.currentLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{plant.currentLocation.name}</span>
                      </div>
                    )}
                    {plant.accessionDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(plant.accessionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      plant.healthStatus === 'healthy'
                        ? 'bg-green-100 text-green-700'
                        : plant.healthStatus === 'struggling'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {plant.healthStatus || 'Unknown'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Plant">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Hybrid Name</label>
                <input value={createForm.hybridName} onChange={e=>setCreateForm({...createForm, hybridName: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200" placeholder="e.g., RA8 x RA5" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Species</label>
                <input value={createForm.species} onChange={e=>setCreateForm({...createForm, species: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200" placeholder="e.g., papillilaminum" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Species Complex</label>
                <input value={createForm.speciesComplex} onChange={e=>setCreateForm({...createForm, speciesComplex: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200" placeholder="e.g., Cardiolonchium" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Breeder Code</label>
                <input value={createForm.breederCode} onChange={e=>setCreateForm({...createForm, breederCode: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200" placeholder="e.g., RA8" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Acquisition Cost</label>
                <input type="number" value={createForm.acquisitionCost} onChange={e=>setCreateForm({...createForm, acquisitionCost: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200" placeholder="e.g., 250" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Accession Date</label>
                <input type="date" value={createForm.accessionDate} onChange={e=>setCreateForm({...createForm, accessionDate: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Cancel</button>
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
                    setCreateForm({ hybridName:'', species:'', speciesComplex:'', breederCode:'', acquisitionCost:'', accessionDate: new Date().toISOString().split('T')[0], healthStatus: 'healthy' })
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
              }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white">{creating ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>

        {/* Filter Modal */}
        <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Plants">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
              <select
                value={filters.healthStatus}
                onChange={(e) => setFilters({ ...filters, healthStatus: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All statuses</option>
                <option value="healthy">Healthy</option>
                <option value="recovering">Recovering</option>
                <option value="struggling">Struggling</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breeder Code</label>
              <select
                value={filters.breederCode}
                onChange={(e) => setFilters({ ...filters, breederCode: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.locationId}
                onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={filters.section}
                onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Droplets, Calendar, Save, X } from 'lucide-react'
import { showToast } from '@/components/toast'
import { getTodayString } from '@/lib/timezone'
import { DEFAULT_EC_INPUT, DEFAULT_PH_INPUT, DEFAULT_BASELINE_NOTES } from '@/lib/constants'

function BatchCareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [plants, setPlants] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [selectedPlants, setSelectedPlants] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('')

  const [feedProducts, setFeedProducts] = useState<any[]>([])
  const [careForm, setCareForm] = useState({
    activityType: 'watering',
    notes: '',
    dosage: '',
    inputEC: '',
    inputPH: '',
    outputEC: '',
    outputPH: '',
    rainAmount: '',
    rainDuration: '',
    date: '', // Set in useEffect to avoid hydration mismatch
    isBaselineFeed: false,
    // Component tracking
    useCaMg: false,
    caMgDose: '1',
    useTpsOne: false,
    tpsOneDose: '2',
    useSilica: false,
    silicaDose: '1'
  })

  useEffect(() => {
    // Set date on client only to avoid hydration mismatch
    setCareForm(f => ({ ...f, date: getTodayString() }))
    fetchPlants()
    fetchLocations()
    fetchFeedProducts()
  }, [])

  // Handle URL params from QR code scan (location pre-selection)
  useEffect(() => {
    const locationParam = searchParams.get('location')
    if (locationParam && locations.length > 0) {
      // Find location by name (case-insensitive)
      const location = locations.find(
        l => l.name.toLowerCase() === locationParam.toLowerCase()
      )
      if (location) {
        setSelectedLocationFilter(location.id)
        // Auto-select all plants in this location
        const plantsInLocation = plants.filter(p => p.locationId === location.id)
        setSelectedPlants(plantsInLocation.map(p => p.id))
      }
      // Clear the URL params
      router.replace('/batch-care', { scroll: false })
    }
  }, [searchParams, locations, plants, router])

  const fetchFeedProducts = async () => {
    try {
      const response = await fetch('/api/feed-products')
      const data = await response.json()
      if (Array.isArray(data)) {
        setFeedProducts(data)
      }
    } catch (error) {
      console.error('Error fetching feed products:', error)
    }
  }

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants')
      const data = await response.json()
      if (Array.isArray(data)) {
        setPlants(data)
      }
    } catch (error) {
      console.error('Error fetching plants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (Array.isArray(data)) {
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedPlants.length === filteredPlants.length) {
      setSelectedPlants([])
    } else {
      setSelectedPlants(filteredPlants.map(p => p.id))
    }
  }

  const handleSelectByLocation = (locationId: string) => {
    const plantsInLocation = filteredPlants.filter(p => p.locationId === locationId)
    const plantIds = plantsInLocation.map(p => p.id)

    // Toggle: if all plants from this location are already selected, deselect them
    const allSelected = plantIds.every(id => selectedPlants.includes(id))
    if (allSelected) {
      setSelectedPlants(selectedPlants.filter(id => !plantIds.includes(id)))
    } else {
      // Add all plants from this location (avoiding duplicates)
      const newSelection = [...new Set([...selectedPlants, ...plantIds])]
      setSelectedPlants(newSelection)
    }
  }

  const handleTogglePlant = (plantId: string) => {
    if (selectedPlants.includes(plantId)) {
      setSelectedPlants(selectedPlants.filter(id => id !== plantId))
    } else {
      setSelectedPlants([...selectedPlants, plantId])
    }
  }

  const handleSubmit = async () => {
    if (selectedPlants.length === 0) {
      showToast({ type: 'warning', title: 'No plants selected', message: 'Select at least one plant to proceed.' })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/batch-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantIds: selectedPlants,
          ...careForm
        })
      })

      if (response.ok) {
        showToast({ type: 'success', title: 'Batch care saved', message: `Added care logs to ${selectedPlants.length} plants.` })
        setSelectedPlants([])
        setCareForm({
          activityType: 'watering',
          notes: '',
          dosage: '',
          inputEC: '',
          inputPH: '',
          outputEC: '',
          outputPH: '',
          rainAmount: '',
          rainDuration: '',
          date: getTodayString(),
          isBaselineFeed: false,
          useCaMg: false,
          caMgDose: '1',
          useTpsOne: false,
          tpsOneDose: '2',
          useSilica: false,
          silicaDose: '1'
        })
      } else {
        showToast({ type: 'error', title: 'Failed to add care logs', message: 'Please try again.' })
      }
    } catch (error) {
      console.error('Error submitting batch care:', error)
      showToast({ type: 'error', title: 'Error submitting batch care' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPlants = plants.filter(plant => {
    const search = searchTerm.toLowerCase()
    return (
      plant.plantId?.toLowerCase().includes(search) ||
      plant.species?.toLowerCase().includes(search) ||
      plant.hybridName?.toLowerCase().includes(search) ||
      plant.breederCode?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/plants" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plants
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Batch Care Log</span>
          </h1>
          <p className="text-gray-600">Apply the same care action to multiple plants at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="glass rounded-3xl p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Care Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={careForm.date}
                    onChange={(e) => setCareForm({ ...careForm, date: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                  <select
                    value={careForm.activityType}
                    onChange={(e) => {
                      const newType = e.target.value
                      const updates: any = { activityType: newType }
                      // Clear baseline feed values when switching away from watering/fertilizing/calmag
                      if (newType !== 'watering' && newType !== 'fertilizing' && newType !== 'calmag') {
                        updates.isBaselineFeed = false
                        updates.inputPH = ''
                        updates.inputEC = ''
                        updates.outputPH = ''
                        updates.outputEC = ''
                        updates.useCaMg = false
                        updates.useTpsOne = false
                        updates.useSilica = false
                        updates.notes = ''
                      }
                      setCareForm({ ...careForm, ...updates })
                    }}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="watering">Watering</option>
                    <option value="rain">Rain</option>
                    <option value="fertilizing">Fertilizing</option>
                    <option value="repotting">Repotting</option>
                    <option value="pruning">Pruning</option>
                    <option value="pest_treatment">Pest Treatment</option>
                    <option value="fungicide">Fungicide Application</option>
                    <option value="calmag">CalMag Treatment</option>
                    <option value="foliar">Foliar Spray</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {careForm.activityType === 'rain' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rainfall Amount
                      </label>
                      <select
                        value={careForm.rainAmount}
                        onChange={(e) => setCareForm({ ...careForm, rainAmount: e.target.value })}
                        className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Select amount --</option>
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <select
                        value={careForm.rainDuration}
                        onChange={(e) => setCareForm({ ...careForm, rainDuration: e.target.value })}
                        className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Select duration --</option>
                        <option value="brief">Brief (&lt;15 min)</option>
                        <option value="short">Short (15-30 min)</option>
                        <option value="medium">Medium (30-60 min)</option>
                        <option value="long">Long (1-2 hrs)</option>
                        <option value="extended">Extended (2+ hrs)</option>
                      </select>
                    </div>
                  </>
                )}

                {(careForm.activityType === 'fertilizing' ||
                  careForm.activityType === 'calmag' ||
                  careForm.activityType === 'pest_treatment' ||
                  careForm.activityType === 'fungicide' ||
                  careForm.activityType === 'foliar') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage/Concentration
                    </label>
                    <input
                      type="text"
                      value={careForm.dosage}
                      onChange={(e) => setCareForm({ ...careForm, dosage: e.target.value })}
                      className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., 0.4 EC, 2ml/L, 1 tbsp/gal"
                    />
                  </div>
                )}

                {(careForm.activityType === 'watering' ||
                  careForm.activityType === 'fertilizing' ||
                  careForm.activityType === 'calmag') && (
                  <>
                    {/* Baseline Feed Toggle */}
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={careForm.isBaselineFeed}
                          onChange={(e) => {
                            const isBaseline = e.target.checked
                            setCareForm({
                              ...careForm,
                              isBaselineFeed: isBaseline,
                              inputEC: isBaseline ? String(DEFAULT_EC_INPUT) : '',
                              inputPH: isBaseline ? String(DEFAULT_PH_INPUT) : '',
                              useCaMg: isBaseline,
                              useTpsOne: isBaseline,
                              useSilica: false
                            })
                          }}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Baseline Feed</span>
                          <span className="text-xs text-gray-500 ml-2">({DEFAULT_BASELINE_NOTES} = pH {DEFAULT_PH_INPUT}, EC {DEFAULT_EC_INPUT})</span>
                        </div>
                      </label>
                    </div>

                    {/* Feed Components */}
                    {!careForm.isBaselineFeed && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Feed Components</label>
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                          {/* CaMg */}
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={careForm.useCaMg}
                              onChange={(e) => setCareForm({ ...careForm, useCaMg: e.target.checked })}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm flex-1">TPS CalMag</span>
                            {careForm.useCaMg && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={careForm.caMgDose}
                                  onChange={(e) => setCareForm({ ...careForm, caMgDose: e.target.value })}
                                  className="w-16 p-1 text-sm rounded border border-gray-200"
                                />
                                <span className="text-xs text-gray-500">ml/L</span>
                              </div>
                            )}
                          </div>
                          {/* TPS One */}
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={careForm.useTpsOne}
                              onChange={(e) => setCareForm({ ...careForm, useTpsOne: e.target.checked })}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm flex-1">TPS One (3-3-3)</span>
                            {careForm.useTpsOne && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={careForm.tpsOneDose}
                                  onChange={(e) => setCareForm({ ...careForm, tpsOneDose: e.target.value })}
                                  className="w-16 p-1 text-sm rounded border border-gray-200"
                                />
                                <span className="text-xs text-gray-500">ml/L</span>
                              </div>
                            )}
                          </div>
                          {/* Silica */}
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={careForm.useSilica}
                              onChange={(e) => setCareForm({ ...careForm, useSilica: e.target.checked })}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm flex-1">TPS Silica <span className="text-xs text-amber-600">(raises pH)</span></span>
                            {careForm.useSilica && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={careForm.silicaDose}
                                  onChange={(e) => setCareForm({ ...careForm, silicaDose: e.target.value })}
                                  className="w-16 p-1 text-sm rounded border border-gray-200"
                                />
                                <span className="text-xs text-gray-500">ml/L</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* pH/EC Measurements */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input pH</label>
                        <input
                          type="number"
                          step="0.1"
                          value={careForm.inputPH}
                          onChange={(e) => setCareForm({ ...careForm, inputPH: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g., 5.7"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input EC</label>
                        <input
                          type="number"
                          step="0.01"
                          value={careForm.inputEC}
                          onChange={(e) => setCareForm({ ...careForm, inputEC: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g., 1.15"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Output pH <span className="text-xs text-gray-400">(runoff)</span></label>
                        <input
                          type="number"
                          step="0.1"
                          value={careForm.outputPH}
                          onChange={(e) => setCareForm({ ...careForm, outputPH: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Output EC <span className="text-xs text-gray-400">(runoff)</span></label>
                        <input
                          type="number"
                          step="0.01"
                          value={careForm.outputEC}
                          onChange={(e) => setCareForm({ ...careForm, outputEC: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={careForm.notes}
                    onChange={(e) => setCareForm({ ...careForm, notes: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={4}
                    placeholder="e.g., CalMag buffering with pH up to 6.2"
                  />
                </div>

                <div className="pt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    Selected: {selectedPlants.length} plant{selectedPlants.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedPlants.length === 0}
                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save to Selected Plants'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Plant Selection Section */}
          <div className="lg:col-span-2">
            <div className="glass rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Select Plants</h2>
                <button
                  onClick={handleSelectAll}
                  className="text-sm px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  {selectedPlants.length === filteredPlants.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Location Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select by Location</label>
                <div className="flex gap-2">
                  <select
                    value={selectedLocationFilter}
                    onChange={(e) => setSelectedLocationFilter(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose location --</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({plants.filter(p => p.locationId === location.id).length} plants)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedLocationFilter) {
                        handleSelectByLocation(selectedLocationFilter)
                      }
                    }}
                    disabled={!selectedLocationFilter}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-4 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {loading ? (
                <div className="text-center py-8">Loading plants...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                  {filteredPlants.map((plant) => (
                    <div
                      key={plant.id}
                      onClick={() => handleTogglePlant(plant.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPlants.includes(plant.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white/50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">
                            {plant.hybridName || plant.species || plant.plantId}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {plant.plantId}
                            {plant.breederCode && (
                              <span className="ml-2 text-purple-600">{plant.breederCode}</span>
                            )}
                          </div>
                          {plant.currentLocation?.name && (
                            <div className="text-xs text-gray-500 mt-1">
                              📍 {plant.currentLocation.name}
                            </div>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedPlants.includes(plant.id)
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedPlants.includes(plant.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BatchCarePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading...</p>
      </div>
    }>
      <BatchCareContent />
    </Suspense>
  )
}

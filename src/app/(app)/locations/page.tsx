'use client'

import { useEffect, useState } from 'react'
import { MapPin, Plus, Edit, Trash2, QrCode, Radio, Printer, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any>(null)
  const [sensors, setSensors] = useState<any[]>([])
  const [loadingSensors, setLoadingSensors] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedSensorId, setSelectedSensorId] = useState<string>('')

  const [locationForm, setLocationForm] = useState({
    name: '',
    type: 'greenhouse',
    zone: '',
    shelf: '',
    position: '',
    lightLevel: '',
    humidity: '',
    temperature: '',
    dli: '',
    vpd: '',
    pressure: '',
    co2: '',
    growLights: '',
    photoperiod: '',
    airflow: '',
    fanSpeed: '',
    capacity: '',
    notes: ''
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSensors = async (forLocationName?: string) => {
    setLoadingSensors(true)
    try {
      const response = await fetch('/api/sensorpush/sensors')
      if (response.ok) {
        const data = await response.json()
        const sensorList = data.sensors || []
        setSensors(sensorList)

        // Validate selectedSensorId — if the sensor is linked to a DIFFERENT location,
        // it means the DB is stale (sensor was moved without auto-unlink).
        // Auto-correct both the UI state and the DB.
        if (selectedSensorId && forLocationName) {
          const matchedSensor = sensorList.find((s: any) => s.id === selectedSensorId)
          if (!matchedSensor || (matchedSensor.linkedTo && matchedSensor.linkedTo !== forLocationName)) {
            setSelectedSensorId('')
            // Also clean up the stale DB mapping
            if (editingLocation?.id) {
              fetch('/api/sensorpush/sync', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locationId: editingLocation.id })
              }).then(() => fetchLocations()).catch(() => {})
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sensors:', error)
    } finally {
      setLoadingSensors(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sensorpush/sync')
      const data = await response.json()
      if (response.ok) {
        const updatedCount = data.updates?.filter((u: any) => u.updated).length || 0
        const failedNames = data.updates?.filter((u: any) => !u.updated).map((u: any) => u.locationName) || []
        const unmappedCount = data.unmappedSensors?.length || 0
        let msg = `Synced ${updatedCount} sensor${updatedCount !== 1 ? 's' : ''}`
        if (failedNames.length > 0) msg += ` (no reading: ${failedNames.join(', ')})`
        if (unmappedCount > 0) msg += ` · ${unmappedCount} unmapped`
        showToast({ type: updatedCount > 0 ? 'success' : 'warning', title: msg })
        await fetchLocations()
      } else {
        showToast({ type: 'error', title: data.error || 'Sync failed' })
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Sync failed — check SensorPush credentials' })
    } finally {
      setSyncing(false)
    }
  }

  const handleSensorChange = async (locationId: string, newSensorId: string) => {
    try {
      if (newSensorId === '') {
        // Unlink sensor
        const response = await fetch('/api/sensorpush/sync', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId })
        })
        if (response.ok) {
          showToast({ type: 'success', title: 'Sensor unlinked' })
          setSelectedSensorId('')
          // Update editingLocation to reflect change
          setEditingLocation((prev: any) => prev ? { ...prev, sensorPushId: null } : null)
        } else {
          const data = await response.json()
          showToast({ type: 'error', title: data.error || 'Failed to unlink sensor' })
        }
      } else {
        // Link sensor
        const response = await fetch('/api/sensorpush/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId, sensorPushId: newSensorId })
        })
        if (response.ok) {
          showToast({ type: 'success', title: 'Sensor linked' })
          setSelectedSensorId(newSensorId)
          setEditingLocation((prev: any) => prev ? { ...prev, sensorPushId: newSensorId } : null)
        } else {
          const data = await response.json()
          showToast({ type: 'error', title: data.error || 'Failed to link sensor' })
        }
      }
      await fetchLocations()
    } catch (error) {
      showToast({ type: 'error', title: 'Error updating sensor' })
    }
  }

  const handleSaveLocation = async () => {
    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations'

      const method = editingLocation ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...locationForm,
          humidity: locationForm.humidity ? parseFloat(locationForm.humidity) : null,
          temperature: locationForm.temperature ? parseFloat(locationForm.temperature) : null,
          dli: locationForm.dli ? parseFloat(locationForm.dli) : null,
          vpd: locationForm.vpd ? parseFloat(locationForm.vpd) : null,
          pressure: locationForm.pressure ? parseFloat(locationForm.pressure) : null,
          co2: locationForm.co2 ? parseFloat(locationForm.co2) : null,
          capacity: locationForm.capacity ? parseInt(locationForm.capacity) : null
        })
      })

      if (response.ok) {
        await fetchLocations()
        setModalOpen(false)
        setEditingLocation(null)
        resetForm()
        showToast({
          type: 'success',
          title: editingLocation ? 'Location updated' : 'Location created'
        })
      } else {
        const data = await response.json().catch(() => ({}))
        showToast({ type: 'error', title: data.error || 'Failed to save location' })
      }
    } catch (error) {
      console.error('Error saving location:', error)
      showToast({ type: 'error', title: 'Error saving location' })
    }
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchLocations()
        showToast({ type: 'success', title: 'Location deleted' })
      } else {
        const error = await response.json()
        showToast({ type: 'error', title: error.error || 'Failed to delete location' })
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      showToast({ type: 'error', title: 'Error deleting location' })
    }
  }

  const openEditModal = (location: any) => {
    setEditingLocation(location)
    setSelectedSensorId(location.sensorPushId || '')
    setLocationForm({
      name: location.name || '',
      type: location.type || 'greenhouse',
      zone: location.zone || '',
      shelf: location.shelf || '',
      position: location.position || '',
      lightLevel: location.lightLevel || '',
      humidity: location.humidity?.toString() || '',
      temperature: location.temperature?.toString() || '',
      dli: location.dli?.toString() || '',
      vpd: location.vpd?.toString() || '',
      pressure: location.pressure?.toString() || '',
      co2: location.co2?.toString() || '',
      growLights: location.growLights || '',
      photoperiod: location.photoperiod || '',
      airflow: location.airflow || '',
      fanSpeed: location.fanSpeed || '',
      capacity: location.capacity?.toString() || '',
      notes: location.notes || ''
    })
    fetchSensors(location.name)
    setModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingLocation(null)
    resetForm()
    setModalOpen(true)
  }

  const resetForm = () => {
    setLocationForm({
      name: '',
      type: 'greenhouse',
      zone: '',
      shelf: '',
      position: '',
      lightLevel: '',
      humidity: '',
      temperature: '',
      dli: '',
      vpd: '',
      pressure: '',
      co2: '',
      growLights: '',
      photoperiod: '',
      airflow: '',
      fanSpeed: '',
      capacity: '',
      notes: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading locations...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--forest)]">Locations</h1>
            <p className="text-sm text-[var(--clay)]">{locations.length} growing environments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 text-sm rounded hover:bg-emerald-50 disabled:opacity-50"
              title="Sync all SensorPush sensors now"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--forest)] text-white text-sm rounded"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          </div>
        </div>

        {/* Locations Grid */}
        {locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div key={location.id} className="bg-white border border-black/[0.08] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[var(--forest)]">{location.name}</h3>
                      {location.sensorPushId && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded" title="SensorPush linked">
                          <Radio className="w-3 h-3" />
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--clay)] capitalize">{location.type}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/print/zebra', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'location', name: location.name })
                          })
                          const data = await res.json()
                          if (res.ok) {
                            showToast({ type: 'success', title: `Label printed (${data.jobId})` })
                          } else {
                            showToast({ type: 'error', title: data.error || 'Print failed' })
                          }
                        } catch (err) {
                          showToast({ type: 'error', title: 'Print failed' })
                        }
                      }}
                      className="p-1.5 hover:bg-black/[0.04] rounded"
                      title="Print Label (Zebra)"
                    >
                      <Printer className="w-4 h-4 text-[var(--clay)]" />
                    </button>
                    <button
                      onClick={() => openEditModal(location)}
                      className="p-1.5 hover:bg-black/[0.04] rounded"
                      title="Edit Location"
                    >
                      <Edit className="w-4 h-4 text-[var(--clay)]" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="p-1.5 hover:bg-[var(--alert-red)]/10 rounded"
                      title="Delete Location"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--alert-red)]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {location.zone && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clay)]">Zone</span>
                      <span className="text-[var(--bark)]">{location.zone}</span>
                    </div>
                  )}
                  {location.humidity && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clay)]">RH</span>
                      <span className={location.sensorPushId ? "text-emerald-600 font-medium" : "text-[var(--bark)]"}>
                        {location.humidity.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {location.temperature && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clay)]">Temp</span>
                      <span className={location.sensorPushId ? "text-emerald-600 font-medium" : "text-[var(--bark)]"}>
                        {location.temperature.toFixed(1)}°F
                      </span>
                    </div>
                  )}
                  {location.dli && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clay)]">DLI</span>
                      <span className="text-[var(--bark)]">{location.dli}</span>
                    </div>
                  )}
                  {location.vpd && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clay)]">VPD</span>
                      <span className={location.sensorPushId ? "text-emerald-600 font-medium" : "text-[var(--bark)]"}>
                        {location.vpd.toFixed(2)} kPa
                      </span>
                    </div>
                  )}
                  {location.photoperiod && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clay)]">Light</span>
                      <span className="text-[var(--bark)]">{location.photoperiod}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-black/[0.04]">
                    <span className="text-[var(--clay)]">Plants</span>
                    <span className="font-medium text-[var(--forest)]">
                      {location._count?.plants || 0}
                      {location.capacity && ` / ${location.capacity}`}
                    </span>
                  </div>
                </div>

                {location.lastSensorSync && (
                  <p className="text-[10px] text-emerald-600 mt-2">
                    Synced: {new Date(location.lastSensorSync).toLocaleString()}
                  </p>
                )}

                {location.notes && (
                  <p className="text-xs text-[var(--clay)] mt-3 pt-3 border-t border-black/[0.04]">
                    {location.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-[var(--clay)] mx-auto mb-3" />
            <p className="text-[var(--bark)] mb-1">No locations yet</p>
            <p className="text-sm text-[var(--clay)] mb-4">Add your first growing environment</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[var(--forest)] text-white text-sm rounded"
            >
              Add Location
            </button>
          </div>
        )}
      </div>

      {/* Location Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingLocation(null)
          resetForm()
        }}
        title={editingLocation ? 'Edit Location' : 'Add Location'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Name *</label>
            <input
              type="text"
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
              placeholder="e.g., Greenhouse A"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Type</label>
            <select
              value={locationForm.type}
              onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
            >
              <option value="greenhouse">Greenhouse</option>
              <option value="tent">Growth Tent</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Zone</label>
              <input
                type="text"
                value={locationForm.zone}
                onChange={(e) => setLocationForm({ ...locationForm, zone: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm"
                placeholder="A1"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Shelf</label>
              <input
                type="text"
                value={locationForm.shelf}
                onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm"
                placeholder="Top"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Position</label>
              <input
                type="text"
                value={locationForm.position}
                onChange={(e) => setLocationForm({ ...locationForm, position: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm"
                placeholder="Left"
              />
            </div>
          </div>

          {editingLocation && (
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  SensorPush Sensor
                </span>
              </label>
              {loadingSensors ? (
                <p className="text-xs text-[var(--clay)] p-2">Loading sensors...</p>
              ) : sensors.length > 0 ? (
                <>
                  <select
                    value={selectedSensorId}
                    onChange={(e) => handleSensorChange(editingLocation.id, e.target.value)}
                    className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="">No sensor linked</option>
                    {sensors.map((sensor: any) => {
                      const isLinkedElsewhere = sensor.linkedTo && sensor.linkedTo !== editingLocation.name
                      return (
                        <option key={sensor.id} value={sensor.id} disabled={!!isLinkedElsewhere}>
                          {sensor.name}
                          {isLinkedElsewhere ? ` (linked to ${sensor.linkedTo})` : ''}
                          {sensor.latestReading ? ` — ${sensor.latestReading.temperatureF?.toFixed(1)}°F, ${sensor.latestReading.humidity?.toFixed(0)}% RH` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {selectedSensorId && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Temp, Humidity, and VPD will auto-sync from this sensor
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-[var(--clay)] p-2">No SensorPush sensors found in account</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">
                Humidity %
                {selectedSensorId && <span className="text-emerald-600 text-xs ml-1">(auto)</span>}
              </label>
              <input
                type="number"
                value={locationForm.humidity}
                onChange={(e) => setLocationForm({ ...locationForm, humidity: e.target.value })}
                disabled={!!selectedSensorId}
                className={`w-full p-2 rounded border text-sm ${
                  selectedSensorId
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    : 'border-black/[0.08]'
                }`}
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">
                Temp °F
                {selectedSensorId && <span className="text-emerald-600 text-xs ml-1">(auto)</span>}
              </label>
              <input
                type="number"
                step="0.1"
                value={locationForm.temperature}
                onChange={(e) => setLocationForm({ ...locationForm, temperature: e.target.value })}
                disabled={!!selectedSensorId}
                className={`w-full p-2 rounded border text-sm ${
                  selectedSensorId
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    : 'border-black/[0.08]'
                }`}
                placeholder="72"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">DLI</label>
              <input
                type="number"
                step="0.1"
                value={locationForm.dli}
                onChange={(e) => setLocationForm({ ...locationForm, dli: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">
                VPD kPa
                {selectedSensorId && <span className="text-emerald-600 text-xs ml-1">(auto)</span>}
              </label>
              <input
                type="number"
                step="0.1"
                value={locationForm.vpd}
                onChange={(e) => setLocationForm({ ...locationForm, vpd: e.target.value })}
                disabled={!!selectedSensorId}
                className={`w-full p-2 rounded border text-sm ${
                  selectedSensorId
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    : 'border-black/[0.08]'
                }`}
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">CO2 ppm</label>
              <input
                type="number"
                value={locationForm.co2}
                onChange={(e) => setLocationForm({ ...locationForm, co2: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm"
                placeholder="400"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--bark)] mb-1">Photoperiod</label>
              <input
                type="text"
                value={locationForm.photoperiod}
                onChange={(e) => setLocationForm({ ...locationForm, photoperiod: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] text-sm"
                placeholder="16/8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Capacity</label>
            <input
              type="number"
              value={locationForm.capacity}
              onChange={(e) => setLocationForm({ ...locationForm, capacity: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm"
              placeholder="20"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={locationForm.notes}
              onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveLocation}
              className="flex-1 px-4 py-2 bg-[var(--forest)] text-white text-sm rounded"
            >
              {editingLocation ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setModalOpen(false)
                setEditingLocation(null)
                resetForm()
              }}
              className="flex-1 px-4 py-2 border border-black/[0.08] text-sm rounded text-[var(--bark)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

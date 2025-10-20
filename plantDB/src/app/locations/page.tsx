'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any>(null)

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
        showToast({ type: 'error', title: 'Failed to save location' })
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'greenhouse':
        return '🏡'
      case 'tent':
        return '⛺'
      case 'indoor':
        return '🏠'
      case 'outdoor':
        return '🌳'
      default:
        return '📍'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading locations...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/plants" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plants
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">Locations</span>
              </h1>
              <p className="text-gray-600">Manage your growing environments</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div key={location.id} className="glass rounded-3xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTypeIcon(location.type)}</span>
                  <div>
                    <h3 className="text-xl font-bold">{location.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{location.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(location)}
                    className="p-2 hover:bg-white/50 rounded-lg"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {location.zone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Zone:</span>
                    <span>{location.zone}</span>
                  </div>
                )}
                {location.lightLevel && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Light:</span>
                    <span className="capitalize">{location.lightLevel.replace('_', ' ')}</span>
                  </div>
                )}
                {location.humidity && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">RH:</span>
                    <span>{location.humidity}%</span>
                  </div>
                )}
                {location.temperature && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Temp:</span>
                    <span>{location.temperature}°C</span>
                  </div>
                )}
                {location.dli && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">DLI:</span>
                    <span>{location.dli} mol/m²/day</span>
                  </div>
                )}
                {location.vpd && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">VPD:</span>
                    <span>{location.vpd} kPa</span>
                  </div>
                )}
                {location.co2 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">CO₂:</span>
                    <span>{location.co2} ppm</span>
                  </div>
                )}
                {location.photoperiod && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Light schedule:</span>
                    <span>{location.photoperiod}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Plants:</span>
                  <span>{location._count?.plants || 0} {location.capacity ? `/ ${location.capacity}` : ''}</span>
                </div>
              </div>

              {location.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{location.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No locations yet</p>
            <p className="text-gray-500 mb-6">Start by adding your first growing environment</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Location
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
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
            <input
              type="text"
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Greenhouse A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={locationForm.type}
              onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="greenhouse">Greenhouse</option>
              <option value="tent">Growth Tent</option>
              <option value="indoor">Indoor Cabinet/Room</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input
                type="text"
                value={locationForm.zone}
                onChange={(e) => setLocationForm({ ...locationForm, zone: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf</label>
              <input
                type="text"
                value={locationForm.shelf}
                onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Top"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                value={locationForm.position}
                onChange={(e) => setLocationForm({ ...locationForm, position: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Left"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Light Level</label>
            <select
              value={locationForm.lightLevel}
              onChange={(e) => setLocationForm({ ...locationForm, lightLevel: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select light level...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High (bright indirect)</option>
              <option value="grow_light">Grow Light</option>
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Basic Environmental Conditions</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (RH %)</label>
                <input
                  type="number"
                  step="1"
                  value={locationForm.humidity}
                  onChange={(e) => setLocationForm({ ...locationForm, humidity: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={locationForm.temperature}
                  onChange={(e) => setLocationForm({ ...locationForm, temperature: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="22"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Advanced Metrics (Optional)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DLI (mol/m²/day)
                  <span className="text-xs text-gray-500 ml-1">10-20 typical</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={locationForm.dli}
                  onChange={(e) => setLocationForm({ ...locationForm, dli: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VPD (kPa)
                  <span className="text-xs text-gray-500 ml-1">0.8-1.2 optimal</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={locationForm.vpd}
                  onChange={(e) => setLocationForm({ ...locationForm, vpd: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="1.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pressure (hPa/mbar)</label>
                <input
                  type="number"
                  step="0.1"
                  value={locationForm.pressure}
                  onChange={(e) => setLocationForm({ ...locationForm, pressure: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="1013"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CO₂ (ppm)
                  <span className="text-xs text-gray-500 ml-1">~400 ambient</span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={locationForm.co2}
                  onChange={(e) => setLocationForm({ ...locationForm, co2: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="400"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Lighting Setup (Optional)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photoperiod</label>
                <input
                  type="text"
                  value={locationForm.photoperiod}
                  onChange={(e) => setLocationForm({ ...locationForm, photoperiod: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="16/8 or 12/12"
                />
                <p className="text-xs text-gray-500 mt-1">On/Off hours (e.g., 16/8)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airflow</label>
                <select
                  value={locationForm.airflow}
                  onChange={(e) => setLocationForm({ ...locationForm, airflow: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select airflow...</option>
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="automated">Automated</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Grow Lights Info</label>
              <textarea
                value={locationForm.growLights}
                onChange={(e) => setLocationForm({ ...locationForm, growLights: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="e.g., 2x LED grow lights, 150W each, full spectrum, 12 inches above plants"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fan Speed</label>
              <input
                type="text"
                value={locationForm.fanSpeed}
                onChange={(e) => setLocationForm({ ...locationForm, fanSpeed: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 200 CFM or 50%"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (plants)</label>
              <input
                type="number"
                value={locationForm.capacity}
                onChange={(e) => setLocationForm({ ...locationForm, capacity: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={locationForm.notes}
              onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Additional notes about this location..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveLocation}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700"
            >
              {editingLocation ? 'Update Location' : 'Create Location'}
            </button>
            <button
              onClick={() => {
                setModalOpen(false)
                setEditingLocation(null)
                resetForm()
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

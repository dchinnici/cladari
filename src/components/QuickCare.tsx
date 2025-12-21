'use client'

import { useState } from 'react'
import { Modal } from './modal'
import { showToast } from './toast'
import { Droplets } from 'lucide-react'
import { getTodayString } from '@/lib/timezone'
import { WATERING_THRESHOLD_DAYS, DEFAULT_EC_INPUT, DEFAULT_PH_INPUT } from '@/lib/constants'

interface QuickCareProps {
  isOpen: boolean
  onClose: () => void
  plants: any[]
  onSuccess: () => void
}

export default function QuickCare({ isOpen, onClose, plants, onSuccess }: QuickCareProps) {
  const [selectedPlants, setSelectedPlants] = useState<string[]>([])
  const [activityType, setActivityType] = useState('water')
  const [includeBaseline, setIncludeBaseline] = useState(false)
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter plants needing attention first
  const plantsNeedingWater = plants.filter(p => {
    const lastWater = p.careLogs?.find((log: any) => {
      const action = (log.action || '').toLowerCase()
      return action.includes('water') || action.includes('fertil')
    })
    if (!lastWater) return true
    const daysSince = Math.floor((Date.now() - new Date(lastWater.date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= WATERING_THRESHOLD_DAYS
  }).sort((a, b) => (a.hybridName || a.species || a.plantId)?.localeCompare(b.hybridName || b.species || b.plantId))

  const filteredPlants = searchTerm
    ? plants.filter(p =>
        (p.hybridName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.species || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.plantId || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : plantsNeedingWater.length > 0 ? plantsNeedingWater : plants

  const handleSave = async () => {
    if (selectedPlants.length === 0) {
      showToast({ type: 'error', title: 'Select at least one plant' })
      return
    }

    setSaving(true)
    try {
      const careData = {
        plantIds: selectedPlants,
        activityType,
        date: getTodayString(),
        notes,
        ...(includeBaseline && {
          ecIn: DEFAULT_EC_INPUT,
          ecOut: null,
          phIn: DEFAULT_PH_INPUT,
          phOut: null,
        })
      }

      const response = await fetch('/api/batch-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(careData)
      })

      if (!response.ok) throw new Error('Failed to save')

      showToast({ type: 'success', title: `Logged ${activityType} for ${selectedPlants.length} plants` })
      onSuccess()
      onClose()

      // Reset form
      setSelectedPlants([])
      setNotes('')
      setSearchTerm('')
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to save care logs' })
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedPlants(filteredPlants.map(p => p.id))
  }

  const handleClearAll = () => {
    setSelectedPlants([])
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Care Log"
    >
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search plants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-black/[0.08] rounded text-sm focus:outline-none focus:border-[var(--moss)]"
          autoFocus
        />

        {/* Selection controls */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={handleSelectAll}
            className="px-2 py-1 bg-[var(--parchment)] text-[var(--bark)] rounded hover:bg-[var(--sage)]/20"
          >
            Select All ({filteredPlants.length})
          </button>
          <button
            onClick={handleClearAll}
            className="px-2 py-1 bg-[var(--parchment)] text-[var(--bark)] rounded hover:bg-[var(--sage)]/20"
          >
            Clear
          </button>
        </div>

        {/* Plant Selection Grid */}
        <div className="max-h-64 overflow-y-auto border border-black/[0.08] rounded p-2">
          <div className="grid grid-cols-1 gap-1">
            {filteredPlants.slice(0, 30).map((plant) => (
              <label
                key={plant.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedPlants.includes(plant.id)
                    ? 'bg-[var(--moss)]/20 border-[var(--moss)]'
                    : 'bg-white hover:bg-[var(--parchment)]'
                } border border-black/[0.08]`}
              >
                <input
                  type="checkbox"
                  checked={selectedPlants.includes(plant.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlants([...selectedPlants, plant.id])
                    } else {
                      setSelectedPlants(selectedPlants.filter(id => id !== plant.id))
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1 text-sm">
                  <span className="text-[var(--bark)] font-medium">
                    {plant.hybridName || plant.species || plant.plantId}
                  </span>
                  <span className="text-xs text-[var(--clay)] ml-2 font-mono">{plant.plantId}</span>
                </div>
              </label>
            ))}
          </div>
          {filteredPlants.length > 30 && (
            <p className="text-xs text-[var(--clay)] mt-2 text-center">
              Showing first 30 plants. Use search to find specific plants.
            </p>
          )}
        </div>

        {/* Selected count */}
        <div className="text-sm text-[var(--bark)]">
          {selectedPlants.length} plant{selectedPlants.length !== 1 ? 's' : ''} selected
        </div>

        {/* Activity Type */}
        <div className="flex flex-wrap gap-2">
          {['water', 'fertilize', 'repot', 'prune'].map(type => (
            <button
              key={type}
              onClick={() => setActivityType(type)}
              className={`px-3 py-2 rounded capitalize text-sm transition-colors ${
                activityType === type
                  ? 'bg-[var(--forest)] text-white'
                  : 'bg-[var(--parchment)] text-[var(--bark)] hover:bg-[var(--sage)]/30'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Baseline Feed Checkbox */}
        {(activityType === 'water' || activityType === 'fertilize') && (
          <label className="flex items-center gap-2 p-3 bg-[var(--water-blue)]/10 rounded cursor-pointer border border-[var(--water-blue)]/20">
            <input
              type="checkbox"
              checked={includeBaseline}
              onChange={(e) => setIncludeBaseline(e.target.checked)}
              className="rounded"
            />
            <div>
              <span className="font-medium text-sm text-[var(--bark)]">Include baseline feed</span>
              <span className="text-xs text-[var(--clay)] ml-2">(pH 5.7, EC 1.15)</span>
            </div>
          </label>
        )}

        {/* Notes */}
        <textarea
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-black/[0.08] rounded text-sm h-20 focus:outline-none focus:border-[var(--moss)]"
        />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || selectedPlants.length === 0}
            className="flex-1 px-4 py-2 bg-[var(--forest)] text-white text-sm rounded disabled:opacity-50"
          >
            {saving ? 'Saving...' : `Log Care (${selectedPlants.length})`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-black/[0.08] text-sm rounded text-[var(--bark)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from './modal'
import { showToast } from './toast'
import { Droplets, Leaf, Zap, Command } from 'lucide-react'

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
    const lastWater = p.careLogs?.find((log: any) =>
      ['water', 'watering'].includes(log.action.toLowerCase())
    )
    if (!lastWater) return true
    const daysSince = Math.floor((Date.now() - new Date(lastWater.date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= 5 // Show plants not watered in 5+ days
  }).sort((a, b) => a.hybridName?.localeCompare(b.hybridName))

  const filteredPlants = searchTerm
    ? plants.filter(p =>
        p.hybridName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.plantId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : plantsNeedingWater.length > 0 ? plantsNeedingWater : plants

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys to quick-select first 9 plants
      if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey) {
        const index = parseInt(e.key) - 1
        if (filteredPlants[index]) {
          const plantId = filteredPlants[index].id
          setSelectedPlants(prev =>
            prev.includes(plantId)
              ? prev.filter(id => id !== plantId)
              : [...prev, plantId]
          )
        }
      }

      // Cmd/Ctrl + A to select all visible
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedPlants(filteredPlants.map(p => p.id))
      }

      // W for water, F for fertilize
      if (e.key === 'w' && !e.metaKey) {
        setActivityType('water')
      }
      if (e.key === 'f' && !e.metaKey) {
        setActivityType('fertilize')
      }

      // B for baseline toggle
      if (e.key === 'b' && !e.metaKey) {
        setIncludeBaseline(prev => !prev)
      }

      // Enter to save
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredPlants, selectedPlants])

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
        date: new Date().toISOString().split('T')[0] + 'T12:00:00',
        notes,
        ...(includeBaseline && {
          ecIn: 1.1,
          ecOut: null,
          phIn: 5.9,
          phOut: null,
        })
      }

      const response = await fetch('/api/batch-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(careData)
      })

      if (!response.ok) throw new Error('Failed to save')

      showToast({ type: 'success', title: `✓ Logged ${activityType} for ${selectedPlants.length} plants` })
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

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Care Log
          <span className="text-xs text-gray-500 ml-2">
            Press 1-9 to select, W/F for activity, B for baseline
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search plants... (or use number keys 1-9)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg"
          autoFocus
        />

        {/* Plant Selection Grid */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
          <div className="grid grid-cols-2 gap-2">
            {filteredPlants.slice(0, 20).map((plant, index) => (
              <label
                key={plant.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedPlants.includes(plant.id)
                    ? 'bg-green-100 border-green-500'
                    : 'bg-white hover:bg-gray-50'
                } border`}
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
                  <span className="font-mono text-xs text-gray-500 mr-1">
                    {index < 9 ? `[${index + 1}]` : ''}
                  </span>
                  {plant.hybridName || plant.species || plant.plantId}
                  {plant.needsWater && (
                    <Droplets className="inline ml-1 h-3 w-3 text-blue-500" />
                  )}
                </div>
              </label>
            ))}
          </div>
          {filteredPlants.length > 20 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Showing first 20 plants. Use search to find specific plants.
            </p>
          )}
        </div>

        {/* Selected count */}
        <div className="text-sm text-gray-600">
          {selectedPlants.length} plant{selectedPlants.length !== 1 ? 's' : ''} selected
        </div>

        {/* Activity Type */}
        <div className="flex gap-2">
          {['water', 'fertilize', 'repot', 'prune'].map(type => (
            <button
              key={type}
              onClick={() => setActivityType(type)}
              className={`px-3 py-2 rounded-lg capitalize transition-colors ${
                activityType === type
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {type === 'water' && <span className="text-xs mr-1">[W]</span>}
              {type === 'fertilize' && <span className="text-xs mr-1">[F]</span>}
              {type}
            </button>
          ))}
        </div>

        {/* Baseline Feed Checkbox */}
        {(activityType === 'water' || activityType === 'fertilize') && (
          <label className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={includeBaseline}
              onChange={(e) => setIncludeBaseline(e.target.checked)}
              className="rounded"
            />
            <div>
              <span className="font-medium">Include baseline feed <span className="text-xs">[B]</span></span>
              <span className="text-sm text-gray-600 ml-2">(pH 5.9, EC 1.1)</span>
            </div>
          </label>
        )}

        {/* Notes */}
        <textarea
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg h-20"
        />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>Cmd+Enter to save</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedPlants.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : `Log Care (${selectedPlants.length})`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
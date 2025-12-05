'use client'

import { useEffect, useState } from 'react'
import { Plus, Package, Scissors, FlaskConical, TreeDeciduous, Sprout, X } from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'

interface CloneBatch {
  id: string
  batchId: string
  propagationType: string
  sourcePlant: { plantId: string; hybridName: string | null; species: string | null } | null
  externalSource: string | null
  species: string | null
  cultivarName: string | null
  acquiredDate: string
  acquiredCount: number
  currentCount: number | null
  containerCount: number
  containerType: string | null
  status: string
  location: { name: string } | null
  identifier: string | null
  notes: string | null
  _count: { plants: number }
}

interface Plant {
  id: string
  plantId: string
  hybridName: string | null
  species: string | null
}

function getPropagationIcon(type: string) {
  switch (type) {
    case 'TC': return <FlaskConical size={16} />
    case 'CUTTING': return <Scissors size={16} />
    case 'DIVISION': return <TreeDeciduous size={16} />
    case 'OFFSET': return <Sprout size={16} />
    default: return <Package size={16} />
  }
}

function getPropagationColor(type: string): string {
  switch (type) {
    case 'TC': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'CUTTING': return 'bg-green-100 text-green-700 border-green-200'
    case 'DIVISION': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'OFFSET': return 'bg-amber-100 text-amber-700 border-amber-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'GROWING': return 'bg-lime-100 text-lime-700'
    case 'SEPARATING': return 'bg-sky-100 text-sky-700'
    case 'COMPLETE': return 'bg-violet-100 text-violet-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<CloneBatch[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState({
    propagationType: 'TC',
    sourcePlantId: '',
    externalSource: '',
    species: '',
    cultivarName: '',
    acquiredDate: new Date().toISOString().split('T')[0],
    acquiredCount: '1',
    containerCount: '1',
    containerType: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [batchRes, plantRes] = await Promise.all([
        fetch('/api/clone-batches'),
        fetch('/api/plants?limit=500')
      ])
      if (batchRes.ok) setBatches(await batchRes.json())
      if (plantRes.ok) {
        const data = await plantRes.json()
        setPlants(data.plants || data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      const response = await fetch('/api/clone-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propagationType: form.propagationType,
          sourcePlantId: form.sourcePlantId || null,
          externalSource: form.externalSource || null,
          species: form.species || null,
          cultivarName: form.cultivarName || null,
          acquiredDate: form.acquiredDate,
          acquiredCount: parseInt(form.acquiredCount) || 1,
          containerCount: parseInt(form.containerCount) || 1,
          containerType: form.containerType || null,
          notes: form.notes || null
        })
      })

      if (response.ok) {
        await fetchData()
        setModalOpen(false)
        resetForm()
        showToast({ type: 'success', title: 'Clone batch created' })
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to create batch' })
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      showToast({ type: 'error', title: 'Error creating batch' })
    }
  }

  function resetForm() {
    setForm({
      propagationType: 'TC',
      sourcePlantId: '',
      externalSource: '',
      species: '',
      cultivarName: '',
      acquiredDate: new Date().toISOString().split('T')[0],
      acquiredCount: '1',
      containerCount: '1',
      containerType: '',
      notes: ''
    })
  }

  function getBatchName(batch: CloneBatch): string {
    if (batch.cultivarName) return batch.cultivarName
    if (batch.species) return batch.species
    if (batch.sourcePlant) {
      return batch.sourcePlant.hybridName || batch.sourcePlant.species || batch.sourcePlant.plantId
    }
    if (batch.externalSource) return batch.externalSource
    return batch.batchId
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading batches...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clone Batches</h1>
          <p className="text-sm text-gray-500 mt-1">
            TC packs, cuttings, divisions, and offsets
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          New Batch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{batches.length}</div>
          <div className="text-sm text-gray-500">Total Batches</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-purple-600">
            {batches.filter(b => b.propagationType === 'TC').length}
          </div>
          <div className="text-sm text-gray-500">TC Batches</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">
            {batches.filter(b => b.propagationType === 'DIVISION').length}
          </div>
          <div className="text-sm text-gray-500">Divisions</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">
            {batches.reduce((sum, b) => sum + (b.currentCount || b.acquiredCount), 0)}
          </div>
          <div className="text-sm text-gray-500">Total Plants</div>
        </div>
      </div>

      {/* Batch List */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clone batches yet</h3>
          <p className="text-gray-500 mb-6">
            Track your TC packs, cuttings, divisions, and offsets
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create First Batch
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map(batch => (
            <div
              key={batch.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getPropagationColor(batch.propagationType)}`}>
                    {getPropagationIcon(batch.propagationType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{getBatchName(batch)}</span>
                      <span className="text-sm text-gray-400">{batch.batchId}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {batch.propagationType}
                      {batch.sourcePlant && ` from ${batch.sourcePlant.plantId}`}
                      {batch.externalSource && ` from ${batch.externalSource}`}
                    </div>
                    {batch.notes && (
                      <div className="text-sm text-gray-400 mt-1 line-clamp-1">{batch.notes}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {batch.currentCount || batch.acquiredCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {batch.containerCount > 1 ? `in ${batch.containerCount} containers` : 'plants'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(batch.status)}`}>
                    {batch.status}
                  </span>
                </div>
              </div>
              {batch._count.plants > 0 && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                  {batch._count.plants} individualized to Plant records
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Clone Batch">
        <div className="space-y-4">
          {/* Propagation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propagation Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['TC', 'CUTTING', 'DIVISION', 'OFFSET'].map(type => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, propagationType: type })}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    form.propagationType === type
                      ? getPropagationColor(type)
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-center mb-1">{getPropagationIcon(type)}</div>
                  <div className="text-xs">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Source - either from collection or external */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Collection
              </label>
              <select
                value={form.sourcePlantId}
                onChange={e => setForm({ ...form, sourcePlantId: e.target.value, externalSource: '' })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select plant...</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.hybridName || p.species || p.plantId} ({p.plantId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External Source
              </label>
              <input
                type="text"
                value={form.externalSource}
                onChange={e => setForm({ ...form, externalSource: e.target.value, sourcePlantId: '' })}
                placeholder="e.g., NSE Tropicals"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species
              </label>
              <input
                type="text"
                value={form.species}
                onChange={e => setForm({ ...form, species: e.target.value })}
                placeholder="e.g., forgetii"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cultivar Name
              </label>
              <input
                type="text"
                value={form.cultivarName}
                onChange={e => setForm({ ...form, cultivarName: e.target.value })}
                placeholder="e.g., Dark Mama"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Count
              </label>
              <input
                type="number"
                min="1"
                value={form.acquiredCount}
                onChange={e => setForm({ ...form, acquiredCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Containers
              </label>
              <input
                type="number"
                min="1"
                value={form.containerCount}
                onChange={e => setForm({ ...form, containerCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.acquiredDate}
                onChange={e => setForm({ ...form, acquiredDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Container Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container Type
            </label>
            <input
              type="text"
              value={form.containerType}
              onChange={e => setForm({ ...form, containerType: e.target.value })}
              placeholder="e.g., 2-inch pots, TC cups"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Batch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Save, X, Plus, Droplets, FlaskConical,
  Scissors, TreeDeciduous, Sprout, Package, Calendar, MapPin,
  Trash2, AlertCircle
} from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'

interface CloneBatch {
  id: string
  batchId: string
  propagationType: string
  sourcePlant: { id: string; plantId: string; hybridName: string | null; species: string | null; section: string | null } | null
  externalSource: string | null
  species: string | null
  cultivarName: string | null
  acquiredDate: string
  acquiredCount: number
  currentCount: number | null
  containerCount: number
  containerType: string | null
  status: string
  location: { id: string; name: string; type: string } | null
  locationId: string | null
  identifier: string | null
  notes: string | null
  plants: { id: string; plantId: string; hybridName: string | null; healthStatus: string }[]
}

interface CareLog {
  id: string
  date: string
  action: string
  inputEC: number | null
  inputPH: number | null
  outputEC: number | null
  outputPH: number | null
  isBaselineFeed: boolean
  details: string | null
  createdAt: string
}

interface Location {
  id: string
  name: string
  type: string
}

function getPropagationIcon(type: string) {
  switch (type) {
    case 'TC': return <FlaskConical size={20} />
    case 'CUTTING': return <Scissors size={20} />
    case 'DIVISION': return <TreeDeciduous size={20} />
    case 'OFFSET': return <Sprout size={20} />
    default: return <Package size={20} />
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

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [batch, setBatch] = useState<CloneBatch | null>(null)
  const [careLogs, setCareLogs] = useState<CareLog[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [careModalOpen, setCareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const [editForm, setEditForm] = useState({
    species: '',
    cultivarName: '',
    acquiredCount: '',
    currentCount: '',
    containerCount: '',
    containerType: '',
    status: '',
    locationId: '',
    notes: ''
  })

  const [careForm, setCareForm] = useState({
    date: new Date().toISOString().split('T')[0],
    action: 'watering',
    inputEC: '',
    inputPH: '',
    outputEC: '',
    outputPH: '',
    isBaselineFeed: true,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const [batchRes, careRes, locRes] = await Promise.all([
        fetch(`/api/clone-batches/${id}`),
        fetch(`/api/clone-batches/${id}/care-logs`),
        fetch('/api/locations')
      ])

      if (!batchRes.ok) {
        router.push('/batches')
        return
      }

      const batchData = await batchRes.json()
      setBatch(batchData)
      setEditForm({
        species: batchData.species || '',
        cultivarName: batchData.cultivarName || '',
        acquiredCount: batchData.acquiredCount.toString(),
        currentCount: (batchData.currentCount || batchData.acquiredCount).toString(),
        containerCount: batchData.containerCount.toString(),
        containerType: batchData.containerType || '',
        status: batchData.status,
        locationId: batchData.locationId || '',
        notes: batchData.notes || ''
      })

      if (careRes.ok) setCareLogs(await careRes.json())
      if (locRes.ok) setLocations(await locRes.json())
    } catch (error) {
      console.error('Error fetching batch:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      const response = await fetch(`/api/clone-batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: editForm.species || null,
          cultivarName: editForm.cultivarName || null,
          acquiredCount: parseInt(editForm.acquiredCount) || 1,
          currentCount: parseInt(editForm.currentCount) || null,
          containerCount: parseInt(editForm.containerCount) || 1,
          containerType: editForm.containerType || null,
          status: editForm.status,
          locationId: editForm.locationId || null,
          notes: editForm.notes || null
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setBatch({ ...batch!, ...updated })
        setIsEditing(false)
        showToast({ type: 'success', title: 'Batch updated' })
      } else {
        showToast({ type: 'error', title: 'Failed to update batch' })
      }
    } catch (error) {
      console.error('Error updating batch:', error)
      showToast({ type: 'error', title: 'Error updating batch' })
    }
  }

  async function handleAddCare() {
    try {
      const response = await fetch(`/api/clone-batches/${id}/care-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: careForm.date,
          action: careForm.action,
          inputEC: careForm.inputEC || null,
          inputPH: careForm.inputPH || null,
          outputEC: careForm.outputEC || null,
          outputPH: careForm.outputPH || null,
          isBaselineFeed: careForm.isBaselineFeed,
          notes: careForm.notes || null
        })
      })

      if (response.ok) {
        setCareModalOpen(false)
        setCareForm({
          date: new Date().toISOString().split('T')[0],
          action: 'watering',
          inputEC: '',
          inputPH: '',
          outputEC: '',
          outputPH: '',
          isBaselineFeed: true,
          notes: ''
        })
        fetchData()
        showToast({ type: 'success', title: 'Care log added' })
      } else {
        showToast({ type: 'error', title: 'Failed to add care log' })
      }
    } catch (error) {
      console.error('Error adding care log:', error)
      showToast({ type: 'error', title: 'Error adding care log' })
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/clone-batches/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast({ type: 'success', title: 'Batch deleted' })
        router.push('/batches')
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to delete batch' })
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      showToast({ type: 'error', title: 'Error deleting batch' })
    }
    setDeleteModalOpen(false)
  }

  function getBatchName(): string {
    if (!batch) return ''
    if (batch.cultivarName) return batch.cultivarName
    if (batch.species) return batch.species
    if (batch.sourcePlant) {
      return batch.sourcePlant.hybridName || batch.sourcePlant.species || batch.sourcePlant.plantId
    }
    if (batch.externalSource) return batch.externalSource
    return batch.batchId
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function getActionIcon(action: string) {
    switch (action.toLowerCase()) {
      case 'watering': return <Droplets size={16} className="text-blue-500" />
      case 'fertilizing': return <FlaskConical size={16} className="text-green-500" />
      default: return <Droplets size={16} className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading batch...</div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Batch not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/batches"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${getPropagationColor(batch.propagationType)}`}>
              {getPropagationIcon(batch.propagationType)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getBatchName()}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{batch.batchId}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(batch.status)}`}>
                  {batch.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Edit
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={18} />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        {isEditing ? (
          // Edit Mode
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
              <input
                type="text"
                value={editForm.species}
                onChange={e => setEditForm({ ...editForm, species: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., forgetii"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cultivar Name</label>
              <input
                type="text"
                value={editForm.cultivarName}
                onChange={e => setEditForm({ ...editForm, cultivarName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., Dark Mama"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Count</label>
              <input
                type="number"
                min="1"
                value={editForm.acquiredCount}
                onChange={e => setEditForm({ ...editForm, acquiredCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Count</label>
              <input
                type="number"
                min="0"
                value={editForm.currentCount}
                onChange={e => setEditForm({ ...editForm, currentCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Containers</label>
              <input
                type="number"
                min="1"
                value={editForm.containerCount}
                onChange={e => setEditForm({ ...editForm, containerCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Container Type</label>
              <input
                type="text"
                value={editForm.containerType}
                onChange={e => setEditForm({ ...editForm, containerType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., 2-inch pots"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="GROWING">Growing</option>
                <option value="SEPARATING">Separating</option>
                <option value="COMPLETE">Complete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={editForm.locationId}
                onChange={e => setEditForm({ ...editForm, locationId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">No location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        ) : (
          // View Mode
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="font-medium">{batch.propagationType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Source</div>
              <div className="font-medium">
                {batch.sourcePlant ? (
                  <Link href={`/plants/${batch.sourcePlant.id}`} className="text-green-600 hover:underline">
                    {batch.sourcePlant.plantId}
                  </Link>
                ) : batch.externalSource || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Acquired</div>
              <div className="font-medium flex items-center gap-1">
                <Calendar size={14} className="text-gray-400" />
                {formatDate(batch.acquiredDate)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Location</div>
              <div className="font-medium flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" />
                {batch.location?.name || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Count</div>
              <div className="font-medium">
                {batch.currentCount || batch.acquiredCount}
                {batch.currentCount !== batch.acquiredCount && (
                  <span className="text-gray-400 text-sm"> / {batch.acquiredCount} original</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Containers</div>
              <div className="font-medium">
                {batch.containerCount} {batch.containerType && `(${batch.containerType})`}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Species</div>
              <div className="font-medium">{batch.species || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Cultivar</div>
              <div className="font-medium">{batch.cultivarName || '-'}</div>
            </div>
            {batch.notes && (
              <div className="col-span-2 md:col-span-4">
                <div className="text-sm text-gray-500">Notes</div>
                <div className="text-gray-700">{batch.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Graduated Plants */}
      {batch.plants.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Individualized Plants ({batch.plants.length})
          </h2>
          <div className="grid gap-2">
            {batch.plants.map(plant => (
              <Link
                key={plant.id}
                href={`/plants/${plant.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-900">{plant.plantId}</span>
                  {plant.hybridName && (
                    <span className="text-gray-500 ml-2">{plant.hybridName}</span>
                  )}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  plant.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                  plant.healthStatus === 'stressed' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {plant.healthStatus}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Care Logs */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Care History</h2>
          <button
            onClick={() => setCareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Log Care
          </button>
        </div>

        {careLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Droplets size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No care logged yet</p>
            <p className="text-sm">Track watering and fertilizing for this batch</p>
          </div>
        ) : (
          <div className="space-y-3">
            {careLogs.map(log => {
              let details: any = {}
              try {
                if (log.details) details = JSON.parse(log.details)
              } catch {}

              return (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">{log.action}</span>
                      {log.isBaselineFeed && (
                        <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          Baseline
                        </span>
                      )}
                      <span className="text-sm text-gray-400">{formatDate(log.date)}</span>
                    </div>
                    {(log.inputEC || log.inputPH || log.outputEC || log.outputPH) && (
                      <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                        {(log.inputEC || log.inputPH) && (
                          <span>
                            In: {log.inputEC ? `EC ${log.inputEC}` : ''}{log.inputEC && log.inputPH ? ' / ' : ''}{log.inputPH ? `pH ${log.inputPH}` : ''}
                          </span>
                        )}
                        {(log.outputEC || log.outputPH) && (
                          <span>
                            Out: {log.outputEC ? `EC ${log.outputEC}` : ''}{log.outputEC && log.outputPH ? ' / ' : ''}{log.outputPH ? `pH ${log.outputPH}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    {details.notes && (
                      <div className="mt-1 text-sm text-gray-500">{details.notes}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Care Modal */}
      <Modal isOpen={careModalOpen} onClose={() => setCareModalOpen(false)} title="Log Care">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={careForm.date}
                onChange={e => setCareForm({ ...careForm, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={careForm.action}
                onChange={e => setCareForm({ ...careForm, action: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="watering">Watering</option>
                <option value="fertilizing">Fertilizing</option>
                <option value="repotting">Repotting</option>
                <option value="treatment">Treatment</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="baselineFeed"
              checked={careForm.isBaselineFeed}
              onChange={e => setCareForm({ ...careForm, isBaselineFeed: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="baselineFeed" className="text-sm text-gray-700">
              Baseline feed (CalMag + TPS One)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input EC</label>
              <input
                type="number"
                step="0.01"
                value={careForm.inputEC}
                onChange={e => setCareForm({ ...careForm, inputEC: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., 0.8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input pH</label>
              <input
                type="number"
                step="0.1"
                value={careForm.inputPH}
                onChange={e => setCareForm({ ...careForm, inputPH: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., 6.2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output EC</label>
              <input
                type="number"
                step="0.01"
                value={careForm.outputEC}
                onChange={e => setCareForm({ ...careForm, outputEC: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Runoff EC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output pH</label>
              <input
                type="number"
                step="0.1"
                value={careForm.outputPH}
                onChange={e => setCareForm({ ...careForm, outputPH: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Runoff pH"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={careForm.notes}
              onChange={e => setCareForm({ ...careForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setCareModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCare}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Log Care
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Batch">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <p className="text-red-800 font-medium">This will permanently delete {batch.batchId}</p>
              <p className="text-red-600 text-sm mt-1">
                All care logs for this batch will also be deleted. This cannot be undone.
              </p>
            </div>
          </div>

          {batch.plants.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
              Note: {batch.plants.length} plant(s) have been individualized from this batch.
              They will remain in the system but lose their batch reference.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Batch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

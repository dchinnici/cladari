'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Save, X, Plus, Droplets, FlaskConical,
  Scissors, TreeDeciduous, Sprout, Package, Calendar, MapPin,
  Trash2, AlertCircle, GraduationCap, Camera, Image as ImageIcon, Upload
} from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'
import { getTodayString } from '@/lib/timezone'
import { getPhotoUrl as getPhotoUrlLib } from '@/lib/photo-url'

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

interface Photo {
  id: string
  storagePath: string | null
  thumbnailPath: string | null
  url: string | null
  thumbnailUrl: string | null
  dateTaken: string
  photoType: string
  growthStage: string | null
  notes: string | null
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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [careModalOpen, setCareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [graduateModalOpen, setGraduateModalOpen] = useState(false)
  const [graduating, setGraduating] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [graduateForm, setGraduateForm] = useState({
    count: '1',
    hybridName: '',
    species: '',
    accessionDate: getTodayString(),
    potSize: '',
    substrate: '',
    locationId: '',
    notes: ''
  })

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
    date: getTodayString(),
    action: 'watering',
    inputEC: '1.15',  // Pre-populate baseline values
    inputPH: '5.7',   // Pre-populate baseline values
    outputEC: '',
    outputPH: '',
    isBaselineFeed: true,
    notes: 'CalMag + TPS One'  // Pre-populate baseline note
  })

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const [batchRes, careRes, locRes, photoRes] = await Promise.all([
        fetch(`/api/clone-batches/${id}`),
        fetch(`/api/clone-batches/${id}/care-logs`),
        fetch('/api/locations'),
        fetch(`/api/photos?cloneBatchId=${id}`)
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
      if (photoRes.ok) {
        const photoData = await photoRes.json()
        setPhotos(photoData.photos || [])
      }
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
          date: getTodayString(),
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

  function openGraduateModal() {
    // Pre-populate form from batch data
    setGraduateForm({
      count: '1',
      hybridName: batch?.cultivarName || batch?.species || '',
      species: batch?.species || '',
      accessionDate: getTodayString(),
      potSize: '',
      substrate: '',
      locationId: batch?.locationId || '',
      notes: ''
    })
    setGraduateModalOpen(true)
  }

  async function handleGraduate() {
    if (!batch) return

    const count = parseInt(graduateForm.count) || 1
    const remaining = (batch.currentCount ?? batch.acquiredCount) - batch.plants.length

    if (count < 1) {
      showToast({ type: 'error', title: 'Must graduate at least 1 plant' })
      return
    }

    if (count > remaining) {
      showToast({ type: 'error', title: `Only ${remaining} remaining in batch` })
      return
    }

    setGraduating(true)
    try {
      const response = await fetch(`/api/clone-batches/${id}/graduate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count,
          hybridName: graduateForm.hybridName || null,
          species: graduateForm.species || null,
          accessionDate: graduateForm.accessionDate || null,
          potSize: graduateForm.potSize || null,
          substrate: graduateForm.substrate || null,
          locationId: graduateForm.locationId || null,
          notes: graduateForm.notes || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        showToast({
          type: 'success',
          title: `Graduated ${result.graduated} plant${result.graduated > 1 ? 's' : ''}`,
          message: result.plants.map((p: any) => p.plantId).join(', ')
        })
        setGraduateModalOpen(false)
        fetchData() // Refresh batch data
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to graduate' })
      }
    } catch (error) {
      console.error('Error graduating:', error)
      showToast({ type: 'error', title: 'Error graduating plants' })
    } finally {
      setGraduating(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('cloneBatchId', id)
      formData.append('photoType', 'batch')

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        showToast({ type: 'success', title: 'Photo uploaded' })
        fetchData() // Refresh to show new photo
      } else {
        const err = await response.json()
        showToast({ type: 'error', title: err.error || 'Failed to upload photo' })
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      showToast({ type: 'error', title: 'Error uploading photo' })
    } finally {
      setUploadingPhoto(false)
      e.target.value = '' // Reset file input
    }
  }

  function getPhotoUrl(photo: Photo): string {
    return getPhotoUrlLib(photo, 'medium')
  }

  function getThumbnailUrl(photo: Photo): string {
    return getPhotoUrlLib(photo, 'thumbnail')
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
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  function getActionStyle(action: string): { icon: React.ReactNode; bg: string } {
    switch (action.toLowerCase()) {
      case 'watering':
        return { icon: <Droplets size={16} />, bg: 'bg-blue-100 text-blue-600' }
      case 'fertilizing':
        return { icon: <FlaskConical size={16} />, bg: 'bg-green-100 text-green-600' }
      case 'repotting':
        return { icon: <Package size={16} />, bg: 'bg-amber-100 text-amber-600' }
      case 'treatment':
        return { icon: <FlaskConical size={16} />, bg: 'bg-red-100 text-red-600' }
      default:
        return { icon: <Droplets size={16} />, bg: 'bg-gray-100 text-gray-500' }
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

      {/* Graduation Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Individualized Plants
            </h2>
            <p className="text-sm text-gray-500">
              {batch.plants.length} graduated, {(batch.currentCount ?? batch.acquiredCount) - batch.plants.length} remaining
            </p>
          </div>
          {(batch.currentCount ?? batch.acquiredCount) - batch.plants.length > 0 && (
            <button
              onClick={openGraduateModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <GraduationCap size={18} />
              Graduate to Plant
            </button>
          )}
        </div>

        {batch.plants.length > 0 ? (
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
        ) : (
          <div className="text-center py-8 text-gray-400">
            <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
            <p>No plants graduated yet</p>
            <p className="text-sm">Click "Graduate to Plant" to individualize from this batch</p>
          </div>
        )}
      </div>

      {/* Care Logs */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Care History</h2>
          <button
            onClick={() => {
              // Reset form with baseline values
              setCareForm({
                date: getTodayString(),
                action: 'watering',
                inputEC: '1.15',
                inputPH: '5.7',
                outputEC: '',
                outputPH: '',
                isBaselineFeed: true,
                notes: 'CalMag + TPS One'
              })
              setCareModalOpen(true)
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--forest)] text-white rounded-lg hover:bg-[var(--moss)] transition-colors"
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

              const actionStyle = getActionStyle(log.action)

              // Build EC/pH subtitle matching JournalTab format
              const ecPhParts: string[] = []
              if (log.inputEC || log.inputPH) {
                ecPhParts.push(`In: EC ${log.inputEC?.toFixed(2) || '-'} / pH ${log.inputPH?.toFixed(1) || '-'}`)
              }
              if (log.outputEC || log.outputPH) {
                ecPhParts.push(`Out: EC ${log.outputEC?.toFixed(2) || '-'} / pH ${log.outputPH?.toFixed(1) || '-'}`)
              }

              return (
                <div key={log.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Icon with colored background */}
                    <div className={`p-2 rounded-lg ${actionStyle.bg}`}>
                      {actionStyle.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{log.action}</p>
                          <p className="text-xs text-gray-400">{formatDate(log.date)}</p>
                        </div>
                        {log.isBaselineFeed && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            Baseline
                          </span>
                        )}
                      </div>

                      {ecPhParts.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1 font-mono">
                          {ecPhParts.join(' → ')}
                        </p>
                      )}

                      {details.notes && (
                        <p className="text-sm text-gray-500 mt-1">{details.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Photos Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
          <label className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploadingPhoto ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera size={16} />
                Add Photo
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No photos yet</p>
            <p className="text-sm">Add photos to document this batch</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {photos.map(photo => (
              <a
                key={photo.id}
                href={getPhotoUrl(photo)}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={getThumbnailUrl(photo)}
                  alt={`Batch photo from ${new Date(photo.dateTaken).toLocaleDateString()}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Add Care Modal - Matching Plant Care Modal */}
      <Modal isOpen={careModalOpen} onClose={() => setCareModalOpen(false)} title="Log Care">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Date</label>
            <input
              type="date"
              value={careForm.date}
              onChange={e => setCareForm({ ...careForm, date: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Activity Type</label>
            <select
              value={careForm.action}
              onChange={e => {
                const newAction = e.target.value
                const updates: any = { action: newAction }

                // Reset baseline when not watering
                if (newAction !== 'watering') {
                  updates.isBaselineFeed = false
                  updates.inputEC = ''
                  updates.inputPH = ''
                  updates.notes = ''
                }

                setCareForm({ ...careForm, ...updates })
              }}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            >
              <option value="watering">Watering (with baseline feed)</option>
              <option value="fertilizing">Incremental Feed (deviation from baseline)</option>
              <option value="repotting">Repotting</option>
              <option value="treatment">Treatment</option>
              <option value="pest_discovery">Pest/Disease Discovery</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Baseline Feed Checkbox - Only for watering */}
          {careForm.action === 'watering' && (
            <div className="bg-[var(--moss)]/10 border border-[var(--moss)]/20 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={careForm.isBaselineFeed}
                  onChange={e => {
                    const checked = e.target.checked
                    if (checked) {
                      setCareForm({
                        ...careForm,
                        isBaselineFeed: true,
                        inputPH: '5.7',
                        inputEC: '1.15',
                        notes: careForm.notes + (careForm.notes && !careForm.notes.includes('CalMag') ? '\n\n' : '') + 'CalMag + TPS One'
                      })
                    } else {
                      setCareForm({ ...careForm, isBaselineFeed: false })
                    }
                  }}
                  className="w-4 h-4 text-[var(--moss)] rounded focus:ring-[var(--moss)]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[var(--bark)]">Baseline feed (CalMag + TPS One)</span>
                  <p className="text-xs text-[var(--clay)] mt-0.5">
                    Auto-fills: pH 5.7, EC 1.15
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* EC/pH fields - Only for watering/fertilizing */}
          {(careForm.action === 'watering' || careForm.action === 'fertilizing') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--bark)] mb-1">Input EC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={careForm.inputEC}
                    onChange={e => setCareForm({ ...careForm, inputEC: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                    placeholder="e.g., 1.15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--bark)] mb-1">Input pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={careForm.inputPH}
                    onChange={e => setCareForm({ ...careForm, inputPH: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                    placeholder="e.g., 5.7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--bark)] mb-1">Output EC (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={careForm.outputEC}
                    onChange={e => setCareForm({ ...careForm, outputEC: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                    placeholder="Runoff EC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--bark)] mb-1">Output pH (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={careForm.outputPH}
                    onChange={e => setCareForm({ ...careForm, outputPH: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                    placeholder="Runoff pH"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={careForm.notes}
              onChange={e => setCareForm({ ...careForm, notes: e.target.value })}
              rows={3}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              placeholder="Describe the activity..."
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-black/[0.08]">
            <button
              onClick={handleAddCare}
              className="flex-1 px-4 py-2 bg-[var(--forest)] text-white rounded hover:bg-[var(--moss)]"
            >
              Log Care
            </button>
            <button
              onClick={() => setCareModalOpen(false)}
              className="flex-1 px-4 py-2 border border-black/[0.08] rounded text-[var(--bark)] hover:bg-[var(--parchment)]"
            >
              Cancel
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

      {/* Graduate Modal */}
      <Modal isOpen={graduateModalOpen} onClose={() => setGraduateModalOpen(false)} title="Graduate to Plant">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <GraduationCap className="text-purple-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-purple-800 font-medium">
                Individualize plants from {batch.batchId}
              </p>
              <p className="text-purple-600 text-sm mt-1">
                {(batch.currentCount ?? batch.acquiredCount) - batch.plants.length} remaining in batch
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How many to graduate?
            </label>
            <input
              type="number"
              min="1"
              max={(batch.currentCount ?? batch.acquiredCount) - batch.plants.length}
              value={graduateForm.count}
              onChange={e => setGraduateForm({ ...graduateForm, count: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hybrid Name</label>
              <input
                type="text"
                value={graduateForm.hybridName}
                onChange={e => setGraduateForm({ ...graduateForm, hybridName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., Dark Mama"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
              <input
                type="text"
                value={graduateForm.species}
                onChange={e => setGraduateForm({ ...graduateForm, species: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., forgetii"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accession Date</label>
            <input
              type="date"
              value={graduateForm.accessionDate}
              onChange={e => setGraduateForm({ ...graduateForm, accessionDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pot Size</label>
              <select
                value={graduateForm.potSize}
                onChange={e => setGraduateForm({ ...graduateForm, potSize: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select pot size</option>
                <option value="2 inch">2 inch</option>
                <option value="3 inch">3 inch</option>
                <option value="4 inch">4 inch</option>
                <option value="5 inch">5 inch</option>
                <option value="6 inch">6 inch</option>
                <option value="1 gallon">1 gallon</option>
                <option value="2 gallon">2 gallon</option>
                <option value="3 gallon">3 gallon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Substrate</label>
              <select
                value={graduateForm.substrate}
                onChange={e => setGraduateForm({ ...graduateForm, substrate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select substrate</option>
                <optgroup label="Dave's Mixes">
                  <option value="Dave 4.0">Dave 4.0 (TFF/Perlite/Coco/Orchiata/Pon/Charcoal)</option>
                  <option value="Dave 4.5">Dave 4.5 (TFF-heavy/Perlite/Coco/Orchiata Classic+Precision/Pon/Charcoal)</option>
                </optgroup>
                <optgroup label="Standard">
                  <option value="Chunky Aroid Mix">Chunky Aroid Mix</option>
                  <option value="Leca">Leca</option>
                  <option value="Pon">Pon</option>
                  <option value="Sphagnum">Sphagnum Moss</option>
                  <option value="Perlite">Perlite</option>
                  <option value="Semi-Hydro">Semi-Hydro</option>
                  <option value="Soil">Potting Soil</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={graduateForm.locationId}
              onChange={e => setGraduateForm({ ...graduateForm, locationId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">No location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={graduateForm.notes}
              onChange={e => setGraduateForm({ ...graduateForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Optional notes for the new plant record..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setGraduateModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleGraduate}
              disabled={graduating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <GraduationCap size={16} />
              {graduating ? 'Graduating...' : `Graduate ${graduateForm.count || 1} Plant${parseInt(graduateForm.count) > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

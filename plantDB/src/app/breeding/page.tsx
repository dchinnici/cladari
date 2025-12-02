'use client'

import { useEffect, useState } from 'react'
import { Heart, Plus, GitBranch, Edit, Trash2, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'

export default function BreedingPage() {
  const [crosses, setCrosses] = useState<any[]>([])
  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCross, setEditingCross] = useState<any>(null)

  const [crossForm, setCrossForm] = useState({
    parentAId: '',
    parentBId: '',
    crossDate: new Date().toISOString().split('T')[0],
    status: 'planned',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [crossesRes, plantsRes] = await Promise.all([
        fetch('/api/breeding'),
        fetch('/api/plants')
      ])

      if (crossesRes.ok) {
        const data = await crossesRes.json()
        setCrosses(Array.isArray(data) ? data : [])
      }

      if (plantsRes.ok) {
        const data = await plantsRes.json()
        setPlants(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCross = async () => {
    try {
      const url = editingCross
        ? `/api/breeding/${editingCross.id}`
        : '/api/breeding'

      const method = editingCross ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crossForm)
      })

      if (response.ok) {
        await fetchData()
        setModalOpen(false)
        setEditingCross(null)
        resetForm()
        showToast({
          type: 'success',
          title: editingCross ? 'Cross updated' : 'Cross created'
        })
      } else {
        showToast({ type: 'error', title: 'Failed to save cross' })
      }
    } catch (error) {
      console.error('Error saving cross:', error)
      showToast({ type: 'error', title: 'Error saving cross' })
    }
  }

  const handleDeleteCross = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cross?')) {
      return
    }

    try {
      const response = await fetch(`/api/breeding/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        showToast({ type: 'success', title: 'Cross deleted' })
      } else {
        showToast({ type: 'error', title: 'Failed to delete cross' })
      }
    } catch (error) {
      console.error('Error deleting cross:', error)
      showToast({ type: 'error', title: 'Error deleting cross' })
    }
  }

  const openEditModal = (cross: any) => {
    setEditingCross(cross)
    setCrossForm({
      parentAId: cross.parentAId || '',
      parentBId: cross.parentBId || '',
      crossDate: cross.crossDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: cross.status || 'planned',
      notes: cross.notes || ''
    })
    setModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingCross(null)
    resetForm()
    setModalOpen(true)
  }

  const resetForm = () => {
    setCrossForm({
      parentAId: '',
      parentBId: '',
      crossDate: new Date().toISOString().split('T')[0],
      status: 'planned',
      notes: ''
    })
  }

  const getPlantName = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId)
    return plant ? (plant.name || plant.plantId) : 'Unknown'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-[var(--clay)]/20 text-[var(--bark)]'
      case 'pollinated': return 'bg-[var(--spadix-yellow)]/20 text-[var(--spadix-yellow)]'
      case 'seeds_collected': return 'bg-[var(--moss)]/20 text-[var(--moss)]'
      case 'germinating': return 'bg-[var(--water-blue)]/20 text-[var(--water-blue)]'
      case 'success': return 'bg-[var(--forest)]/20 text-[var(--forest)]'
      case 'failed': return 'bg-[var(--alert-red)]/20 text-[var(--alert-red)]'
      default: return 'bg-[var(--clay)]/20 text-[var(--bark)]'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading breeding data...</p>
      </div>
    )
  }

  const activeCrosses = crosses.filter(c => !['success', 'failed'].includes(c.status))
  const completedCrosses = crosses.filter(c => ['success', 'failed'].includes(c.status))

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--forest)]">Breeding</h1>
            <p className="text-sm text-[var(--clay)]">{crosses.length} crosses recorded</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--forest)] text-white text-sm rounded"
          >
            <Plus className="w-4 h-4" />
            New Cross
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-[var(--moss)]" />
              <span className="text-xs text-[var(--clay)]">Total Crosses</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{crosses.length}</p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-[var(--water-blue)]" />
              <span className="text-xs text-[var(--clay)]">Active</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{activeCrosses.length}</p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <p className="text-xs text-[var(--clay)] mb-2">Successful</p>
            <p className="text-3xl font-semibold text-[var(--moss)]">
              {crosses.filter(c => c.status === 'success').length}
            </p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <p className="text-xs text-[var(--clay)] mb-2">Failed</p>
            <p className="text-3xl font-semibold text-[var(--alert-red)]">
              {crosses.filter(c => c.status === 'failed').length}
            </p>
          </div>
        </div>

        {/* Active Crosses */}
        {activeCrosses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-3">Active Crosses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCrosses.map((cross) => (
                <div key={cross.id} className="bg-white border border-black/[0.08] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(cross.status)}`}>
                        {cross.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(cross)}
                        className="p-1.5 hover:bg-black/[0.04] rounded"
                      >
                        <Edit className="w-4 h-4 text-[var(--clay)]" />
                      </button>
                      <button
                        onClick={() => handleDeleteCross(cross.id)}
                        className="p-1.5 hover:bg-[var(--alert-red)]/10 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--alert-red)]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium text-[var(--forest)]">{getPlantName(cross.parentAId)}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--clay)]" />
                    <span className="font-medium text-[var(--forest)]">{getPlantName(cross.parentBId)}</span>
                  </div>

                  <p className="text-xs text-[var(--clay)]">
                    {new Date(cross.crossDate).toLocaleDateString()}
                  </p>

                  {cross.notes && (
                    <p className="text-xs text-[var(--clay)] mt-2 pt-2 border-t border-black/[0.04]">
                      {cross.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Crosses */}
        {completedCrosses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-3">Completed</h2>
            <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
              <div className="divide-y divide-black/[0.04]">
                {completedCrosses.map((cross) => (
                  <div key={cross.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(cross.status)}`}>
                        {cross.status}
                      </span>
                      <span className="text-sm text-[var(--bark)]">
                        {getPlantName(cross.parentAId)} × {getPlantName(cross.parentBId)}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--clay)]">
                      {new Date(cross.crossDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {crosses.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-[var(--clay)] mx-auto mb-3" />
            <p className="text-[var(--bark)] mb-1">No breeding records yet</p>
            <p className="text-sm text-[var(--clay)] mb-4">Start planning your first cross</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[var(--forest)] text-white text-sm rounded"
            >
              Create First Cross
            </button>
          </div>
        )}
      </div>

      {/* Cross Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCross(null)
          resetForm()
        }}
        title={editingCross ? 'Edit Cross' : 'New Cross'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Parent A (Pollen) *</label>
            <select
              value={crossForm.parentAId}
              onChange={(e) => setCrossForm({ ...crossForm, parentAId: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
            >
              <option value="">Select plant...</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name || plant.plantId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Parent B (Seed) *</label>
            <select
              value={crossForm.parentBId}
              onChange={(e) => setCrossForm({ ...crossForm, parentBId: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
            >
              <option value="">Select plant...</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name || plant.plantId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Cross Date</label>
            <input
              type="date"
              value={crossForm.crossDate}
              onChange={(e) => setCrossForm({ ...crossForm, crossDate: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Status</label>
            <select
              value={crossForm.status}
              onChange={(e) => setCrossForm({ ...crossForm, status: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
            >
              <option value="planned">Planned</option>
              <option value="pollinated">Pollinated</option>
              <option value="seeds_collected">Seeds Collected</option>
              <option value="germinating">Germinating</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--bark)] mb-1">Notes</label>
            <textarea
              value={crossForm.notes}
              onChange={(e) => setCrossForm({ ...crossForm, notes: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
              rows={3}
              placeholder="Notes about the cross..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveCross}
              className="flex-1 px-4 py-2 bg-[var(--forest)] text-white text-sm rounded"
            >
              {editingCross ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setModalOpen(false)
                setEditingCross(null)
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

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Droplets, Heart, Activity, FileText, FlaskConical, Dna, Calendar, DollarSign, MapPin, Edit, Save, X, Plus, Trash2, Upload, Image as ImageIcon, TrendingUp } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Modal } from '@/components/modal'
import { showToast } from '@/components/toast'
import { getLastWateringEvent, getLastFertilizingEvent } from '@/lib/careLogUtils'
import { UpcomingCare } from '@/components/care/UpcomingCare'
import { ECPHDashboard } from '@/components/care/ECPHDashboard'

export default function PlantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [plant, setPlant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [editedPlant, setEditedPlant] = useState<any>({})

  // Modal states
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [careLogModalOpen, setCareLogModalOpen] = useState(false)
  const [morphologyModalOpen, setMorphologyModalOpen] = useState(false)
  const [photoUploadModalOpen, setPhotoUploadModalOpen] = useState(false)
  const [overviewModalOpen, setOverviewModalOpen] = useState(false)
  const [floweringModalOpen, setFloweringModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Flowering cycle state
  const [floweringCycles, setFloweringCycles] = useState<any[]>([])
  const [currentCycle, setCurrentCycle] = useState<any>(null)

  // Locations state
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  // Form states
  const [measurementForm, setMeasurementForm] = useState({
    ecValue: '',
    phValue: '',
    tdsValue: '',
    notes: '',
    measurementDate: new Date().toISOString().split('T')[0]
  })

  const [careLogForm, setCareLogForm] = useState({
    logId: '',
    activityType: 'watering',
    notes: '',
    fertilizer: '',
    pesticide: '',
    fungicide: '',
    dosage: '',
    inputEC: '',
    inputPH: '',
    outputEC: '',
    outputPH: '',
    rainAmount: '',
    rainDuration: '',
    date: new Date().toISOString().split('T')[0],
    // Pest/disease discovery fields
    pestType: '',
    severity: '',
    affectedArea: '',
    // Repotting fields
    fromPotSize: '',
    toPotSize: '',
    fromPotType: '',
    toPotType: ''
  })

  const [useBaselineFeed, setUseBaselineFeed] = useState(false)
  const [careLogToDelete, setCareLogToDelete] = useState<string | null>(null)

  const [morphologyForm, setMorphologyForm] = useState({
    leafShape: '',
    leafTexture: '',
    leafColor: '',
    leafSize: '',
    spadixColor: '',
    spatheColor: '',
    spatheShape: '',
    growthRate: '',
    matureSize: '',
    petioleColor: '',
    cataphyllColor: '',
    newLeafColor: ''
  })

  const [overviewForm, setOverviewForm] = useState({
    name: '',
    species: '',
    crossNotation: '',
    section: '',
    acquisitionCost: '',
    acquisitionDate: '',
    healthStatus: '',
    propagationType: '',
    generation: '',
    breeder: '',
    breederCode: ''
  })

  const [photoForm, setPhotoForm] = useState({
    photoId: '',
    photoType: 'whole_plant',
    growthStage: '',
    notes: '',
    dateTaken: new Date().toISOString().split('T')[0]
  })

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const [floweringForm, setFloweringForm] = useState({
    cycleId: '',
    spatheEmergence: '',
    femaleStart: '',
    femaleEnd: '',
    maleStart: '',
    maleEnd: '',
    spatheClose: '',
    pollenCollected: false,
    pollenQuality: '',
    pollenStored: false,
    pollenStorageDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchPlant()
    fetchFloweringCycles()
    fetchLocations()
  }, [params.id])

  // Helper to preserve scroll position during data refresh
  const preserveScrollPosition = async (callback: () => Promise<void>) => {
    const scrollY = window.scrollY
    await callback()
    // Restore scroll after React re-renders
    setTimeout(() => window.scrollTo(0, scrollY), 0)
  }

  const fetchPlant = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}`)
      const data = await response.json()
      setPlant(data)

      // Parse care data from notes field if it's JSON
      let careData = {}
      if (data.notes) {
        try {
          const parsed = JSON.parse(data.notes)
          if (typeof parsed === 'object' && parsed.generalNotes !== undefined) {
            careData = {
              notes: parsed.generalNotes || '',
              soilMix: parsed.soilMix || '',
              lightRequirements: parsed.lightRequirements || '',
              wateringFrequency: parsed.wateringFrequency || '',
              fertilizationSchedule: parsed.fertilizationSchedule || '',
              temperatureRange: parsed.temperatureRange || '',
              humidityPreference: parsed.humidityPreference || ''
            }
          } else {
            // If it's not our JSON format, treat it as plain notes
            careData = { notes: data.notes }
          }
        } catch {
          // If parsing fails, treat as plain notes
          careData = { notes: data.notes }
        }
      }

      setEditedPlant({ ...data, ...careData })

      // Initialize morphology form with existing data (from normalized traits)
      if (data.traits && data.traits.length > 0) {
        const getTrait = (category: string, traitName: string) =>
          data.traits.find((t: any) => t.category === category && t.traitName === traitName)?.value || ''

        setMorphologyForm({
          leafShape: getTrait('leaf', 'shape'),
          leafTexture: getTrait('leaf', 'texture'),
          leafColor: getTrait('leaf', 'color'),
          leafSize: getTrait('leaf', 'size'),
          spadixColor: getTrait('spadix', 'color'),
          spatheColor: getTrait('spathe', 'color'),
          spatheShape: getTrait('spathe', 'shape'),
          growthRate: getTrait('growth', 'rate'),
          matureSize: getTrait('growth', 'matureSize'),
          petioleColor: getTrait('leaf', 'petioleColor'),
          cataphyllColor: getTrait('growth', 'cataphyllColor'),
          newLeafColor: getTrait('leaf', 'newLeafColor')
        })
      }
    } catch (error) {
      console.error('Error fetching plant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Create a care object with all the care fields
      const careData = {
        generalNotes: editedPlant.notes || '',
        soilMix: editedPlant.soilMix || '',
        lightRequirements: editedPlant.lightRequirements || '',
        wateringFrequency: editedPlant.wateringFrequency || '',
        fertilizationSchedule: editedPlant.fertilizationSchedule || '',
        temperatureRange: editedPlant.temperatureRange || '',
        humidityPreference: editedPlant.humidityPreference || ''
      }

      const response = await fetch(`/api/plants/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: JSON.stringify(careData) // Store all care data as JSON in the notes field
        })
      })

      if (response.ok) {
        const updatedPlant = await response.json()
        setPlant({ ...plant, ...updatedPlant })
        setEditMode(false)
        showToast({ type: 'success', title: 'Care notes saved' })
      }
    } catch (error) {
      console.error('Error saving plant:', error)
      showToast({ type: 'error', title: 'Failed to save care notes' })
    }
  }

  const handleAddMeasurement = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(measurementForm)
      })

      if (response.ok) {
        const newMeasurement = await response.json()
        // Refresh plant data to show new measurement
        await preserveScrollPosition(fetchPlant)
        setMeasurementModalOpen(false)
        showToast({ type: 'success', title: 'Measurement added' })
        // Reset form
        setMeasurementForm({
          ecValue: '',
          phValue: '',
          tdsValue: '',
          notes: '',
          measurementDate: new Date().toISOString().split('T')[0]
        })
      } else {
        showToast({ type: 'error', title: 'Failed to add measurement' })
      }
    } catch (error) {
      console.error('Error adding measurement:', error)
      showToast({ type: 'error', title: 'Error adding measurement' })
    }
  }

  const handleAddCareLog = async () => {
    try {
      const isEditing = !!careLogForm.logId
      const url = isEditing
        ? `/api/plants/${params.id}/care-logs/${careLogForm.logId}`
        : `/api/plants/${params.id}/care-logs`

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(careLogForm)
      })

      if (response.ok) {
        // If this is a repotting action, update the plant's pot information
        if (careLogForm.activityType === 'repotting' && careLogForm.toPotSize) {
          await fetch(`/api/plants/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentPotSize: parseFloat(careLogForm.toPotSize),
              currentPotType: careLogForm.toPotType || null,
              lastRepotDate: careLogForm.date
            })
          })
        }

        await preserveScrollPosition(fetchPlant)
        setCareLogModalOpen(false)
        showToast({ type: 'success', title: isEditing ? 'Care log updated' : 'Care log added' })
        // Reset form
        setCareLogForm({
          logId: '',
          activityType: 'watering',
          notes: '',
          fertilizer: '',
          pesticide: '',
          fungicide: '',
          dosage: '',
          inputEC: '',
          inputPH: '',
          outputEC: '',
          outputPH: '',
          rainAmount: '',
          rainDuration: '',
          date: new Date().toISOString().split('T')[0],
          pestType: '',
          severity: '',
          affectedArea: '',
          fromPotSize: '',
          toPotSize: '',
          fromPotType: '',
          toPotType: ''
        })
      } else {
        showToast({ type: 'error', title: isEditing ? 'Failed to update care log' : 'Failed to add care log' })
      }
    } catch (error) {
      console.error('Error saving care log:', error)
      showToast({ type: 'error', title: 'Error saving care log' })
    }
  }

  const handleDeleteCareLog = async () => {
    if (!careLogToDelete) return

    try {
      const response = await fetch(`/api/plants/${params.id}/care-logs/${careLogToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await preserveScrollPosition(fetchPlant)
        showToast({ type: 'success', title: 'Care log deleted' })
        setCareLogToDelete(null)
      } else {
        showToast({ type: 'error', title: 'Failed to delete care log' })
      }
    } catch (error) {
      console.error('Error deleting care log:', error)
      showToast({ type: 'error', title: 'Error deleting care log' })
    }
  }

  const handleCloseCareLogModal = () => {
    setCareLogModalOpen(false)
    setUseBaselineFeed(false)
    // Reset form to prevent edit state from persisting
    setCareLogForm({
      logId: '',
      activityType: 'watering',
      notes: '',
      fertilizer: '',
      pesticide: '',
      fungicide: '',
      dosage: '',
      inputEC: '',
      inputPH: '',
      outputEC: '',
      outputPH: '',
      rainAmount: '',
      rainDuration: '',
      date: new Date().toISOString().split('T')[0],
      pestType: '',
      severity: '',
      affectedArea: '',
      fromPotSize: '',
      toPotSize: '',
      fromPotType: '',
      toPotType: ''
    })
  }

  const handleUpdateMorphology = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}/traits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(morphologyForm)
      })

      if (response.ok) {
        await preserveScrollPosition(fetchPlant)
        setMorphologyModalOpen(false)
        showToast({ type: 'success', title: 'Morphology updated' })
      }
    } catch (error) {
      console.error('Error updating morphology:', error)
      showToast({ type: 'error', title: 'Failed to update morphology' })
    }
  }

  const handleUpdateOverview = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hybridName: overviewForm.name,
          species: overviewForm.species,
          crossNotation: overviewForm.crossNotation,
          section: overviewForm.section,
          acquisitionCost: overviewForm.acquisitionCost ? parseFloat(overviewForm.acquisitionCost) : null,
          accessionDate: overviewForm.acquisitionDate ? new Date(overviewForm.acquisitionDate) : null,
          healthStatus: overviewForm.healthStatus,
          propagationType: overviewForm.propagationType || null,
          generation: overviewForm.generation || null,
          breeder: overviewForm.breeder || null,
          breederCode: overviewForm.breederCode === 'custom' ? null : (overviewForm.breederCode || null)
        })
      })

      if (response.ok) {
        await preserveScrollPosition(fetchPlant)
        setOverviewModalOpen(false)
        showToast({ type: 'success', title: 'Overview updated' })
      }
    } catch (error) {
      console.error('Error updating overview:', error)
      showToast({ type: 'error', title: 'Failed to update overview' })
    }
  }

  const handlePhotoUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast({ type: 'error', title: 'Please select at least one photo' })
      return
    }

    setUploadingPhoto(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const file of selectedFiles) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('plantId', plant.id)
          formData.append('photoType', photoForm.photoType)
          if (photoForm.growthStage) formData.append('growthStage', photoForm.growthStage)
          if (photoForm.notes) formData.append('notes', photoForm.notes)
          formData.append('dateTaken', photoForm.dateTaken)

          const response = await fetch('/api/photos', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
            console.error('Failed to upload:', file.name)
          }
        } catch (error) {
          failCount++
          console.error('Error uploading file:', file.name, error)
        }
      }

      await preserveScrollPosition(fetchPlant)
      setPhotoUploadModalOpen(false)
      setSelectedFiles([])
      setPhotoForm({
        photoType: 'whole_plant',
        growthStage: '',
        notes: '',
        dateTaken: new Date().toISOString().split('T')[0]
      })

      if (failCount === 0) {
        showToast({
          type: 'success',
          title: selectedFiles.length === 1 ? 'Photo uploaded' : `${successCount} photos uploaded`
        })
      } else {
        showToast({
          type: 'warning',
          title: `Uploaded ${successCount}, failed ${failCount}`
        })
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      showToast({ type: 'error', title: 'Failed to upload photos' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleUpdatePhoto = async () => {
    if (!photoForm.photoId) return

    try {
      const response = await fetch(`/api/photos?id=${photoForm.photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoType: photoForm.photoType,
          growthStage: photoForm.growthStage || null,
          notes: photoForm.notes || null,
          dateTaken: photoForm.dateTaken
        })
      })

      if (response.ok) {
        await preserveScrollPosition(fetchPlant)
        setPhotoUploadModalOpen(false)
        setPhotoForm({
          photoId: '',
          photoType: 'whole_plant',
          growthStage: '',
          notes: '',
          dateTaken: new Date().toISOString().split('T')[0]
        })
        showToast({ type: 'success', title: 'Photo updated' })
      } else {
        showToast({ type: 'error', title: 'Failed to update photo' })
      }
    } catch (error) {
      console.error('Error updating photo:', error)
      showToast({ type: 'error', title: 'Error updating photo' })
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await preserveScrollPosition(fetchPlant)
        showToast({ type: 'success', title: 'Photo deleted' })
      } else {
        showToast({ type: 'error', title: 'Failed to delete photo' })
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      showToast({ type: 'error', title: 'Error deleting photo' })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic']
    },
    multiple: true
  })

  const fetchFloweringCycles = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}/flowering`)
      if (response.ok) {
        const cycles = await response.json()
        setFloweringCycles(cycles)
      }
    } catch (error) {
      console.error('Error fetching flowering cycles:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleLocationChange = async (newLocationId: string) => {
    const oldLocationId = plant.locationId

    try {
      const response = await fetch(`/api/plants/${params.id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: newLocationId || null,
          oldLocationId: oldLocationId
        })
      })

      if (response.ok) {
        const updatedPlant = await response.json()
        setPlant(updatedPlant)
        setSelectedLocationId(newLocationId)
        showToast({ type: 'success', title: 'Location updated' })
      } else {
        showToast({ type: 'error', title: 'Failed to update location' })
      }
    } catch (error) {
      console.error('Error updating location:', error)
      showToast({ type: 'error', title: 'Error updating location' })
    }
  }

  const handleSaveFloweringCycle = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}/flowering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(floweringForm)
      })

      if (response.ok) {
        await preserveScrollPosition(fetchFloweringCycles)
        setFloweringModalOpen(false)
        showToast({ type: 'success', title: 'Flowering cycle saved' })
        // Reset form
        setFloweringForm({
          cycleId: '',
          spatheEmergence: '',
          femaleStart: '',
          femaleEnd: '',
          maleStart: '',
          maleEnd: '',
          spatheClose: '',
          pollenCollected: false,
          pollenQuality: '',
          pollenStored: false,
          pollenStorageDate: '',
          notes: ''
        })
      } else {
        showToast({ type: 'error', title: 'Failed to save flowering cycle' })
      }
    } catch (error) {
      console.error('Error saving flowering cycle:', error)
      showToast({ type: 'error', title: 'Error saving flowering cycle' })
    }
  }

  const handleDeletePlant = async () => {
    try {
      const response = await fetch(`/api/plants/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast({ type: 'success', title: 'Plant deleted', message: 'Plant has been permanently removed' })
        setDeleteConfirmOpen(false)
        // Redirect to plants list after deletion
        router.push('/plants')
      } else {
        showToast({ type: 'error', title: 'Failed to delete plant' })
      }
    } catch (error) {
      console.error('Error deleting plant:', error)
      showToast({ type: 'error', title: 'Error deleting plant' })
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'recommendations', name: 'Care Schedule', icon: TrendingUp },
    { id: 'care', name: 'Care & Notes', icon: Heart },
    { id: 'measurements', name: 'EC & pH', icon: Droplets },
    { id: 'morphology', name: 'Morphology', icon: Dna },
    { id: 'flowering', name: 'Flowering', icon: FlaskConical },
    { id: 'photos', name: 'Photos', icon: Camera },
    { id: 'breeding', name: 'Breeding', icon: Activity },
    { id: 'logs', name: 'Care Logs', icon: Calendar },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading plant details...</p>
      </div>
    )
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Plant not found</p>
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
                <span className="gradient-text">{plant.plantId}</span>
              </h1>
              <h2 className="text-2xl text-gray-700 mb-2">
                {plant.hybridName || plant.species || 'Unknown Species'}
              </h2>
              {plant.crossNotation && (
                <p className="text-lg text-gray-600 mb-1">{plant.crossNotation}</p>
              )}
              {plant.breederCode && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {plant.breederCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCareLogModalOpen(true)
                  setCareLogForm({
                    logId: '',
                    activityType: 'watering',
                    notes: '',
                    fertilizer: '',
                    pesticide: '',
                    fungicide: '',
                    dosage: '',
                    inputEC: '',
                    inputPH: '',
                    outputEC: '',
                    outputPH: '',
                    rainAmount: '',
                    rainDuration: '',
                    date: new Date().toISOString().split('T')[0],
                    pestType: '',
                    severity: '',
                    affectedArea: ''
                  })
                }}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center justify-center transition-colors shadow-sm"
                title="Add Care Log"
              >
                <Droplets className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm"
                title="Delete Plant"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass rounded-3xl mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="glass rounded-3xl p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Last Water/Feed Banner */}
              {plant.careLogs && plant.careLogs.length > 0 && (() => {
                // Using centralized business logic from careLogUtils
                const lastWater = getLastWateringEvent(plant.careLogs)
                const lastFeed = getLastFertilizingEvent(plant.careLogs)

                const formatDaysAgo = (date: Date) => {
                  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
                  if (days === 0) return 'Today'
                  if (days === 1) return 'Yesterday'
                  return `${days} days ago`
                }

                return (lastWater || lastFeed) && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 border border-blue-200">
                    <div className="flex items-center gap-4">
                      <Droplets className="w-8 h-8 text-blue-500" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lastWater && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Last Watered</p>
                            <p className="text-xs text-gray-500 italic mb-1">
                              (includes baseline feed)
                            </p>
                            <p className="text-lg font-bold text-blue-700">
                              {formatDaysAgo(lastWater.date)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(lastWater.date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {lastFeed && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Last Incremental Feed</p>
                            <p className="text-lg font-bold text-green-700">
                              {formatDaysAgo(lastFeed.date)}
                            </p>
                            <p className="text-xs text-gray-500 italic">
                              Special/deviation feeds only
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(lastFeed.date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Plant Overview</h3>
                <button
                  onClick={() => {
                    setOverviewForm({
                      name: plant.hybridName || '',
                      species: plant.species || '',
                      crossNotation: plant.crossNotation || '',
                      section: plant.section || '',
                      acquisitionCost: plant.acquisitionCost?.toString() || '',
                      acquisitionDate: plant.accessionDate ? new Date(plant.accessionDate).toISOString().split('T')[0] : '',
                      healthStatus: plant.healthStatus || '',
                      propagationType: plant.propagationType || '',
                      generation: plant.generation || '',
                      breeder: plant.breeder || '',
                      breederCode: plant.breederCode || ''
                    })
                    setOverviewModalOpen(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Overview
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Cost:</span>
                    <span>${plant.acquisitionCost || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Acquired:</span>
                    <span>{plant.accessionDate ? new Date(plant.accessionDate).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Location:</span>
                    <select
                      value={plant.locationId || ''}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="px-3 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">No location</option>
                      {locations.map((location: any) => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location._count?.plants || 0} plants)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Section:</span>
                    <span>{plant.section || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Propagation:</span>
                    <span className="capitalize">{plant.propagationType?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Health Status:</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      plant.healthStatus === 'healthy'
                        ? 'bg-green-100 text-green-700'
                        : plant.healthStatus === 'struggling'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {plant.healthStatus || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Vendor:</span>
                    <span>{plant.vendor?.name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Generation:</span>
                    <span>{plant.generation || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Breeder:</span>
                    <span>{plant.breeder || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plant.isEliteGenetics || false}
                        onChange={async (e) => {
                          const newValue = e.target.checked
                          try {
                            const response = await fetch(`/api/plants/${params.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isEliteGenetics: newValue })
                            })
                            if (response.ok) {
                              const updatedPlant = await response.json()
                              await preserveScrollPosition(fetchPlant)
                              showToast({ type: 'success', title: updatedPlant.isEliteGenetics ? 'Marked as elite genetics' : 'Unmarked as elite genetics' })
                            }
                          } catch (error) {
                            console.error('Error updating elite genetics:', error)
                            showToast({ type: 'error', title: 'Failed to update' })
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-medium text-purple-700">Elite Genetics</span>
                    </label>
                  </div>
                </div>
              </div>

              {plant.genetics && (
                <div className="mt-6">
                  <h4 className="font-bold mb-2">Genetic Information</h4>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p>Ploidy: {plant.genetics.ploidy || 'Unknown'}</p>
                    <p>RA Number: {plant.genetics.raNumber || 'N/A'}</p>
                    <p>OG Number: {plant.genetics.ogNumber || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Care Schedule & Recommendations</h3>
                <p className="text-gray-600">AI-powered care recommendations based on your historical data, environmental factors, and EC/pH analysis.</p>
              </div>

              <UpcomingCare
                plantId={params.id as string}
                onActionComplete={fetchPlant}
              />
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Care Requirements & Notes</h3>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setEditedPlant(plant)
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">General Notes</label>
                  <textarea
                    value={editedPlant.notes || ''}
                    onChange={e => setEditedPlant({ ...editedPlant, notes: e.target.value })}
                    disabled={!editMode}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-32 disabled:bg-gray-50"
                    placeholder="Add notes about this plant..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soil Mix</label>
                    <input
                      type="text"
                      value={editedPlant.soilMix || ''}
                      onChange={e => setEditedPlant({ ...editedPlant, soilMix: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., 40% bark, 30% perlite..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Light Requirements</label>
                    <input
                      type="text"
                      value={editedPlant.lightRequirements || ''}
                      onChange={e => setEditedPlant({ ...editedPlant, lightRequirements: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., Bright indirect light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Watering Frequency</label>
                    <input
                      type="text"
                      value={editedPlant.wateringFrequency || ''}
                      onChange={e => setEditedPlant({ ...editedPlant, wateringFrequency: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., Every 5-7 days"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fertilization Schedule</label>
                    <input
                      type="text"
                      value={editedPlant.fertilizationSchedule || ''}
                      onChange={e => setEditedPlant({ ...editedPlant, fertilizationSchedule: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., Monthly with 20-20-20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Range</label>
                    <input
                      type="text"
                      value={editedPlant.temperatureRange || ''}
                      onChange={e => setEditedPlant({ ...editedPlant, temperatureRange: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., 65-80°F"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Humidity Preference</label>
                    <input
                      type="text"
                      value={editedPlant.humidityPreference || ''}
                      onChange={e => setEditedPlant({ ...editedPlant, humidityPreference: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., 60-80%"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'measurements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">EC & pH Measurements</h3>
                <button
                  onClick={() => setMeasurementModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Measurement
                </button>
              </div>

              {plant.measurements && plant.measurements.length > 0 ? (
                <div className="space-y-3">
                  {plant.measurements.map((measurement: any) => (
                    <div key={measurement.id} className="bg-white/50 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {new Date(measurement.measurementDate).toLocaleDateString()}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>EC: {measurement.ecValue || 'N/A'}</span>
                            <span>pH: {measurement.phValue || 'N/A'}</span>
                            <span>TDS: {measurement.tdsValue || 'N/A'} ppm</span>
                          </div>
                          {measurement.notes && (
                            <p className="text-sm text-gray-600 mt-2">{measurement.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No measurements recorded yet</p>
              )}
            </div>
          )}

          {activeTab === 'morphology' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Morphological Traits</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Leaf Characteristics</h4>
                  <div className="space-y-2 text-sm">
                    <p>Shape: {plant.traits?.find((t: any) => t.category === 'leaf' && t.traitName === 'shape')?.value || 'Not recorded'}</p>
                    <p>Texture: {plant.traits?.find((t: any) => t.category === 'leaf' && t.traitName === 'texture')?.value || 'Not recorded'}</p>
                    <p>Color: {plant.traits?.find((t: any) => t.category === 'leaf' && t.traitName === 'color')?.value || 'Not recorded'}</p>
                    <p>Size: {plant.traits?.find((t: any) => t.category === 'leaf' && t.traitName === 'size')?.value || 'Not recorded'}</p>
                    <p>Petiole Color: {plant.traits?.find((t: any) => t.category === 'leaf' && t.traitName === 'petioleColor')?.value || 'Not recorded'}</p>
                    <p>New Leaf Color: {plant.traits?.find((t: any) => t.category === 'leaf' && t.traitName === 'newLeafColor')?.value || 'Not recorded'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Flower Characteristics</h4>
                  <div className="space-y-2 text-sm">
                    <p>Spadix Color: {plant.traits?.find((t: any) => t.category === 'spadix' && t.traitName === 'color')?.value || 'Not recorded'}</p>
                    <p>Spathe Color: {plant.traits?.find((t: any) => t.category === 'spathe' && t.traitName === 'color')?.value || 'Not recorded'}</p>
                    <p>Spathe Shape: {plant.traits?.find((t: any) => t.category === 'spathe' && t.traitName === 'shape')?.value || 'Not recorded'}</p>
                  </div>
                  <h4 className="font-medium mb-3 mt-4">Growth Pattern</h4>
                  <div className="space-y-2 text-sm">
                    <p>Growth Rate: {plant.traits?.find((t: any) => t.category === 'growth' && t.traitName === 'rate')?.value || 'Not recorded'}</p>
                    <p>Mature Size: {plant.traits?.find((t: any) => t.category === 'growth' && t.traitName === 'matureSize')?.value || 'Not recorded'}</p>
                    <p>Cataphyll Color: {plant.traits?.find((t: any) => t.category === 'growth' && t.traitName === 'cataphyllColor')?.value || 'Not recorded'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setMorphologyModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Morphology
                </button>
              </div>
            </div>
          )}

          {activeTab === 'flowering' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Flowering Cycles</h3>
                <button
                  onClick={() => {
                    setFloweringForm({
                      cycleId: '',
                      spatheEmergence: new Date().toISOString().split('T')[0],
                      femaleStart: '',
                      femaleEnd: '',
                      maleStart: '',
                      maleEnd: '',
                      spatheClose: '',
                      pollenCollected: false,
                      pollenQuality: '',
                      pollenStored: false,
                      pollenStorageDate: '',
                      notes: ''
                    })
                    setFloweringModalOpen(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Log Flowering Event
                </button>
              </div>

              {floweringCycles && floweringCycles.length > 0 ? (
                <div className="space-y-4">
                  {floweringCycles.map((cycle: any) => (
                    <div key={cycle.id} className="bg-white/50 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-lg">
                            {cycle.spatheEmergence ? new Date(cycle.spatheEmergence).toLocaleDateString() : 'Unknown Date'}
                          </p>
                          <p className="text-sm text-gray-600">Cycle ID: {cycle.id.slice(0, 8)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setFloweringForm({
                              cycleId: cycle.id,
                              spatheEmergence: cycle.spatheEmergence ? new Date(cycle.spatheEmergence).toISOString().split('T')[0] : '',
                              femaleStart: cycle.femaleStart ? new Date(cycle.femaleStart).toISOString().split('T')[0] : '',
                              femaleEnd: cycle.femaleEnd ? new Date(cycle.femaleEnd).toISOString().split('T')[0] : '',
                              maleStart: cycle.maleStart ? new Date(cycle.maleStart).toISOString().split('T')[0] : '',
                              maleEnd: cycle.maleEnd ? new Date(cycle.maleEnd).toISOString().split('T')[0] : '',
                              spatheClose: cycle.spatheClose ? new Date(cycle.spatheClose).toISOString().split('T')[0] : '',
                              pollenCollected: cycle.pollenCollected || false,
                              pollenQuality: cycle.pollenQuality || '',
                              pollenStored: cycle.pollenStored || false,
                              pollenStorageDate: cycle.pollenStorageDate ? new Date(cycle.pollenStorageDate).toISOString().split('T')[0] : '',
                              notes: cycle.notes || ''
                            })
                            setFloweringModalOpen(true)
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Female Phase:</p>
                          {cycle.femaleStart && (
                            <p className="text-green-600">
                              Start: {new Date(cycle.femaleStart).toLocaleDateString()}
                              {cycle.femaleEnd && ` - End: ${new Date(cycle.femaleEnd).toLocaleDateString()}`}
                            </p>
                          )}
                          {!cycle.femaleStart && <p className="text-gray-500">Not recorded</p>}
                        </div>

                        <div>
                          <p className="font-medium text-gray-700">Male Phase:</p>
                          {cycle.maleStart && (
                            <p className="text-blue-600">
                              Start: {new Date(cycle.maleStart).toLocaleDateString()}
                              {cycle.maleEnd && ` - End: ${new Date(cycle.maleEnd).toLocaleDateString()}`}
                            </p>
                          )}
                          {!cycle.maleStart && <p className="text-gray-500">Not recorded</p>}
                        </div>

                        {cycle.pollenCollected && (
                          <div>
                            <p className="font-medium text-gray-700">Pollen:</p>
                            <p className="text-purple-600">
                              Collected - Quality: {cycle.pollenQuality || 'N/A'}
                              {cycle.pollenStored && ' (Stored)'}
                            </p>
                          </div>
                        )}

                        {cycle.spatheClose && (
                          <div>
                            <p className="font-medium text-gray-700">Cycle Closed:</p>
                            <p>{new Date(cycle.spatheClose).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {cycle.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{cycle.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No flowering cycles recorded yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start tracking fertility windows to optimize breeding</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Photos</h3>
                <button
                  onClick={() => setPhotoUploadModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Upload Photos
                </button>
              </div>

              {plant.photos && plant.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {plant.photos.map((photo: any) => (
                    <div key={photo.id} className="group relative bg-white/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                      <div className="aspect-square relative">
                        <img
                          src={photo.url}
                          alt={photo.notes || 'Plant photo'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setPhotoForm({
                                photoId: photo.id,
                                photoType: photo.photoType || 'whole_plant',
                                growthStage: photo.growthStage || '',
                                notes: photo.notes || '',
                                dateTaken: photo.dateTaken ? new Date(photo.dateTaken).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                              })
                              setPhotoUploadModalOpen(true)
                            }}
                            className="p-2 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600"
                            title="Edit photo details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600"
                            title="Delete photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                            {photo.photoType?.replace('_', ' ')}
                          </span>
                          {photo.growthStage && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {photo.growthStage}
                            </span>
                          )}
                        </div>
                        {photo.notes && (
                          <p className="text-xs text-gray-600 truncate mb-1">{photo.notes}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {photo.dateTaken ? new Date(photo.dateTaken).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No photos uploaded yet</p>
                  <button
                    onClick={() => setPhotoUploadModalOpen(true)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Your First Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breeding' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Breeding History</h3>

              {(plant.femaleBreedings?.length > 0 || plant.maleBreedings?.length > 0) ? (
                <div className="space-y-4">
                  {plant.femaleBreedings?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">As Female Parent</h4>
                      <div className="space-y-2">
                        {plant.femaleBreedings.map((breeding: any) => (
                          <div key={breeding.id} className="bg-pink-50 rounded-xl p-3">
                            <p className="font-medium">Cross #{breeding.crossId}</p>
                            <p className="text-sm">Male: {breeding.malePlant?.plantId}</p>
                            <p className="text-sm">Date: {new Date(breeding.crossDate).toLocaleDateString()}</p>
                            {breeding.f1PlantsRaised && (
                              <p className="text-sm">F1 Plants: {breeding.f1PlantsRaised}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plant.maleBreedings?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">As Male Parent</h4>
                      <div className="space-y-2">
                        {plant.maleBreedings.map((breeding: any) => (
                          <div key={breeding.id} className="bg-blue-50 rounded-xl p-3">
                            <p className="font-medium">Cross #{breeding.crossId}</p>
                            <p className="text-sm">Female: {breeding.femalePlant?.plantId}</p>
                            <p className="text-sm">Date: {new Date(breeding.crossDate).toLocaleDateString()}</p>
                            {breeding.f1PlantsRaised && (
                              <p className="text-sm">F1 Plants: {breeding.f1PlantsRaised}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No breeding records yet</p>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Care Logs</h3>
                <button
                  onClick={() => setCareLogModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Log Entry
                </button>
              </div>

              {plant.careLogs && plant.careLogs.length > 0 ? (
                <div className="space-y-3">
                  {plant.careLogs.map((log: any) => (
                    <div key={log.id} className="bg-white/50 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">
                            {new Date(log.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm capitalize mt-1">
                            Activity: {log.action || log.activityType}
                          </p>
                          {log.details && (() => {
                            try {
                              const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
                              return (
                                <div className="text-sm text-gray-600 mt-2 space-y-1">
                                  {details.notes && <p>{details.notes}</p>}
                                  {(details.inputEC || details.inputPH) && (
                                    <p>Input: EC {details.inputEC || '-'} / pH {details.inputPH || '-'}</p>
                                  )}
                                  {(details.outputEC || details.outputPH) && (
                                    <p>Output: EC {details.outputEC || '-'} / pH {details.outputPH || '-'}</p>
                                  )}
                                </div>
                              )
                            } catch {
                              return <p className="text-sm text-gray-600 mt-2">{log.details}</p>
                            }
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const details = log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : {}
                              setCareLogForm({
                                logId: log.id,
                                activityType: log.action || log.activityType || 'watering',
                                notes: details.notes || '',
                                fertilizer: '',
                                pesticide: '',
                                fungicide: '',
                                dosage: '',
                                inputEC: details.inputEC?.toString() || '',
                                inputPH: details.inputPH?.toString() || '',
                                outputEC: details.outputEC?.toString() || '',
                                outputPH: details.outputPH?.toString() || '',
                                rainAmount: details.rainAmount || '',
                                rainDuration: details.rainDuration || '',
                                date: new Date(log.date).toISOString().split('T')[0]
                              })
                              setCareLogModalOpen(true)
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => setCareLogToDelete(log.id)}
                            className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No care logs recorded yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Measurement Modal */}
      <Modal
        isOpen={measurementModalOpen}
        onClose={() => setMeasurementModalOpen(false)}
        title="Add Measurement"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={measurementForm.measurementDate}
              onChange={(e) => setMeasurementForm({ ...measurementForm, measurementDate: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EC Value</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.ecValue}
                onChange={(e) => setMeasurementForm({ ...measurementForm, ecValue: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="1.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH Value</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.phValue}
                onChange={(e) => setMeasurementForm({ ...measurementForm, phValue: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="6.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TDS (ppm)</label>
              <input
                type="number"
                value={measurementForm.tdsValue}
                onChange={(e) => setMeasurementForm({ ...measurementForm, tdsValue: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={measurementForm.notes}
              onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddMeasurement}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700"
            >
              Save Measurement
            </button>
            <button
              onClick={() => setMeasurementModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Care Log Modal */}
      <Modal
        isOpen={careLogModalOpen}
        onClose={handleCloseCareLogModal}
        title={careLogForm.logId ? "Edit Care Log" : "Add Care Log"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={careLogForm.date}
              onChange={(e) => setCareLogForm({ ...careLogForm, date: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={careLogForm.activityType}
              onChange={(e) => {
                const newActivityType = e.target.value
                const updates: any = { activityType: newActivityType }

                // Reset baseline feed when changing activity type
                if (newActivityType !== 'watering') {
                  setUseBaselineFeed(false)
                }

                // Auto-populate repotting fields from current plant data
                if (newActivityType === 'repotting' && plant) {
                  updates.fromPotSize = plant.currentPotSize?.toString() || ''
                  updates.fromPotType = plant.currentPotType || ''
                }

                setCareLogForm({ ...careLogForm, ...updates })
              }}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="watering">Watering (with baseline feed)</option>
              <option value="rain">Rain</option>
              <option value="fertilizing">🧪 Incremental Feed (deviation from baseline)</option>
              <option value="repotting">Repotting</option>
              <option value="pruning">Pruning</option>
              <option value="pest_discovery">🔍 Pest/Disease Discovery</option>
              <option value="pest_treatment">Pest Treatment</option>
              <option value="fungicide">Fungicide Application</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Baseline Feed Checkbox - Only show for watering */}
          {careLogForm.activityType === 'watering' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBaselineFeed}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setUseBaselineFeed(checked)
                    if (checked) {
                      // Auto-populate baseline feed values
                      setCareLogForm({
                        ...careLogForm,
                        inputPH: '6.1',
                        inputEC: '1.0',
                        notes: careLogForm.notes + (careLogForm.notes ? '\n\n' : '') + 'Baseline feed: CalMag 1ml/L, TPS One 1.5-2ml/L, K-Carb (pH Up) 0.4-0.6ml/L'
                      })
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-emerald-900">Include baseline feed</span>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Auto-fills: pH 6.1, EC 1.0 (CalMag + TPS One + K-Carb)
                  </p>
                </div>
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={careLogForm.notes}
              onChange={(e) => setCareLogForm({ ...careLogForm, notes: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Describe the activity..."
            />
          </div>

          {careLogForm.activityType === 'rain' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rainfall Amount
                </label>
                <select
                  value={careLogForm.rainAmount}
                  onChange={(e) => setCareLogForm({ ...careLogForm, rainAmount: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select amount --</option>
                  <option value="light">Light (drizzle)</option>
                  <option value="medium">Medium (steady rain)</option>
                  <option value="heavy">Heavy (downpour)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={careLogForm.rainDuration}
                  onChange={(e) => setCareLogForm({ ...careLogForm, rainDuration: e.target.value })}
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

          {(careLogForm.activityType === 'watering' || careLogForm.activityType === 'fertilizing') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Input pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={careLogForm.inputPH}
                    onChange={(e) => setCareLogForm({ ...careLogForm, inputPH: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 6.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Input EC</label>
                  <input
                    type="number"
                    step="0.1"
                    value={careLogForm.inputEC}
                    onChange={(e) => setCareLogForm({ ...careLogForm, inputEC: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 1.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output/Leachate pH (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={careLogForm.outputPH}
                    onChange={(e) => setCareLogForm({ ...careLogForm, outputPH: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 5.8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output/Leachate EC (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={careLogForm.outputEC}
                    onChange={(e) => setCareLogForm({ ...careLogForm, outputEC: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 1.5"
                  />
                </div>
              </div>
            </>
          )}

          {/* Pest/Disease Discovery Fields */}
          {careLogForm.activityType === 'pest_discovery' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-2xl">🔍</span>
                <div>
                  <h4 className="font-semibold text-red-900">Pest or Disease Discovery</h4>
                  <p className="text-xs text-red-700">Document what you found and where. Log treatments separately.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pest/Disease Type *</label>
                <select
                  value={careLogForm.pestType}
                  onChange={(e) => setCareLogForm({ ...careLogForm, pestType: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select type...</option>
                  <optgroup label="Common Pests">
                    <option value="spider_mites">🕷️ Spider Mites</option>
                    <option value="thrips">🦟 Thrips</option>
                    <option value="aphids">🐛 Aphids</option>
                    <option value="mealybugs">Mealybugs</option>
                    <option value="scale">Scale Insects</option>
                    <option value="fungus_gnats">Fungus Gnats</option>
                    <option value="whiteflies">Whiteflies</option>
                  </optgroup>
                  <optgroup label="Diseases">
                    <option value="root_rot">🍄 Root Rot</option>
                    <option value="powdery_mildew">Powdery Mildew</option>
                    <option value="bacterial_blight">Bacterial Blight</option>
                    <option value="anthracnose">Anthracnose</option>
                    <option value="rust">Rust</option>
                    <option value="botrytis">Botrytis (Gray Mold)</option>
                  </optgroup>
                  <optgroup label="Symptoms">
                    <option value="yellowing">Yellowing Leaves</option>
                    <option value="brown_spots">Brown Spots</option>
                    <option value="wilting">Wilting</option>
                    <option value="stunted_growth">Stunted Growth</option>
                  </optgroup>
                  <option value="other">Other (describe in notes)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={careLogForm.severity}
                  onChange={(e) => setCareLogForm({ ...careLogForm, severity: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select severity...</option>
                  <option value="mild">🟢 Mild - Early detection, isolated</option>
                  <option value="moderate">🟡 Moderate - Spreading, visible damage</option>
                  <option value="severe">🔴 Severe - Widespread, significant damage</option>
                  <option value="critical">⚫ Critical - Plant health at risk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Area</label>
                <input
                  type="text"
                  value={careLogForm.affectedArea}
                  onChange={(e) => setCareLogForm({ ...careLogForm, affectedArea: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Lower leaves, new growth, roots"
                />
              </div>
            </div>
          )}

          {(careLogForm.activityType === 'fertilizing' || careLogForm.activityType === 'pest_treatment' || careLogForm.activityType === 'fungicide') && (
            <>
              {careLogForm.activityType === 'fertilizing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Used</label>
                  <input
                    type="text"
                    value={careLogForm.fertilizer}
                    onChange={(e) => setCareLogForm({ ...careLogForm, fertilizer: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 20-20-20 NPK"
                  />
                </div>
              )}

              {careLogForm.activityType === 'pest_treatment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pesticide Used</label>
                  <input
                    type="text"
                    value={careLogForm.pesticide}
                    onChange={(e) => setCareLogForm({ ...careLogForm, pesticide: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Neem oil"
                  />
                </div>
              )}

              {careLogForm.activityType === 'fungicide' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fungicide Used</label>
                  <input
                    type="text"
                    value={careLogForm.fungicide}
                    onChange={(e) => setCareLogForm({ ...careLogForm, fungicide: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Copper fungicide"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  type="text"
                  value={careLogForm.dosage}
                  onChange={(e) => setCareLogForm({ ...careLogForm, dosage: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 1 tbsp per gallon"
                />
              </div>
            </>
          )}

          {/* Repotting Fields */}
          {careLogForm.activityType === 'repotting' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-2xl">🪴</span>
                <div>
                  <h4 className="font-semibold text-blue-900">Repotting Details</h4>
                  <p className="text-xs text-blue-700">Track pot size and type changes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Pot Size (inches)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={careLogForm.fromPotSize}
                    onChange={(e) => setCareLogForm({ ...careLogForm, fromPotSize: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="e.g., 4"
                    readOnly
                    title="Auto-populated from current pot size"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Pot Size (inches) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={careLogForm.toPotSize}
                    onChange={(e) => setCareLogForm({ ...careLogForm, toPotSize: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Pot Type</label>
                  <input
                    type="text"
                    value={careLogForm.fromPotType}
                    onChange={(e) => setCareLogForm({ ...careLogForm, fromPotType: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="e.g., plastic"
                    readOnly
                    title="Auto-populated from current pot type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Pot Type</label>
                  <select
                    value={careLogForm.toPotType}
                    onChange={(e) => setCareLogForm({ ...careLogForm, toPotType: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select pot type...</option>
                    <option value="plastic">Plastic</option>
                    <option value="terracotta">Terracotta</option>
                    <option value="ceramic">Ceramic</option>
                    <option value="net_pot">Net Pot</option>
                    <option value="fabric">Fabric Pot</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddCareLog}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700"
            >
              Save Log Entry
            </button>
            <button
              onClick={handleCloseCareLogModal}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Morphology Modal */}
      <Modal
        isOpen={morphologyModalOpen}
        onClose={() => setMorphologyModalOpen(false)}
        title="Edit Morphology"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leaf Shape</label>
              <select
                value={morphologyForm.leafShape}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, leafShape: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select shape...</option>
                <option value="Cordate">Cordate (heart-shaped)</option>
                <option value="Sagittate">Sagittate (arrow-shaped)</option>
                <option value="Ovate">Ovate (egg-shaped)</option>
                <option value="Lanceolate">Lanceolate (lance-shaped)</option>
                <option value="Hastate">Hastate (halberd-shaped)</option>
                <option value="Reniform">Reniform (kidney-shaped)</option>
                <option value="Peltate">Peltate (shield-shaped)</option>
                <option value="Orbicular">Orbicular (circular)</option>
                <option value="Elliptic">Elliptic (ellipse)</option>
                <option value="Oblanceolate">Oblanceolate (reverse lance)</option>
                <option value="Obovate">Obovate (reverse egg)</option>
                <option value="Linear">Linear (narrow, parallel sides)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leaf Texture</label>
              <select
                value={morphologyForm.leafTexture}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, leafTexture: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select texture...</option>
                <option value="Velvety">Velvety</option>
                <option value="Coriaceous">Coriaceous (leathery)</option>
                <option value="Chartaceous">Chartaceous (papery)</option>
                <option value="Glabrous">Glabrous (smooth, hairless)</option>
                <option value="Pubescent">Pubescent (short hairs)</option>
                <option value="Hirsute">Hirsute (stiff hairs)</option>
                <option value="Tomentose">Tomentose (woolly)</option>
                <option value="Bullate">Bullate (puckered)</option>
                <option value="Rugose">Rugose (wrinkled)</option>
                <option value="Glossy">Glossy</option>
                <option value="Matte">Matte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leaf Color</label>
              <input
                type="text"
                value={morphologyForm.leafColor}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, leafColor: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Dark green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leaf Size</label>
              <select
                value={morphologyForm.leafSize}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, leafSize: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select size...</option>
                <option value="Very Small">Very Small (&lt;10cm / &lt;4in)</option>
                <option value="Small">Small (10-20cm / 4-8in)</option>
                <option value="Medium">Medium (20-40cm / 8-16in)</option>
                <option value="Large">Large (40-60cm / 16-24in)</option>
                <option value="Very Large">Very Large (60-100cm / 24-40in)</option>
                <option value="Giant">Giant (&gt;100cm / &gt;40in)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spadix Color</label>
              <input
                type="text"
                value={morphologyForm.spadixColor}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, spadixColor: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Yellow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spathe Color</label>
              <input
                type="text"
                value={morphologyForm.spatheColor}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, spatheColor: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Pink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spathe Shape</label>
              <select
                value={morphologyForm.spatheShape}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, spatheShape: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select shape...</option>
                <option value="Reflexed">Reflexed (bent backward)</option>
                <option value="Cucullate">Cucullate (hooded)</option>
                <option value="Convolute">Convolute (rolled)</option>
                <option value="Lanceolate">Lanceolate (lance-shaped)</option>
                <option value="Ovate">Ovate (egg-shaped)</option>
                <option value="Cordate">Cordate (heart-shaped)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Growth Rate</label>
              <select
                value={morphologyForm.growthRate}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, growthRate: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select rate...</option>
                <option value="Very Slow">Very Slow (1-2 leaves/year)</option>
                <option value="Slow">Slow (2-3 leaves/year)</option>
                <option value="Moderate">Moderate (3-5 leaves/year)</option>
                <option value="Fast">Fast (6-10 leaves/year)</option>
                <option value="Very Fast">Very Fast (10+ leaves/year)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mature Size</label>
              <select
                value={morphologyForm.matureSize}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, matureSize: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select size...</option>
                <option value="Miniature">Miniature (&lt;30cm / &lt;1ft)</option>
                <option value="Small">Small (30-60cm / 1-2ft)</option>
                <option value="Medium">Medium (60-120cm / 2-4ft)</option>
                <option value="Large">Large (120-180cm / 4-6ft)</option>
                <option value="Very Large">Very Large (180-250cm / 6-8ft)</option>
                <option value="Giant">Giant (&gt;250cm / &gt;8ft)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Petiole Color</label>
              <input
                type="text"
                value={morphologyForm.petioleColor}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, petioleColor: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cataphyll Color</label>
              <input
                type="text"
                value={morphologyForm.cataphyllColor}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, cataphyllColor: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Red"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Leaf Color</label>
              <input
                type="text"
                value={morphologyForm.newLeafColor}
                onChange={(e) => setMorphologyForm({ ...morphologyForm, newLeafColor: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Bronze"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdateMorphology}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700"
            >
              Save Morphology
            </button>
            <button
              onClick={() => setMorphologyModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={photoUploadModalOpen}
        onClose={() => setPhotoUploadModalOpen(false)}
        title="Upload Photo"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Click to select photo or drag and drop</p>
            <p className="text-sm text-gray-500">PNG, JPG, HEIC up to 10MB</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photo-upload"
              onChange={() => {
                // Photo upload will be implemented later
                alert('Photo upload functionality will be implemented soon!')
                setPhotoUploadModalOpen(false)
              }}
            />
            <label
              htmlFor="photo-upload"
              className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 cursor-pointer"
            >
              Select Photo
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
            <input
              type="text"
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Add a caption for this photo..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhotoUploadModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Overview Edit Modal */}
      <Modal
        isOpen={overviewModalOpen}
        onClose={() => setOverviewModalOpen(false)}
        title="Edit Plant Overview"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
            <input
              type="text"
              value={overviewForm.name}
              onChange={(e) => setOverviewForm({ ...overviewForm, name: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Hybrid #1 (Crystallinum x Magnificum)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
            <input
              type="text"
              value={overviewForm.species}
              onChange={(e) => setOverviewForm({ ...overviewForm, species: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., A. crystallinum x A. magnificum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cross Notation</label>
            <input
              type="text"
              value={overviewForm.crossNotation}
              onChange={(e) => setOverviewForm({ ...overviewForm, crossNotation: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., (RA8×RA5)², F1, Silver Veins"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={overviewForm.section}
              onChange={(e) => setOverviewForm({ ...overviewForm, section: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select section...</option>
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
              <option value="Dactylophyllum">Dactylophyllum</option>
              <option value="Polyneurium">Polyneurium</option>
              <option value="cross-section hybrid">cross-section hybrid</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost</label>
              <input
                type="number"
                value={overviewForm.acquisitionCost}
                onChange={(e) => setOverviewForm({ ...overviewForm, acquisitionCost: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
              <input
                type="date"
                value={overviewForm.acquisitionDate}
                onChange={(e) => setOverviewForm({ ...overviewForm, acquisitionDate: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
            <select
              value={overviewForm.healthStatus}
              onChange={(e) => setOverviewForm({ ...overviewForm, healthStatus: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select status</option>
              <option value="healthy">Healthy</option>
              <option value="recovering">Recovering</option>
              <option value="struggling">Struggling</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Propagation Type</label>
            <select
              value={overviewForm.propagationType}
              onChange={(e) => setOverviewForm({ ...overviewForm, propagationType: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select type...</option>
              <option value="seed">Seed - Grown from seed</option>
              <option value="cutting">Cutting - Stem/leaf cutting</option>
              <option value="tissue_culture">Tissue Culture - Lab propagated</option>
              <option value="division">Division - Offset/clone from mother plant</option>
              <option value="purchase">Purchase - Acquired as established plant</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 Division = genetically identical clone of parent plant
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generation</label>
              <select
                value={overviewForm.generation}
                onChange={(e) => setOverviewForm({ ...overviewForm, generation: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select generation...</option>
                <optgroup label="Cross-Pollinated (F-series)">
                  <option value="F1">F1 - First filial generation</option>
                  <option value="F2">F2 - Second filial generation</option>
                  <option value="F3">F3 - Third filial generation</option>
                  <option value="F4">F4 - Fourth filial generation</option>
                  <option value="F5">F5 - Fifth filial generation</option>
                  <option value="F6">F6 - Sixth filial generation</option>
                </optgroup>
                <optgroup label="Self-Pollinated (S-series)">
                  <option value="S1">S1 - First selfed generation</option>
                  <option value="S2">S2 - Second selfed generation</option>
                  <option value="S3">S3 - Third selfed generation</option>
                  <option value="S4">S4 - Fourth selfed generation</option>
                  <option value="S5">S5 - Fifth selfed generation</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="P1">P1 - Parent/Foundation</option>
                  <option value="BC1">BC1 - Backcross</option>
                  <option value="Clone">Clone/Division (same as parent)</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 For divisions/clones: Use "Clone" or same generation as mother plant
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breeder Code</label>
              <select
                value={overviewForm.breederCode}
                onChange={(e) => setOverviewForm({ ...overviewForm, breederCode: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select code...</option>
                <option value="RA">RA</option>
                <option value="OG">OG</option>
                <option value="NSE">NSE</option>
                <option value="TZ">TZ</option>
                <option value="SKG">SKG</option>
                <option value="Wu">Wu</option>
                <option value="EPP">EPP</option>
                <option value="SC">SC</option>
                <option value="DF">DF</option>
                <option value="FP">FP</option>
                <option value="custom">Custom (enter below)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breeder</label>
            <input
              type="text"
              value={overviewForm.breeder}
              onChange={(e) => setOverviewForm({ ...overviewForm, breeder: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., NSE Tropicals"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdateOverview}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={() => setOverviewModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Flowering Cycle Modal */}
      <Modal
        isOpen={floweringModalOpen}
        onClose={() => setFloweringModalOpen(false)}
        title={floweringForm.cycleId ? "Edit Flowering Cycle" : "Log Flowering Event"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spathe Emergence Date</label>
            <input
              type="date"
              value={floweringForm.spatheEmergence}
              onChange={(e) => setFloweringForm({ ...floweringForm, spatheEmergence: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">When the spathe first emerged</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Phase Start</label>
              <input
                type="date"
                value={floweringForm.femaleStart}
                onChange={(e) => setFloweringForm({ ...floweringForm, femaleStart: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Stigmas receptive</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Phase End</label>
              <input
                type="date"
                value={floweringForm.femaleEnd}
                onChange={(e) => setFloweringForm({ ...floweringForm, femaleEnd: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Phase Start</label>
              <input
                type="date"
                value={floweringForm.maleStart}
                onChange={(e) => setFloweringForm({ ...floweringForm, maleStart: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Pollen production begins</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Phase End</label>
              <input
                type="date"
                value={floweringForm.maleEnd}
                onChange={(e) => setFloweringForm({ ...floweringForm, maleEnd: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spathe Closed</label>
            <input
              type="date"
              value={floweringForm.spatheClose}
              onChange={(e) => setFloweringForm({ ...floweringForm, spatheClose: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">When the flowering cycle completed</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Pollen Management</h4>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="pollenCollected"
                checked={floweringForm.pollenCollected}
                onChange={(e) => setFloweringForm({ ...floweringForm, pollenCollected: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="pollenCollected" className="text-sm text-gray-700">Pollen Collected</label>
            </div>

            {floweringForm.pollenCollected && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pollen Quality</label>
                  <select
                    value={floweringForm.pollenQuality}
                    onChange={(e) => setFloweringForm({ ...floweringForm, pollenQuality: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select quality...</option>
                    <option value="abundant">Abundant</option>
                    <option value="moderate">Moderate</option>
                    <option value="sparse">Sparse</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="pollenStored"
                    checked={floweringForm.pollenStored}
                    onChange={(e) => setFloweringForm({ ...floweringForm, pollenStored: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="pollenStored" className="text-sm text-gray-700">Pollen Stored (refrigerated)</label>
                </div>

                {floweringForm.pollenStored && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Date</label>
                    <input
                      type="date"
                      value={floweringForm.pollenStorageDate}
                      onChange={(e) => setFloweringForm({ ...floweringForm, pollenStorageDate: e.target.value })}
                      className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={floweringForm.notes}
              onChange={(e) => setFloweringForm({ ...floweringForm, notes: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Notes about this flowering cycle..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveFloweringCycle}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700"
            >
              {floweringForm.cycleId ? 'Update Cycle' : 'Save Cycle'}
            </button>
            <button
              onClick={() => setFloweringModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Plant">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-red-700 text-sm">
              Deleting this plant will permanently remove:
            </p>
            <ul className="list-disc list-inside text-red-700 text-sm mt-2 ml-2">
              <li>All plant information and details</li>
              <li>All care logs and measurements</li>
              <li>All photos and documents</li>
              <li>All morphology data</li>
              <li>All flowering cycle records</li>
            </ul>
          </div>

          <p className="text-gray-700">
            Are you sure you want to permanently delete <span className="font-bold">{plant?.plantId}</span>
            {plant?.hybridName && <span> ({plant.hybridName})</span>}?
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePlant}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Care Log Confirmation Modal */}
      <Modal
        isOpen={!!careLogToDelete}
        onClose={() => setCareLogToDelete(null)}
        title="Delete Care Log"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-red-700 text-sm">
              This care log entry will be permanently deleted from the plant's history.
            </p>
          </div>

          <p className="text-gray-700">
            Are you sure you want to delete this care log entry?
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setCareLogToDelete(null)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCareLog}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={photoUploadModalOpen}
        onClose={() => {
          setPhotoUploadModalOpen(false)
          setSelectedFiles([])
          setPhotoForm({
            photoId: '',
            photoType: 'whole_plant',
            growthStage: '',
            notes: '',
            dateTaken: new Date().toISOString().split('T')[0]
          })
        }}
        title={photoForm.photoId ? "Edit Photo Details" : "Upload Photos"}
      >
        <div className="space-y-4">
          {/* Drag and Drop Area - Only show when uploading new photos */}
          {!photoForm.photoId && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              {isDragActive ? (
                <p className="text-emerald-600 font-medium">Drop photos here...</p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-1">
                    Drag & drop photos here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, WEBP, HEIC (iOS photos)
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Multiple files supported for batch upload
                  </p>
                </>
              )}
            </div>
          )}

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selected: {selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'}
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700 truncate max-w-xs">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo Type
              </label>
              <select
                value={photoForm.photoType}
                onChange={(e) => setPhotoForm({ ...photoForm, photoType: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="whole_plant">Whole Plant</option>
                <option value="leaf">Leaf Detail</option>
                <option value="spathe">Spathe</option>
                <option value="spadix">Spadix</option>
                <option value="roots">Roots</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Growth Stage
              </label>
              <select
                value={photoForm.growthStage}
                onChange={(e) => setPhotoForm({ ...photoForm, growthStage: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Not specified</option>
                <option value="seedling">Seedling</option>
                <option value="juvenile">Juvenile</option>
                <option value="mature">Mature</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Taken (optional)
            </label>
            <input
              type="date"
              value={photoForm.dateTaken}
              onChange={(e) => setPhotoForm({ ...photoForm, dateTaken: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              📸 Date will be automatically extracted from photo EXIF data if available
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={photoForm.notes}
              onChange={(e) => setPhotoForm({ ...photoForm, notes: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              placeholder="Add any notes about these photos..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setPhotoUploadModalOpen(false)
                setSelectedFiles([])
                setPhotoForm({
                  photoId: '',
                  photoType: 'whole_plant',
                  growthStage: '',
                  notes: '',
                  dateTaken: new Date().toISOString().split('T')[0]
                })
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
              disabled={uploadingPhoto}
            >
              Cancel
            </button>
            <button
              onClick={photoForm.photoId ? handleUpdatePhoto : handlePhotoUpload}
              disabled={uploadingPhoto || (!photoForm.photoId && selectedFiles.length === 0)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadingPhoto ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {photoForm.photoId ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                <>
                  {photoForm.photoId ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

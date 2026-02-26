'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { showToast } from '@/components/toast'
import { getTodayString } from '@/lib/timezone'
import {
  SECTIONS,
  BREEDER_CODES,
  HEALTH_STATUSES,
  PROPAGATION_TYPES,
  GENERATIONS,
  POT_TYPES,
} from '@/lib/plant-form-options'

// Maximum file size for Vercel Hobby tier (4.5MB, use 4MB with headroom)
const MAX_UPLOAD_SIZE_MB = 4

async function compressImage(file: File, maxSizeMB: number = MAX_UPLOAD_SIZE_MB): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) return file

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      const maxDim = 2000
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      const tryCompress = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Failed to compress image')); return }
            if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.5) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: file.lastModified,
              }))
            } else {
              tryCompress(quality - 0.1)
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryCompress(0.85)
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}

interface PlantOption {
  id: string
  plantId: string
  hybridName: string | null
  species: string | null
}

interface LocationOption {
  id: string
  name: string
}

export default function NewPlantPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [lineageOpen, setLineageOpen] = useState(false)
  const [plants, setPlants] = useState<PlantOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Form state — all optional except hybridName/species (at least one recommended)
  const [form, setForm] = useState({
    hybridName: '',
    species: '',
    section: '',
    crossNotation: '',
    breeder: '',
    breederCode: '',
    customBreederCode: '',
    propagationType: '',
    generation: '',
    accessionDate: '',
    acquisitionCost: '',
    marketValue: '',
    locationId: '',
    healthStatus: 'healthy',
    currentPotSize: '',
    currentPotType: '',
    substrate: '',
    femaleParentId: '',
    maleParentId: '',
    cloneSourceId: '',
    notes: '',
    isEliteGenetics: false,
    isMother: false,
    isForSale: false,
  })

  // Set accession date on client to avoid hydration mismatch
  useEffect(() => {
    setForm(f => ({ ...f, accessionDate: getTodayString() }))
  }, [])

  // Fetch plants and locations for dropdowns
  useEffect(() => {
    fetch('/api/plants')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlants(data.map((p: any) => ({
            id: p.id,
            plantId: p.plantId,
            hybridName: p.hybridName,
            species: p.species,
          })))
        }
      })
      .catch(() => {})

    fetch('/api/locations')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLocations(data)
      })
      .catch(() => {})
  }, [])

  // Photo dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.webp'] },
    maxFiles: 1,
  })

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const update = (field: string, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.hybridName && !form.species) {
      showToast({ type: 'error', title: 'Name required', message: 'Enter a hybrid name or species.' })
      return
    }

    setSubmitting(true)
    try {
      // 1. Create the plant
      const breederCode = form.breederCode === 'custom' ? form.customBreederCode : form.breederCode
      const res = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hybridName: form.hybridName || null,
          species: form.species || null,
          section: form.section || null,
          crossNotation: form.crossNotation || null,
          breeder: form.breeder || null,
          breederCode: breederCode || null,
          propagationType: form.propagationType || null,
          generation: form.generation || null,
          accessionDate: form.accessionDate || undefined,
          acquisitionCost: form.acquisitionCost || null,
          marketValue: form.marketValue || null,
          locationId: form.locationId || null,
          healthStatus: form.healthStatus,
          currentPotSize: form.currentPotSize || null,
          currentPotType: form.currentPotType || null,
          femaleParentId: form.femaleParentId || null,
          maleParentId: form.maleParentId || null,
          cloneSourceId: form.cloneSourceId || null,
          notes: [form.substrate ? `Substrate: ${form.substrate}` : '', form.notes].filter(Boolean).join('\n') || null,
          isEliteGenetics: form.isEliteGenetics,
          isMother: form.isMother,
          isForSale: form.isForSale,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast({ type: 'error', title: 'Failed to create plant', message: err.error || 'Please try again.' })
        setSubmitting(false)
        return
      }

      const plant = await res.json()

      // 2. Upload cover photo if selected
      if (photoFile) {
        try {
          const compressed = await compressImage(photoFile)
          const formData = new FormData()
          formData.append('file', compressed)
          formData.append('plantId', plant.id)
          formData.append('photoType', 'whole_plant')
          formData.append('photoContext', 'progress')

          const photoRes = await fetch('/api/photos', {
            method: 'POST',
            body: formData,
          })

          if (photoRes.ok) {
            const photoData = await photoRes.json()
            // 3. Set as cover photo
            if (photoData.photo?.id) {
              await fetch(`/api/plants/${plant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverPhotoId: photoData.photo.id }),
              })
            }
          } else {
            showToast({ type: 'warning', title: 'Plant created', message: 'Photo upload failed — you can add photos later.' })
          }
        } catch {
          showToast({ type: 'warning', title: 'Plant created', message: 'Photo upload failed — you can add photos later.' })
        }
      }

      showToast({ type: 'success', title: 'Plant created', message: `${form.hybridName || form.species} added to collection.` })
      router.push(`/plants/${plant.id}`)
    } catch (error) {
      console.error('Create plant failed:', error)
      showToast({ type: 'error', title: 'Network error', message: 'Could not reach server.' })
      setSubmitting(false)
    }
  }

  // Helper to display plant name in dropdowns
  const plantLabel = (p: PlantOption) =>
    `${p.plantId} — ${p.hybridName || p.species || 'Unknown'}`

  const inputClass = 'w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]'
  const labelClass = 'block text-sm text-[var(--bark)] mb-1'

  return (
    <div className="min-h-screen bg-[var(--parchment)]">
      {/* Header */}
      <div className="bg-white border-b border-black/[0.08] sticky top-0 sm:top-12 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/plants" className="p-1.5 hover:bg-black/[0.04] rounded transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--bark)]" />
          </Link>
          <h1 className="text-lg font-semibold text-[var(--forest)]">Add New Plant</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN — Form fields */}
          <div className="flex-1 space-y-6">
            {/* IDENTITY */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide mb-4">Identity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Hybrid Name</label>
                  <input value={form.hybridName} onChange={e => update('hybridName', e.target.value)} className={inputClass} placeholder="e.g., RA8 x RA5" />
                </div>
                <div>
                  <label className={labelClass}>Species</label>
                  <input value={form.species} onChange={e => update('species', e.target.value)} className={inputClass} placeholder="e.g., papillilaminum" />
                </div>
                <div>
                  <label className={labelClass}>Section</label>
                  <select value={form.section} onChange={e => update('section', e.target.value)} className={inputClass}>
                    <option value="">Select section...</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cross Notation</label>
                  <input value={form.crossNotation} onChange={e => update('crossNotation', e.target.value)} className={inputClass} placeholder="e.g., (RA8 x RA5)^2" />
                </div>
              </div>
            </section>

            {/* PROVENANCE & SOURCE */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide mb-4">Provenance & Source</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Breeder</label>
                  <input value={form.breeder} onChange={e => update('breeder', e.target.value)} className={inputClass} placeholder="e.g., NSE Tropicals" />
                </div>
                <div>
                  <label className={labelClass}>Breeder Code</label>
                  <select value={form.breederCode} onChange={e => update('breederCode', e.target.value)} className={inputClass}>
                    <option value="">Select code...</option>
                    {BREEDER_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="custom">Custom (enter below)</option>
                  </select>
                  {form.breederCode === 'custom' && (
                    <input
                      value={form.customBreederCode}
                      onChange={e => update('customBreederCode', e.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="Enter custom code..."
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Propagation Type</label>
                  <select value={form.propagationType} onChange={e => update('propagationType', e.target.value)} className={inputClass}>
                    <option value="">Select type...</option>
                    {PROPAGATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Generation</label>
                  <select value={form.generation} onChange={e => update('generation', e.target.value)} className={inputClass}>
                    <option value="">Select generation...</option>
                    <optgroup label="Cross-Pollinated (F-series)">
                      {GENERATIONS.cross.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </optgroup>
                    <optgroup label="Self-Pollinated (S-series)">
                      {GENERATIONS.selfed.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </optgroup>
                    <optgroup label="Other">
                      {GENERATIONS.other.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Accession Date</label>
                  <input type="date" value={form.accessionDate} onChange={e => update('accessionDate', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Acquisition Cost ($)</label>
                  <input type="number" value={form.acquisitionCost} onChange={e => update('acquisitionCost', e.target.value)} className={inputClass} placeholder="e.g., 250" />
                </div>
                <div>
                  <label className={labelClass}>Market Value ($)</label>
                  <input type="number" value={form.marketValue} onChange={e => update('marketValue', e.target.value)} className={inputClass} placeholder="e.g., 400" />
                </div>
              </div>
            </section>

            {/* LOCATION & CONTAINER */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide mb-4">Location & Container</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Location</label>
                  <select value={form.locationId} onChange={e => update('locationId', e.target.value)} className={inputClass}>
                    <option value="">Select location...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Health Status</label>
                  <select value={form.healthStatus} onChange={e => update('healthStatus', e.target.value)} className={inputClass}>
                    {HEALTH_STATUSES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Pot Size (inches)</label>
                  <input type="number" step="0.5" value={form.currentPotSize} onChange={e => update('currentPotSize', e.target.value)} className={inputClass} placeholder="e.g., 4" />
                </div>
                <div>
                  <label className={labelClass}>Pot Type</label>
                  <select value={form.currentPotType} onChange={e => update('currentPotType', e.target.value)} className={inputClass}>
                    <option value="">Select pot type...</option>
                    {POT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Substrate</label>
                  <input value={form.substrate} onChange={e => update('substrate', e.target.value)} className={inputClass} placeholder="e.g., TFF + chopped sphagnum + perlite" />
                </div>
              </div>
            </section>

            {/* LINEAGE — Collapsible */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <button
                type="button"
                onClick={() => setLineageOpen(!lineageOpen)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide">Lineage</h2>
                {lineageOpen ? <ChevronDown className="w-4 h-4 text-[var(--clay)]" /> : <ChevronRight className="w-4 h-4 text-[var(--clay)]" />}
              </button>
              {lineageOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>Female Parent</label>
                    <select value={form.femaleParentId} onChange={e => update('femaleParentId', e.target.value)} className={inputClass}>
                      <option value="">None</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{plantLabel(p)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Male Parent</label>
                    <select value={form.maleParentId} onChange={e => update('maleParentId', e.target.value)} className={inputClass}>
                      <option value="">None</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{plantLabel(p)}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Clone Source</label>
                    <select value={form.cloneSourceId} onChange={e => update('cloneSourceId', e.target.value)} className={inputClass}>
                      <option value="">None (not a clone)</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{plantLabel(p)}</option>)}
                    </select>
                    <p className="text-xs text-[var(--clay)] mt-1">For divisions, tissue culture, or cuttings from an existing plant</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN — Photo, notes, flags (sticky on desktop) */}
          <div className="lg:w-80 space-y-6 lg:sticky lg:top-[4.75rem] lg:self-start">
            {/* COVER PHOTO */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide mb-4">Cover Photo</h2>
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="w-full aspect-[3/4] object-cover rounded-lg" />
                  <button
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-[var(--moss)] bg-[var(--moss)]/5' : 'border-black/[0.12] hover:border-[var(--moss)]'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 text-[var(--clay)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--bark)]">
                    {isDragActive ? 'Drop photo here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-[var(--clay)] mt-1">JPG, PNG, HEIC, WebP</p>
                </div>
              )}
            </section>

            {/* NOTES */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide mb-4">Notes</h2>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                className={`${inputClass} h-24 resize-none`}
                placeholder="Any notes about this plant..."
              />
            </section>

            {/* FLAGS */}
            <section className="bg-white border border-black/[0.08] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--forest)] uppercase tracking-wide mb-4">Flags</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isEliteGenetics}
                    onChange={e => update('isEliteGenetics', e.target.checked)}
                    className="w-4 h-4 rounded border-black/[0.2] text-[var(--forest)] focus:ring-[var(--moss)]"
                  />
                  <span className="text-sm text-[var(--bark)]">Elite Genetics</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isMother}
                    onChange={e => update('isMother', e.target.checked)}
                    className="w-4 h-4 rounded border-black/[0.2] text-[var(--forest)] focus:ring-[var(--moss)]"
                  />
                  <span className="text-sm text-[var(--bark)]">Mother Plant</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isForSale}
                    onChange={e => update('isForSale', e.target.checked)}
                    className="w-4 h-4 rounded border-black/[0.2] text-[var(--forest)] focus:ring-[var(--moss)]"
                  />
                  <span className="text-sm text-[var(--bark)]">For Sale</span>
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div
        className="sticky bottom-0 z-10 bg-white border-t border-black/[0.08]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-end gap-3">
          <Link
            href="/plants"
            className="px-5 py-2 rounded border border-black/[0.08] text-sm text-[var(--bark)] hover:bg-[var(--parchment)] transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded bg-[var(--forest)] text-white text-sm hover:bg-[var(--moss)] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Plant'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/modal'
import { Droplet, FileText, Dna, Ruler, Leaf, Bug, RefreshCw, Pill, CloudRain } from 'lucide-react'
import { getTodayString } from '@/lib/timezone'
import type { JournalEntryType } from './JournalTab'

interface JournalEntryModalProps {
  isOpen: boolean
  onClose: () => void
  initialType: JournalEntryType
  onSubmitCare: (data: CareLogFormData) => Promise<void>
  onSubmitNote: (data: NoteFormData) => Promise<void>
  onSubmitMorphology: (data: MorphologyFormData) => Promise<void>
  onSubmitMeasurement: (data: MeasurementFormData) => Promise<void>
  useBaselineFeed?: boolean
  onBaselineFeedChange?: (value: boolean) => void
}

export interface CareLogFormData {
  activityType: string
  notes: string
  fertilizer: string
  pesticide: string
  fungicide: string
  dosage: string
  inputEC: string
  inputPH: string
  outputEC: string
  outputPH: string
  rainAmount: string
  rainDuration: string
  date: string
  pestType: string
  severity: string
  affectedArea: string
  fromPotSize: string
  toPotSize: string
  fromPotType: string
  toPotType: string
  substrateType: string
  drainageType: string
  substrateMix: string
}

export interface NoteFormData {
  content: string
  date: string
}

export interface MorphologyFormData {
  leafShape: string
  leafTexture: string
  leafColor: string
  leafSize: string
  spadixColor: string
  spatheColor: string
  spatheShape: string
  growthRate: string
  matureSize: string
  petioleColor: string
  cataphyllColor: string
  newLeafColor: string
}

export interface MeasurementFormData {
  ecValue: string
  phValue: string
  tdsValue: string
  notes: string
  measurementDate: string
}

const ENTRY_TYPES: { key: JournalEntryType; label: string; icon: React.ReactNode }[] = [
  { key: 'care', label: 'Care Log', icon: <Droplet className="w-4 h-4" /> },
  { key: 'note', label: 'Note', icon: <FileText className="w-4 h-4" /> },
  { key: 'morphology', label: 'Morphology', icon: <Dna className="w-4 h-4" /> },
  { key: 'measurement', label: 'Measurement', icon: <Ruler className="w-4 h-4" /> },
]

const CARE_ACTIVITIES = [
  { value: 'watering', label: 'Watering', icon: Droplet },
  { value: 'feeding', label: 'Feeding', icon: Leaf },
  { value: 'repotting', label: 'Repotting', icon: RefreshCw },
  { value: 'treatment', label: 'Treatment', icon: Pill },
  { value: 'pest_discovery', label: 'Pest Discovery', icon: Bug },
  { value: 'disease_discovery', label: 'Disease Discovery', icon: Bug },
  { value: 'rain', label: 'Rain Event', icon: CloudRain },
]

export function JournalEntryModal({
  isOpen,
  onClose,
  initialType,
  onSubmitCare,
  onSubmitNote,
  onSubmitMorphology,
  onSubmitMeasurement,
  useBaselineFeed = false,
  onBaselineFeedChange
}: JournalEntryModalProps) {
  const [entryType, setEntryType] = useState<JournalEntryType>(initialType)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [careForm, setCareForm] = useState<CareLogFormData>({
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
    date: getTodayString(),
    pestType: '',
    severity: '',
    affectedArea: '',
    fromPotSize: '',
    toPotSize: '',
    fromPotType: '',
    toPotType: '',
    substrateType: '',
    drainageType: '',
    substrateMix: ''
  })

  const [noteForm, setNoteForm] = useState<NoteFormData>({
    content: '',
    date: getTodayString()
  })

  const [morphologyForm, setMorphologyForm] = useState<MorphologyFormData>({
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

  const [measurementForm, setMeasurementForm] = useState<MeasurementFormData>({
    ecValue: '',
    phValue: '',
    tdsValue: '',
    notes: '',
    measurementDate: getTodayString()
  })

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (isOpen) {
      setEntryType(initialType)
    }
  }, [isOpen, initialType])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      switch (entryType) {
        case 'care':
          await onSubmitCare(careForm)
          break
        case 'note':
          await onSubmitNote(noteForm)
          break
        case 'morphology':
          await onSubmitMorphology(morphologyForm)
          break
        case 'measurement':
          await onSubmitMeasurement(measurementForm)
          break
      }
      onClose()
    } catch (error) {
      console.error('Error submitting entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCareForm = () => (
    <div className="space-y-4">
      {/* Activity Type Selector */}
      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-2">Activity Type</label>
        <div className="grid grid-cols-4 gap-2">
          {CARE_ACTIVITIES.map(activity => {
            const Icon = activity.icon
            return (
              <button
                key={activity.value}
                type="button"
                onClick={() => setCareForm({ ...careForm, activityType: activity.value })}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  careForm.activityType === activity.value
                    ? 'border-[var(--forest)] bg-[var(--forest)]/10 text-[var(--forest)]'
                    : 'border-black/[0.08] text-[var(--clay)] hover:border-[var(--moss)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{activity.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-1">Date</label>
        <input
          type="date"
          value={careForm.date}
          onChange={(e) => setCareForm({ ...careForm, date: e.target.value })}
          className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
        />
      </div>

      {/* EC/pH for watering/feeding */}
      {(careForm.activityType === 'watering' || careForm.activityType === 'feeding') && (
        <>
          {/* Baseline feed toggle for watering */}
          {careForm.activityType === 'watering' && onBaselineFeedChange && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useBaselineFeed}
                onChange={(e) => onBaselineFeedChange(e.target.checked)}
                className="w-4 h-4 rounded border-black/[0.08] text-[var(--forest)] focus:ring-[var(--moss)]"
              />
              <span className="text-sm text-[var(--bark)]">Include baseline feed</span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Input EC</label>
              <input
                type="number"
                step="0.01"
                value={careForm.inputEC}
                onChange={(e) => setCareForm({ ...careForm, inputEC: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., 1.2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Input pH</label>
              <input
                type="number"
                step="0.1"
                value={careForm.inputPH}
                onChange={(e) => setCareForm({ ...careForm, inputPH: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., 6.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Output EC</label>
              <input
                type="number"
                step="0.01"
                value={careForm.outputEC}
                onChange={(e) => setCareForm({ ...careForm, outputEC: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., 1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Output pH</label>
              <input
                type="number"
                step="0.1"
                value={careForm.outputPH}
                onChange={(e) => setCareForm({ ...careForm, outputPH: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., 5.8"
              />
            </div>
          </div>

          {careForm.activityType === 'feeding' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--bark)] mb-1">Fertilizer</label>
                <input
                  type="text"
                  value={careForm.fertilizer}
                  onChange={(e) => setCareForm({ ...careForm, fertilizer: e.target.value })}
                  className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                  placeholder="e.g., MSU 13-3-15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--bark)] mb-1">Dosage</label>
                <input
                  type="text"
                  value={careForm.dosage}
                  onChange={(e) => setCareForm({ ...careForm, dosage: e.target.value })}
                  className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                  placeholder="e.g., 1/4 tsp/gal"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Repotting fields */}
      {careForm.activityType === 'repotting' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">From Pot Size</label>
              <input
                type="text"
                value={careForm.fromPotSize}
                onChange={(e) => setCareForm({ ...careForm, fromPotSize: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder='e.g., 4"'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">To Pot Size</label>
              <input
                type="text"
                value={careForm.toPotSize}
                onChange={(e) => setCareForm({ ...careForm, toPotSize: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder='e.g., 5"'
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Substrate Mix</label>
            <input
              type="text"
              value={careForm.substrateMix}
              onChange={(e) => setCareForm({ ...careForm, substrateMix: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              placeholder="e.g., Dave 4.0 - bark/perlite/LECA"
            />
          </div>
        </div>
      )}

      {/* Pest/Disease fields */}
      {(careForm.activityType === 'pest_discovery' || careForm.activityType === 'disease_discovery') && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">
              {careForm.activityType === 'pest_discovery' ? 'Pest Type' : 'Disease Type'}
            </label>
            <input
              type="text"
              value={careForm.pestType}
              onChange={(e) => setCareForm({ ...careForm, pestType: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              placeholder={careForm.activityType === 'pest_discovery' ? 'e.g., Thrips, Spider mites' : 'e.g., Root rot, Bacterial leaf spot'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Severity</label>
              <select
                value={careForm.severity}
                onChange={(e) => setCareForm({ ...careForm, severity: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              >
                <option value="">Select...</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Affected Area</label>
              <input
                type="text"
                value={careForm.affectedArea}
                onChange={(e) => setCareForm({ ...careForm, affectedArea: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., New growth, all leaves"
              />
            </div>
          </div>
        </div>
      )}

      {/* Treatment fields */}
      {careForm.activityType === 'treatment' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Pesticide</label>
              <input
                type="text"
                value={careForm.pesticide}
                onChange={(e) => setCareForm({ ...careForm, pesticide: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., Spinosad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bark)] mb-1">Fungicide</label>
              <input
                type="text"
                value={careForm.fungicide}
                onChange={(e) => setCareForm({ ...careForm, fungicide: e.target.value })}
                className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
                placeholder="e.g., Copper fungicide"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Dosage</label>
            <input
              type="text"
              value={careForm.dosage}
              onChange={(e) => setCareForm({ ...careForm, dosage: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              placeholder="e.g., 2 tbsp/gal"
            />
          </div>
        </div>
      )}

      {/* Rain fields */}
      {careForm.activityType === 'rain' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Amount (inches)</label>
            <input
              type="text"
              value={careForm.rainAmount}
              onChange={(e) => setCareForm({ ...careForm, rainAmount: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              placeholder="e.g., 0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--bark)] mb-1">Duration</label>
            <input
              type="text"
              value={careForm.rainDuration}
              onChange={(e) => setCareForm({ ...careForm, rainDuration: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
              placeholder="e.g., 2 hours"
            />
          </div>
        </div>
      )}

      {/* Notes (always shown) */}
      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-1">Notes</label>
        <textarea
          value={careForm.notes}
          onChange={(e) => setCareForm({ ...careForm, notes: e.target.value })}
          className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)] min-h-20"
          placeholder="Any additional observations..."
        />
      </div>
    </div>
  )

  const renderNoteForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-1">Date</label>
        <input
          type="date"
          value={noteForm.date}
          onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
          className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-1">Note</label>
        <textarea
          value={noteForm.content}
          onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
          className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)] min-h-32"
          placeholder="Write your observation, thought, or note..."
          autoFocus
        />
      </div>
    </div>
  )

  const renderMorphologyForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Leaf Shape</label>
          <input
            type="text"
            value={morphologyForm.leafShape}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, leafShape: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Cordate"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Leaf Texture</label>
          <input
            type="text"
            value={morphologyForm.leafTexture}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, leafTexture: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Velvety"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Leaf Color</label>
          <input
            type="text"
            value={morphologyForm.leafColor}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, leafColor: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Dark green with silver veins"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Leaf Size</label>
          <input
            type="text"
            value={morphologyForm.leafSize}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, leafSize: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder='e.g., 8" x 6"'
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Spathe Color</label>
          <input
            type="text"
            value={morphologyForm.spatheColor}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, spatheColor: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Deep purple"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Spadix Color</label>
          <input
            type="text"
            value={morphologyForm.spadixColor}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, spadixColor: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Cream to pink"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Growth Rate</label>
          <select
            value={morphologyForm.growthRate}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, growthRate: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
          >
            <option value="">Select...</option>
            <option value="slow">Slow</option>
            <option value="moderate">Moderate</option>
            <option value="fast">Fast</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Mature Size</label>
          <input
            type="text"
            value={morphologyForm.matureSize}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, matureSize: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder='e.g., 24" span'
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Petiole Color</label>
          <input
            type="text"
            value={morphologyForm.petioleColor}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, petioleColor: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Green"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">Cataphyll Color</label>
          <input
            type="text"
            value={morphologyForm.cataphyllColor}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, cataphyllColor: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Red"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">New Leaf Color</label>
          <input
            type="text"
            value={morphologyForm.newLeafColor}
            onChange={(e) => setMorphologyForm({ ...morphologyForm, newLeafColor: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., Bronze"
          />
        </div>
      </div>
    </div>
  )

  const renderMeasurementForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-1">Date</label>
        <input
          type="date"
          value={measurementForm.measurementDate}
          onChange={(e) => setMeasurementForm({ ...measurementForm, measurementDate: e.target.value })}
          className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">EC Value</label>
          <input
            type="number"
            step="0.01"
            value={measurementForm.ecValue}
            onChange={(e) => setMeasurementForm({ ...measurementForm, ecValue: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., 1.2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">pH Value</label>
          <input
            type="number"
            step="0.1"
            value={measurementForm.phValue}
            onChange={(e) => setMeasurementForm({ ...measurementForm, phValue: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., 6.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--bark)] mb-1">TDS (ppm)</label>
          <input
            type="number"
            value={measurementForm.tdsValue}
            onChange={(e) => setMeasurementForm({ ...measurementForm, tdsValue: e.target.value })}
            className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)]"
            placeholder="e.g., 600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--bark)] mb-1">Notes</label>
        <textarea
          value={measurementForm.notes}
          onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
          className="w-full p-2 rounded border border-black/[0.08] focus:outline-none focus:border-[var(--moss)] min-h-20"
          placeholder="Measurement conditions, observations..."
        />
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Journal Entry"
    >
      <div className="space-y-4">
        {/* Entry Type Selector */}
        <div className="flex gap-1 p-1 bg-[var(--parchment)] rounded-lg">
          {ENTRY_TYPES.map(type => (
            <button
              key={type.key}
              onClick={() => setEntryType(type.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors ${
                entryType === type.key
                  ? 'bg-white text-[var(--forest)] shadow-sm'
                  : 'text-[var(--clay)] hover:text-[var(--bark)]'
              }`}
            >
              {type.icon}
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {entryType === 'care' && renderCareForm()}
          {entryType === 'note' && renderNoteForm()}
          {entryType === 'morphology' && renderMorphologyForm()}
          {entryType === 'measurement' && renderMeasurementForm()}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-black/[0.08]">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-[var(--forest)] text-white rounded hover:bg-[var(--moss)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-black/[0.08] rounded text-[var(--bark)] hover:bg-[var(--parchment)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

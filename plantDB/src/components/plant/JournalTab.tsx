'use client'

import { useState, useMemo } from 'react'
import {
  Droplet,
  FileText,
  Dna,
  Ruler,
  Plus,
  Edit,
  Trash2,
  Filter,
  Leaf,
  Bug,
  RefreshCw,
  Pill,
  CloudRain,
  Bot,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Flower2
} from 'lucide-react'

export type JournalEntryType = 'care' | 'note' | 'morphology' | 'measurement' | 'ai' | 'flowering'

interface CareLog {
  id: string
  date: string
  action?: string
  activityType?: string
  inputEC?: number | null
  inputPH?: number | null
  outputEC?: number | null
  outputPH?: number | null
  details?: string | any
}

interface Trait {
  id: string
  category: string
  traitName: string
  value: string
  observationDate: string
}

interface Measurement {
  id: string
  measurementDate: string
  ecValue?: number | null
  phValue?: number | null
  tdsValue?: number | null
  notes?: string
}

interface ChatLogMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface ChatLog {
  id: string
  title?: string | null
  messages: string | ChatLogMessage[] // JSON string or parsed array
  confidence: string // unverified, verified, partially_verified, disputed
  qualityScore?: number | null // 0-4 HITL rating
  wasEdited?: boolean
  conversationDate: string
  savedAt: string
}

interface PlantJournalEntry {
  id: string
  entry: string
  entryType: string
  timestamp: string
  context?: string
  author?: string
  referenceType?: string  // CareLog, ChatLog, etc. - used to filter out duplicates
  referenceId?: string
}

interface FloweringCycle {
  id: string
  spatheEmergence?: string | null
  spatheClose?: string | null
  femaleStart?: string | null
  femaleEnd?: string | null
  maleStart?: string | null
  maleEnd?: string | null
  pollenCollected?: boolean
  pollenQuality?: string | null
  pollenStored?: boolean
  notes?: string | null
}

interface JournalTabProps {
  careLogs: CareLog[]
  traits: Trait[]
  measurements: Measurement[]
  chatLogs?: ChatLog[]
  journalEntries?: PlantJournalEntry[]
  floweringCycles?: FloweringCycle[]
  notes?: string // Plant notes field
  onEditCareLog: (log: CareLog) => void
  onDeleteCareLog: (logId: string) => void
  onAddEntry: (type: JournalEntryType) => void
  onEditChatLog?: (log: ChatLog) => void
  onDeleteChatLog?: (logId: string) => void
  onEditTrait?: (trait: Trait) => void
  onDeleteTrait?: (traitId: string) => void
  onEditMeasurement?: (measurement: Measurement) => void
  onDeleteMeasurement?: (measurementId: string) => void
  onDeleteNote?: (entryId: string) => void
  onEditFlowering?: (cycle: FloweringCycle) => void
  onDeleteFlowering?: (cycleId: string) => void
}

interface JournalEntry {
  id: string
  type: JournalEntryType
  date: Date
  title: string
  subtitle?: string
  details?: string
  icon: React.ReactNode
  iconBg: string
  raw: any
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  watering: <Droplet className="w-4 h-4" />,
  feeding: <Leaf className="w-4 h-4" />,
  fertilizing: <Leaf className="w-4 h-4" />,
  repotting: <RefreshCw className="w-4 h-4" />,
  treatment: <Pill className="w-4 h-4" />,
  pest_discovery: <Bug className="w-4 h-4" />,
  disease_discovery: <Bug className="w-4 h-4" />,
  rain: <CloudRain className="w-4 h-4" />,
}

const ACTIVITY_COLORS: Record<string, string> = {
  watering: 'bg-[var(--water-blue)]/20 text-[var(--water-blue)]',
  feeding: 'bg-[var(--moss)]/20 text-[var(--moss)]',
  fertilizing: 'bg-[var(--moss)]/20 text-[var(--moss)]',
  repotting: 'bg-[var(--spadix-yellow)]/20 text-[var(--spadix-yellow)]',
  treatment: 'bg-[var(--alert-red)]/20 text-[var(--alert-red)]',
  pest_discovery: 'bg-[var(--alert-red)]/20 text-[var(--alert-red)]',
  disease_discovery: 'bg-[var(--alert-red)]/20 text-[var(--alert-red)]',
  rain: 'bg-[var(--water-blue)]/20 text-[var(--water-blue)]',
}

const CONFIDENCE_ICONS: Record<string, React.ReactNode> = {
  unverified: <ShieldQuestion className="w-3 h-3" />,
  verified: <ShieldCheck className="w-3 h-3" />,
  partially_verified: <Shield className="w-3 h-3" />,
  disputed: <ShieldAlert className="w-3 h-3" />,
}

const CONFIDENCE_COLORS: Record<string, string> = {
  unverified: 'text-[var(--clay)]',
  verified: 'text-green-600',
  partially_verified: 'text-amber-600',
  disputed: 'text-red-600',
}

export function JournalTab({
  careLogs,
  traits,
  measurements,
  chatLogs = [],
  journalEntries: plantJournalEntries = [],
  floweringCycles = [],
  notes,
  onEditCareLog,
  onDeleteCareLog,
  onAddEntry,
  onEditChatLog,
  onDeleteChatLog,
  onEditTrait,
  onDeleteTrait,
  onEditMeasurement,
  onDeleteMeasurement,
  onDeleteNote,
  onEditFlowering,
  onDeleteFlowering
}: JournalTabProps) {
  const [activeFilter, setActiveFilter] = useState<JournalEntryType | 'all'>('all')
  const [expandedChatLogs, setExpandedChatLogs] = useState<Set<string>>(new Set())

  // Transform all data into unified journal entries
  const journalEntriesData = useMemo(() => {
    const entries: JournalEntry[] = []

    // Care logs
    careLogs.forEach(log => {
      const activityType = log.action || log.activityType || 'care'
      let details: any = {}
      let notesText = ''

      if (log.details) {
        try {
          details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
          notesText = details.notes || ''
        } catch {
          notesText = log.details
        }
      }

      // Build EC/pH subtitle
      const ecPhParts: string[] = []
      if (log.inputEC || log.inputPH) {
        ecPhParts.push(`In: EC ${log.inputEC?.toFixed(2) || '-'} / pH ${log.inputPH?.toFixed(1) || '-'}`)
      }
      if (log.outputEC || log.outputPH) {
        ecPhParts.push(`Out: EC ${log.outputEC?.toFixed(2) || '-'} / pH ${log.outputPH?.toFixed(1) || '-'}`)
      }

      entries.push({
        id: `care-${log.id}`,
        type: 'care',
        date: new Date(log.date),
        title: activityType.charAt(0).toUpperCase() + activityType.slice(1).replace(/_/g, ' '),
        subtitle: ecPhParts.join(' → '),
        details: notesText,
        icon: ACTIVITY_ICONS[activityType] || <Droplet className="w-4 h-4" />,
        iconBg: ACTIVITY_COLORS[activityType] || 'bg-[var(--clay)]/20 text-[var(--clay)]',
        raw: log
      })
    })

    // Group traits by observation date for morphology entries
    const traitsByDate = traits.reduce((acc, trait) => {
      const dateKey = trait.observationDate ? new Date(trait.observationDate).toDateString() : 'Unknown'
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(trait)
      return acc
    }, {} as Record<string, Trait[]>)

    Object.entries(traitsByDate).forEach(([dateKey, dateTraits]) => {
      const traitSummary = dateTraits
        .slice(0, 3)
        .map(t => `${t.traitName}: ${t.value}`)
        .join(', ')

      entries.push({
        id: `morph-${dateKey}`,
        type: 'morphology',
        date: dateKey !== 'Unknown' ? new Date(dateKey) : new Date(0),
        title: 'Morphology Observation',
        subtitle: `${dateTraits.length} trait${dateTraits.length > 1 ? 's' : ''} recorded`,
        details: traitSummary,
        icon: <Dna className="w-4 h-4" />,
        iconBg: 'bg-[var(--forest)]/20 text-[var(--forest)]',
        raw: dateTraits
      })
    })

    // Measurements
    measurements.forEach(m => {
      const parts: string[] = []
      if (m.ecValue) parts.push(`EC ${m.ecValue.toFixed(2)}`)
      if (m.phValue) parts.push(`pH ${m.phValue.toFixed(1)}`)
      if (m.tdsValue) parts.push(`TDS ${m.tdsValue}`)

      entries.push({
        id: `meas-${m.id}`,
        type: 'measurement',
        date: new Date(m.measurementDate),
        title: 'Measurement',
        subtitle: parts.join(' / ') || 'No values recorded',
        details: m.notes,
        icon: <Ruler className="w-4 h-4" />,
        iconBg: 'bg-[var(--bark)]/20 text-[var(--bark)]',
        raw: m
      })
    })

    // AI Chat Logs
    chatLogs.forEach(log => {
      // Parse messages if they're a string
      const messages: ChatLogMessage[] = typeof log.messages === 'string'
        ? JSON.parse(log.messages)
        : log.messages

      // Get first user message for preview
      const firstUserMsg = messages.find(m => m.role === 'user')
      const preview = firstUserMsg?.content.slice(0, 100) + (firstUserMsg?.content && firstUserMsg.content.length > 100 ? '...' : '')

      entries.push({
        id: `ai-${log.id}`,
        type: 'ai',
        date: new Date(log.conversationDate),
        title: log.title || 'AI Consultation',
        subtitle: `${messages.length} messages`,
        details: preview,
        icon: <Bot className="w-4 h-4" />,
        iconBg: 'bg-purple-100 text-purple-600',
        raw: { ...log, parsedMessages: messages }
      })
    })

    // Plant Journal Entries (Notes)
    // Filter out entries that reference CareLogs - those are system-generated summaries
    // that duplicate the CareLog entries already displayed above
    plantJournalEntries
      .filter(entry => entry.referenceType !== 'CareLog')
      .forEach(entry => {
        const preview = entry.entry.slice(0, 150) + (entry.entry.length > 150 ? '...' : '')

        entries.push({
          id: `note-${entry.id}`,
          type: 'note',
          date: new Date(entry.timestamp),
          title: 'Note',
          subtitle: entry.author === 'system' ? 'System note' : undefined,
          details: preview,
          icon: <FileText className="w-4 h-4" />,
          iconBg: 'bg-amber-100 text-amber-600',
          raw: entry
        })
      })

    // Flowering Cycles
    floweringCycles.forEach(cycle => {
      const cycleDate = cycle.spatheEmergence ? new Date(cycle.spatheEmergence) : new Date()

      // Determine current phase for subtitle
      let phase = 'Spathe emerging'
      if (cycle.spatheClose) phase = 'Cycle complete'
      else if (cycle.maleEnd) phase = 'Male phase ended'
      else if (cycle.maleStart) phase = 'Male phase'
      else if (cycle.femaleEnd) phase = 'Female phase ended'
      else if (cycle.femaleStart) phase = 'Female phase'

      const details: string[] = []
      if (cycle.pollenCollected) details.push(`Pollen: ${cycle.pollenQuality || 'collected'}${cycle.pollenStored ? ' (stored)' : ''}`)
      if (cycle.notes) details.push(cycle.notes)

      entries.push({
        id: `flowering-${cycle.id}`,
        type: 'flowering',
        date: cycleDate,
        title: 'Flowering Cycle',
        subtitle: phase,
        details: details.join(' • ') || undefined,
        icon: <Flower2 className="w-4 h-4" />,
        iconBg: 'bg-pink-100 text-pink-600',
        raw: cycle
      })
    })

    // Sort by date descending
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [careLogs, traits, measurements, chatLogs, plantJournalEntries, floweringCycles])

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (activeFilter === 'all') return journalEntriesData
    return journalEntriesData.filter(e => e.type === activeFilter)
  }, [journalEntriesData, activeFilter])

  const filters: { key: JournalEntryType | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Filter className="w-3.5 h-3.5" /> },
    { key: 'care', label: 'Care', icon: <Droplet className="w-3.5 h-3.5" /> },
    { key: 'flowering', label: 'Flower', icon: <Flower2 className="w-3.5 h-3.5" /> },
    { key: 'note', label: 'Notes', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'morphology', label: 'Morph', icon: <Dna className="w-3.5 h-3.5" /> },
    { key: 'measurement', label: 'Meas', icon: <Ruler className="w-3.5 h-3.5" /> },
    { key: 'ai', label: 'AI', icon: <Bot className="w-3.5 h-3.5" /> },
  ]

  const toggleChatLogExpanded = (id: string) => {
    setExpandedChatLogs(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-[var(--parchment)] rounded-lg flex-1 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                activeFilter === f.key
                  ? 'bg-white text-[var(--forest)] shadow-sm font-medium'
                  : 'text-[var(--clay)] hover:text-[var(--bark)]'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onAddEntry(activeFilter === 'all' ? 'care' : activeFilter)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--forest)] text-white rounded-lg hover:bg-[var(--moss)] transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Timeline */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-3">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="bg-[var(--parchment)] rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${entry.iconBg}`}>
                  {entry.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--bark)]">{entry.title}</p>
                      <p className="text-xs text-[var(--clay)]">{formatDate(entry.date)}</p>
                    </div>

                    {/* Actions for care logs */}
                    {entry.type === 'care' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditCareLog(entry.raw)}
                          className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-white rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCareLog(entry.raw.id)}
                          className="p-1.5 text-[var(--clay)] hover:text-[var(--alert-red)] hover:bg-white rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Actions for AI logs */}
                    {entry.type === 'ai' && (
                      <div className="flex items-center gap-2">
                        {/* Quality score badge */}
                        {entry.raw.qualityScore !== null && entry.raw.qualityScore !== undefined && (
                          <span
                            className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                              entry.raw.qualityScore >= 3 ? 'bg-green-100 text-green-700' :
                              entry.raw.qualityScore >= 2 ? 'bg-blue-100 text-blue-700' :
                              entry.raw.qualityScore >= 1 ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}
                            title={`HITL Quality: ${entry.raw.qualityScore}/4 - ${['Marginal', 'OK', 'Good', 'Great', 'Reference'][entry.raw.qualityScore]}`}
                          >
                            {entry.raw.qualityScore}/4
                          </span>
                        )}
                        {/* Edited badge */}
                        {entry.raw.wasEdited && (
                          <span className="text-xs text-[var(--clay)]" title="Content was edited before saving">
                            (edited)
                          </span>
                        )}
                        {/* Legacy confidence badge - only show if no quality score */}
                        {(entry.raw.qualityScore === null || entry.raw.qualityScore === undefined) && (
                          <span className={`flex items-center gap-1 text-xs ${CONFIDENCE_COLORS[entry.raw.confidence] || CONFIDENCE_COLORS.unverified}`} title={`Confidence: ${entry.raw.confidence}`}>
                            {CONFIDENCE_ICONS[entry.raw.confidence] || CONFIDENCE_ICONS.unverified}
                            {entry.raw.confidence === 'verified' ? 'Verified' : entry.raw.confidence === 'disputed' ? 'Disputed' : ''}
                          </span>
                        )}
                        <div className="flex gap-1">
                          {onEditChatLog && (
                            <button
                              onClick={() => onEditChatLog(entry.raw)}
                              className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-white rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteChatLog && (
                            <button
                              onClick={() => onDeleteChatLog(entry.raw.id)}
                              className="p-1.5 text-[var(--clay)] hover:text-[var(--alert-red)] hover:bg-white rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => toggleChatLogExpanded(entry.id)}
                            className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-white rounded transition-colors"
                            title={expandedChatLogs.has(entry.id) ? 'Collapse' : 'Expand'}
                          >
                            {expandedChatLogs.has(entry.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions for morphology (expand to see individual traits) */}
                    {entry.type === 'morphology' && (onEditTrait || onDeleteTrait) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleChatLogExpanded(entry.id)}
                          className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-white rounded transition-colors"
                          title={expandedChatLogs.has(entry.id) ? 'Collapse' : 'Expand to edit'}
                        >
                          {expandedChatLogs.has(entry.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Actions for measurements */}
                    {entry.type === 'measurement' && (onEditMeasurement || onDeleteMeasurement) && (
                      <div className="flex gap-1">
                        {onEditMeasurement && (
                          <button
                            onClick={() => onEditMeasurement(entry.raw)}
                            className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteMeasurement && (
                          <button
                            onClick={() => onDeleteMeasurement(entry.raw.id)}
                            className="p-1.5 text-[var(--clay)] hover:text-[var(--alert-red)] hover:bg-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions for notes */}
                    {entry.type === 'note' && onDeleteNote && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onDeleteNote(entry.raw.id)}
                          className="p-1.5 text-[var(--clay)] hover:text-[var(--alert-red)] hover:bg-white rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Actions for flowering */}
                    {entry.type === 'flowering' && (onEditFlowering || onDeleteFlowering) && (
                      <div className="flex gap-1">
                        {onEditFlowering && (
                          <button
                            onClick={() => onEditFlowering(entry.raw)}
                            className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteFlowering && (
                          <button
                            onClick={() => onDeleteFlowering(entry.raw.id)}
                            className="p-1.5 text-[var(--clay)] hover:text-[var(--alert-red)] hover:bg-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {entry.subtitle && (
                    <p className="text-sm text-[var(--bark)] mt-1 font-mono">{entry.subtitle}</p>
                  )}
                  {entry.details && entry.type !== 'ai' && (
                    <p className="text-sm text-[var(--clay)] mt-1">{entry.details}</p>
                  )}

                  {/* AI conversation preview/expanded */}
                  {entry.type === 'ai' && (
                    <>
                      {!expandedChatLogs.has(entry.id) && entry.details && (
                        <p className="text-sm text-[var(--clay)] mt-1 italic">&ldquo;{entry.details}&rdquo;</p>
                      )}
                      {expandedChatLogs.has(entry.id) && entry.raw.parsedMessages && (
                        <div className="mt-3 space-y-2 border-t border-black/[0.05] pt-3">
                          {(entry.raw.parsedMessages as ChatLogMessage[]).map((msg, idx) => (
                            <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-[var(--bark)]' : 'text-[var(--clay)]'}`}>
                              <span className={`font-medium ${msg.role === 'user' ? 'text-[var(--moss)]' : 'text-purple-600'}`}>
                                {msg.role === 'user' ? 'You: ' : 'AI: '}
                              </span>
                              <span className="whitespace-pre-wrap">{msg.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Morphology traits expanded view with individual edit/delete */}
                  {entry.type === 'morphology' && expandedChatLogs.has(entry.id) && Array.isArray(entry.raw) && (
                    <div className="mt-3 space-y-2 border-t border-black/[0.05] pt-3">
                      {(entry.raw as Trait[]).map((trait) => (
                        <div key={trait.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[var(--bark)]">{trait.traitName}: </span>
                            <span className="text-sm text-[var(--clay)]">{trait.value}</span>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {onEditTrait && (
                              <button
                                onClick={() => onEditTrait(trait)}
                                className="p-1 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-[var(--parchment)] rounded transition-colors"
                                title="Edit trait"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteTrait && (
                              <button
                                onClick={() => onDeleteTrait(trait.id)}
                                className="p-1 text-[var(--clay)] hover:text-[var(--alert-red)] hover:bg-[var(--parchment)] rounded transition-colors"
                                title="Delete trait"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--parchment)] mb-3">
            <FileText className="w-6 h-6 text-[var(--clay)]" />
          </div>
          <p className="text-[var(--clay)]">
            {activeFilter === 'all'
              ? 'No journal entries yet'
              : `No ${activeFilter} entries yet`}
          </p>
          <button
            onClick={() => onAddEntry(activeFilter === 'all' ? 'care' : activeFilter)}
            className="mt-3 text-sm text-[var(--moss)] hover:text-[var(--forest)]"
          >
            Add your first entry
          </button>
        </div>
      )}
    </div>
  )
}

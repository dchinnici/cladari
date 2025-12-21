'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Edit3, Check } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface SaveChatModalProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  plantId: string
  onSave: (data: SaveData) => Promise<void>
  onSaveNegative: (data: NegativeData) => Promise<void>
}

interface SaveData {
  messages: ChatMessage[]
  qualityScore: number
  displayContent?: string
  originalContent: string
}

interface NegativeData {
  messages: ChatMessage[]
  originalContent: string
  failureType?: string
  failureNotes?: string
}

const QUALITY_LABELS = [
  { score: 0, label: 'Meh', description: 'Factually correct but shallow or obvious' },
  { score: 1, label: 'OK', description: 'Solid analysis, nothing special' },
  { score: 2, label: 'Good', description: 'Useful insights, well-structured' },
  { score: 3, label: 'Great', description: 'Novel connections, high confidence' },
  { score: 4, label: 'Ref', description: 'Reference quality, cite-worthy' },
]

const FAILURE_TYPES = [
  { value: 'hallucination', label: 'Hallucination', description: 'Made up facts or wrong info' },
  { value: 'missed_context', label: 'Missed Context', description: "Didn't use available data" },
  { value: 'factual_error', label: 'Factual Error', description: 'Wrong calculation or fact' },
  { value: 'irrelevant', label: 'Irrelevant', description: 'Off-topic or unhelpful' },
  { value: 'incomplete', label: 'Incomplete', description: 'Stopped short or missing info' },
  { value: 'wrong_tone', label: 'Wrong Tone', description: 'Too casual or inappropriate' },
  { value: 'other', label: 'Other', description: 'Something else' },
]

export function SaveChatModal({
  isOpen,
  onClose,
  messages,
  plantId,
  onSave,
  onSaveNegative,
}: SaveChatModalProps) {
  const [mode, setMode] = useState<'score' | 'negative' | 'edit'>('score')
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [failureType, setFailureType] = useState<string>('')
  const [failureNotes, setFailureNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Get the last assistant message (the one being evaluated)
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
  const originalContent = lastAssistantMessage?.content || ''

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('score')
      setSelectedScore(null)
      setIsEditing(false)
      setEditedContent(originalContent)
      setFailureType('')
      setFailureNotes('')
    }
  }, [isOpen, originalContent])

  if (!isOpen) return null

  const handleScoreClick = async (score: number) => {
    setSelectedScore(score)
    setIsSaving(true)
    try {
      await onSave({
        messages,
        qualityScore: score,
        originalContent,
        displayContent: isEditing && editedContent !== originalContent ? editedContent : undefined,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNegative = async () => {
    if (!failureType) return
    setIsSaving(true)
    try {
      await onSaveNegative({
        messages,
        originalContent,
        failureType,
        failureNotes: failureNotes || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save negative:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
          <h2 className="text-lg font-semibold text-[var(--bark)]">
            {mode === 'negative' ? 'Mark as Bad Example' : 'Save to Journal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--clay)] hover:text-[var(--bark)] hover:bg-black/[0.04] rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'score' && (
            <>
              {/* Response Preview / Edit */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--bark)]">
                    AI Response
                  </label>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      isEditing
                        ? 'bg-[var(--moss)] text-white'
                        : 'bg-[var(--parchment)] text-[var(--bark)] hover:bg-[var(--parchment)]/80'
                    }`}
                  >
                    <Edit3 size={12} />
                    {isEditing ? 'Editing' : 'Edit'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-48 p-3 text-sm border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--moss)] focus:border-transparent font-mono"
                    placeholder="Edit the AI response..."
                  />
                ) : (
                  <div className="h-48 overflow-y-auto p-3 text-sm bg-[var(--parchment)] rounded-lg">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {editedContent.length > 500
                        ? editedContent.slice(0, 500) + '...'
                        : editedContent}
                    </div>
                  </div>
                )}

                {isEditing && editedContent !== originalContent && (
                  <p className="text-xs text-[var(--moss)] mt-1">
                    Content has been edited. Original will be preserved.
                  </p>
                )}
              </div>

              {/* Quality Score Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-[var(--bark)] block mb-3">
                  How useful is this analysis?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {QUALITY_LABELS.map(({ score, label, description }) => (
                    <button
                      key={score}
                      onClick={() => handleScoreClick(score)}
                      disabled={isSaving}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                        selectedScore === score
                          ? 'border-[var(--moss)] bg-[var(--moss)]/10'
                          : 'border-black/[0.08] hover:border-[var(--moss)]/50 hover:bg-[var(--parchment)]'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-2xl font-bold text-[var(--forest)]">{score}</span>
                      <span className="text-xs font-medium text-[var(--bark)] mt-1">{label}</span>
                      <span className="text-[10px] text-[var(--clay)] mt-0.5 text-center leading-tight">
                        {description}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--clay)] mt-2 text-center">
                  Click a score to save immediately
                </p>
              </div>
            </>
          )}

          {mode === 'negative' && (
            <>
              {/* Failure Type Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-[var(--bark)] block mb-2">
                  What went wrong?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FAILURE_TYPES.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() => setFailureType(value)}
                      className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left ${
                        failureType === value
                          ? 'border-[var(--alert-red)] bg-[var(--alert-red)]/10'
                          : 'border-black/[0.08] hover:border-[var(--alert-red)]/50'
                      }`}
                    >
                      <span className="text-sm font-medium text-[var(--bark)]">{label}</span>
                      <span className="text-xs text-[var(--clay)]">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Failure Notes */}
              <div className="mb-4">
                <label className="text-sm font-medium text-[var(--bark)] block mb-2">
                  Notes (optional but valuable for training)
                </label>
                <textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  className="w-full h-24 p-3 text-sm border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--alert-red)] focus:border-transparent"
                  placeholder="What specifically was wrong? What should it have said instead?"
                />
              </div>

              {/* Save Negative Button */}
              <button
                onClick={handleSaveNegative}
                disabled={!failureType || isSaving}
                className="w-full py-3 px-4 bg-[var(--alert-red)] text-white rounded-lg font-medium hover:bg-[var(--alert-red)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Save as Bad Example
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer - Mode Toggle */}
        <div className="px-4 py-3 border-t border-black/[0.08] flex items-center justify-between bg-[var(--parchment)]">
          {mode === 'score' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-[var(--clay)] hover:text-[var(--bark)] transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => setMode('negative')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--alert-red)] bg-[var(--alert-red)]/10 rounded hover:bg-[var(--alert-red)]/20 transition-colors"
              >
                <AlertTriangle size={14} />
                Bad Example
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMode('score')}
                className="px-4 py-2 text-sm text-[var(--clay)] hover:text-[var(--bark)] transition-colors"
              >
                ← Back to Scoring
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-[var(--clay)] hover:text-[var(--bark)] transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

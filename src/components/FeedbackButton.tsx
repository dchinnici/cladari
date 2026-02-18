'use client'

import { useState } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'

const CATEGORIES = ['Bug', 'Feature Request', 'Question', 'General']

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState('General')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          page: window.location.pathname,
        }),
      })

      if (res.ok) {
        setStatus('sent')
        setTimeout(() => {
          setIsOpen(false)
          setMessage('')
          setCategory('General')
          setStatus('idle')
        }, 1500)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors flex items-center gap-1.5"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--forest)]">Send Feedback</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-black/[0.04] rounded transition-colors"
              >
                <X className="w-5 h-5 text-[var(--clay)]" />
              </button>
            </div>

            {status === 'sent' ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium text-[var(--forest)]">Thanks for the feedback!</p>
                <p className="text-sm text-[var(--clay)] mt-1">We'll review it shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--bark)] mb-1.5">
                    Category
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          category === cat
                            ? 'bg-[var(--forest)] text-white border-[var(--forest)]'
                            : 'border-black/10 text-[var(--bark)] hover:bg-black/[0.04]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--bark)] mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="What's on your mind? Bug reports, feature ideas, or general thoughts..."
                    rows={4}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20 focus:border-[var(--forest)] resize-none"
                    required
                    autoFocus
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-500">Failed to send. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending' || !message.trim()}
                  className="w-full py-2.5 px-4 bg-[var(--forest)] text-white font-medium rounded-lg hover:bg-[var(--moss)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {status === 'sending' ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** Compact version for mobile bottom nav */
export function FeedbackButtonMobile() {
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState('General')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          page: window.location.pathname,
        }),
      })

      if (res.ok) {
        setStatus('sent')
        setTimeout(() => {
          setIsOpen(false)
          setMessage('')
          setCategory('General')
          setStatus('idle')
        }, 1500)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center text-red-500 active:text-red-600"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Feedback</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--forest)]">Send Feedback</h2>
              <button onClick={() => setIsOpen(false)} className="p-1">
                <X className="w-5 h-5 text-[var(--clay)]" />
              </button>
            </div>

            {status === 'sent' ? (
              <div className="text-center py-6">
                <p className="text-lg font-medium text-[var(--forest)]">Thanks!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {['Bug', 'Feature', 'Question', 'General'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat === 'Feature' ? 'Feature Request' : cat)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        (cat === 'Feature' ? 'Feature Request' : cat) === category
                          ? 'bg-[var(--forest)] text-white border-[var(--forest)]'
                          : 'border-black/10 text-[var(--bark)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20 resize-none"
                  required
                  autoFocus
                />
                {status === 'error' && <p className="text-xs text-red-500">Failed to send.</p>}
                <button
                  type="submit"
                  disabled={status === 'sending' || !message.trim()}
                  className="w-full py-2.5 bg-[var(--forest)] text-white font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {status === 'sending' ? 'Sending...' : 'Send'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

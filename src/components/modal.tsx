'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const lastInteraction = useRef<number>(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Record when modal opened to prevent immediate close
      lastInteraction.current = Date.now()
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Prevent accidental closes (e.g., during rotation)
  const handleBackdropClick = () => {
    // Require at least 300ms since modal opened before allowing backdrop close
    if (Date.now() - lastInteraction.current > 300) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Backdrop - doesn't scroll */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleBackdropClick}
      />

      {/* Modal container - handles positioning */}
      {/* Bottom padding must clear: bottom nav (h-14 = 3.5rem) + safe area + buffer */}
      <div
        className="absolute inset-0 flex items-start sm:items-center justify-center px-4 pt-4 sm:pt-8 pointer-events-none pb-20 sm:pb-8"
        style={{
          paddingBottom: 'max(5rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)))'
        }}
      >
        {/* Modal box - scrollable */}
        {/* Max height leaves room for: top padding + bottom nav + safe area + buffer */}
        <div
          className="relative bg-white rounded-lg max-w-md w-full shadow-xl flex flex-col pointer-events-auto"
          style={{
            maxHeight: 'calc(100vh - 8rem - env(safe-area-inset-bottom, 0px))',
            marginBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed header */}
          <div className="flex items-center justify-between p-5 pb-4 border-b border-black/[0.04] flex-shrink-0">
            <h2 className="text-lg font-semibold text-[var(--forest)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-black/[0.04] rounded transition-colors"
            >
              <X className="w-4 h-4 text-[var(--clay)]" />
            </button>
          </div>
          {/* Scrollable content - contains scroll within modal */}
          <div
            className="flex-1 p-5 pt-4 pb-6 overflow-y-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { Droplet, Utensils, FileText, Camera } from 'lucide-react'

interface QuickActionsProps {
  onWater: () => void
  onFeed: () => void
  onNote: () => void
  onPhoto: () => void
}

export function QuickActions({ onWater, onFeed, onNote, onPhoto }: QuickActionsProps) {
  const actions = [
    {
      id: 'water',
      label: 'Water',
      icon: Droplet,
      onClick: onWater,
      className: 'bg-[var(--water-blue)] hover:bg-[var(--water-blue)]/80 text-white'
    },
    {
      id: 'feed',
      label: 'Feed',
      icon: Utensils,
      onClick: onFeed,
      className: 'bg-[var(--moss)] hover:bg-[var(--forest)] text-white'
    },
    {
      id: 'note',
      label: 'Note',
      icon: FileText,
      onClick: onNote,
      className: 'bg-[var(--bark)] hover:bg-[var(--bark)]/80 text-white'
    },
    {
      id: 'photo',
      label: 'Photo',
      icon: Camera,
      onClick: onPhoto,
      className: 'bg-[var(--spadix-yellow)] hover:bg-[var(--spadix-yellow)]/80 text-white'
    }
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(action => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-colors ${action.className}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}

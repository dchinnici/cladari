'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_EC_INPUT, DEFAULT_PH_INPUT, DEFAULT_BASELINE_NOTES } from '@/lib/constants'

interface BaselineSettings {
  ec: number
  ph: number
  notes: string
  loaded: boolean
}

/**
 * Fetches the user's baseline feed settings from their profile.
 * Falls back to app-wide defaults (constants.ts) if the user
 * hasn't configured their own values yet.
 */
export function useBaselineSettings(): BaselineSettings {
  const [settings, setSettings] = useState<BaselineSettings>({
    ec: DEFAULT_EC_INPUT,
    ph: DEFAULT_PH_INPUT,
    notes: DEFAULT_BASELINE_NOTES,
    loaded: false,
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSettings({
            ec: data.baselineEC ?? DEFAULT_EC_INPUT,
            ph: data.baselinePH ?? DEFAULT_PH_INPUT,
            notes: data.baselineNotes ?? DEFAULT_BASELINE_NOTES,
            loaded: true,
          })
        } else {
          setSettings(prev => ({ ...prev, loaded: true }))
        }
      })
      .catch(() => {
        setSettings(prev => ({ ...prev, loaded: true }))
      })
  }, [])

  return settings
}

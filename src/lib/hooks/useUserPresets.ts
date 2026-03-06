'use client'

import { useState, useEffect } from 'react'

export interface SubstrateMix {
  id: string
  name: string
  description: string
}

export interface IPMProduct {
  id: string
  name: string
  dosage: string
  category: string // miticide, fungicide, insecticide, bactericide, general
}

interface UserPresets {
  substrateMixes: SubstrateMix[]
  ipmProducts: IPMProduct[]
  loaded: boolean
}

export function useUserPresets(): UserPresets {
  const [presets, setPresets] = useState<UserPresets>({
    substrateMixes: [],
    ipmProducts: [],
    loaded: false,
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setPresets({
            substrateMixes: Array.isArray(data.substrateMixes) ? data.substrateMixes : [],
            ipmProducts: Array.isArray(data.ipmProducts) ? data.ipmProducts : [],
            loaded: true,
          })
        } else {
          setPresets(prev => ({ ...prev, loaded: true }))
        }
      })
      .catch(() => {
        setPresets(prev => ({ ...prev, loaded: true }))
      })
  }, [])

  return presets
}

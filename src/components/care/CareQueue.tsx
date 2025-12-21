'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Droplets, Leaf, AlertCircle, ChevronRight, Clock, Calendar, Zap } from 'lucide-react'
import { showToast } from '../toast'
import {
  WATERING_THRESHOLD_DAYS,
  FERTILIZING_THRESHOLD_DAYS,
  STALE_ACTIVITY_THRESHOLD_DAYS,
  EC_CRITICAL_THRESHOLD,
  PH_MIN_THRESHOLD,
  PH_MAX_THRESHOLD,
} from '@/lib/constants'
import { getWateringStatus, getFertilizingThresholds } from '@/lib/care-thresholds'

// Static class mappings for Tailwind JIT compilation
// Dynamic template strings like `bg-${color}-50` don't work with Tailwind's purge
const TAB_STYLES = {
  blue: {
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-500',
    badgeBg: 'bg-blue-500',
  },
  green: {
    activeBg: 'bg-green-50',
    activeBorder: 'border-green-500',
    activeText: 'text-green-500',
    badgeBg: 'bg-green-500',
  },
  red: {
    activeBg: 'bg-red-50',
    activeBorder: 'border-red-500',
    activeText: 'text-red-500',
    badgeBg: 'bg-red-500',
  },
} as const

interface CareQueueProps {
  onQuickCare?: (plantIds: string[]) => void
}

export default function CareQueue({ onQuickCare }: CareQueueProps) {
  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'water' | 'fertilize' | 'critical'>('water')

  useEffect(() => {
    fetchPlants()
  }, [])

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants')
      const data = await response.json()
      if (Array.isArray(data)) {
        setPlants(data)
      }
    } catch (error) {
      console.error('Error fetching plants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate plants needing care using dynamic thresholds
  const plantsNeedingWater = plants.filter(plant => {
    if (plant.isArchived) return false
    const careLogs = plant.careLogs || []
    const status = getWateringStatus(careLogs)

    // Show if warning or overdue based on plant's personal rhythm
    if (status.status === 'warning' || status.status === 'overdue') {
      return true
    }

    // Also check if new plant with no care logs
    if (careLogs.length === 0) {
      const daysSinceAdded = Math.floor((Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceAdded >= WATERING_THRESHOLD_DAYS
    }

    return false
  }).slice(0, 5) // Top 5

  const plantsNeedingFertilizer = plants.filter(plant => {
    if (plant.isArchived) return false
    const careLogs = plant.careLogs || []
    const thresholds = getFertilizingThresholds(careLogs)

    const lastFertilize = careLogs.find((log: any) =>
      ['fertilize', 'fertilizing', 'incremental_feed'].includes(log.action?.toLowerCase())
    )

    if (!lastFertilize) {
      // Only show as needing fertilizer if plant has been in collection for at least threshold days
      const daysSinceAdded = Math.floor((Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceAdded >= thresholds.warningDays
    }

    const daysSince = Math.floor((Date.now() - new Date(lastFertilize.date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= thresholds.warningDays
  }).slice(0, 5)

  const criticalPlants = plants.filter(plant => {
    if (plant.isArchived) return false

    // Check for high EC or problematic pH
    const lastMeasurement = plant.careLogs?.find((log: any) => {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
        return details?.ecOut > EC_CRITICAL_THRESHOLD ||
               details?.phIn < PH_MIN_THRESHOLD ||
               details?.phIn > PH_MAX_THRESHOLD
      } catch {
        return false
      }
    })

    // Check for ACTIVE pest/disease (discovered but not yet treated)
    let hasActivePest = false
    const pestDiscovery = plant.careLogs?.find((log: any) =>
      log.action?.toLowerCase() === 'pest_discovery' || log.action?.toLowerCase() === 'disease_discovery'
    )
    if (pestDiscovery) {
      // Check if there's a treatment AFTER the discovery
      const discoveryDate = new Date(pestDiscovery.date).getTime()
      const hasTreatment = plant.careLogs?.some((log: any) => {
        const logDate = new Date(log.date).getTime()
        return (log.action?.toLowerCase() === 'pest_treatment' || log.action?.toLowerCase() === 'disease_treatment')
          && logDate >= discoveryDate
      })
      hasActivePest = !hasTreatment
    }

    // Check for stale (no recent activity)
    const lastActivity = plant.lastActivityDate || plant.updatedAt
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))

    return lastMeasurement || hasActivePest || daysSinceActivity >= STALE_ACTIVITY_THRESHOLD_DAYS
  }).slice(0, 5)

  const getDaysSince = (plant: any, actionType: string) => {
    const lastLog = plant.careLogs?.find((log: any) => {
      if (actionType === 'water') {
        // Include rain and fertilizing as watering events
        return ['water', 'watering', 'rain', 'fertilizing', 'fertilize', 'incremental_feed'].includes(log.action?.toLowerCase())
      }
      return log.action?.toLowerCase().includes(actionType)
    })

    if (!lastLog) {
      // If no matching log but plant has other logs, return a different indicator
      if (plant.careLogs?.length > 0) {
        return -1 // Indicates plant has logs but not of this type
      }
      return null // No logs at all
    }
    return Math.floor((Date.now() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24))
  }

  const handleQuickAction = (plantId: string) => {
    if (onQuickCare) {
      onQuickCare([plantId])
    }
  }

  const handleBulkAction = () => {
    let plantIds: string[] = []
    if (selectedTab === 'water') {
      plantIds = plantsNeedingWater.map(p => p.id)
    } else if (selectedTab === 'fertilize') {
      plantIds = plantsNeedingFertilizer.map(p => p.id)
    } else {
      plantIds = criticalPlants.map(p => p.id)
    }

    if (onQuickCare && plantIds.length > 0) {
      onQuickCare(plantIds)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'water', label: 'Water', icon: Droplets, count: plantsNeedingWater.length, color: 'blue' as const },
    { id: 'fertilize', label: 'Feed', icon: Leaf, count: plantsNeedingFertilizer.length, color: 'green' as const },
    { id: 'critical', label: 'Critical', icon: AlertCircle, count: criticalPlants.length, color: 'red' as const },
  ]

  const currentList =
    selectedTab === 'water' ? plantsNeedingWater :
    selectedTab === 'fertilize' ? plantsNeedingFertilizer :
    criticalPlants

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Care Queue
        </h3>
        <p className="text-white/80 text-sm">Plants needing immediate attention</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = selectedTab === tab.id
          const styles = TAB_STYLES[tab.color]
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                isActive
                  ? `${styles.activeBg} border-b-2 ${styles.activeBorder}`
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? styles.activeText : 'text-gray-500'}`} />
              <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? `${styles.badgeBg} text-white`
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Plant List */}
      <div className="p-4">
        {currentList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">🎉 All caught up!</p>
            <p className="text-sm">No plants need {selectedTab === 'water' ? 'watering' : selectedTab === 'fertilize' ? 'feeding' : 'critical attention'}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {currentList.map((plant) => {
                const daysSince = getDaysSince(plant, selectedTab === 'fertilize' ? 'fertiliz' : selectedTab)
                return (
                  <div
                    key={plant.id}
                    className="group flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/plants/${plant.id}`}
                        className="font-medium text-gray-900 hover:text-emerald-600"
                      >
                        {plant.hybridName || plant.species || plant.plantId}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {daysSince === -1 ? (
                          <span className="text-gray-500">No {selectedTab} logs</span>
                        ) : daysSince !== null ? (
                          <span>{daysSince} days ago</span>
                        ) : (
                          <span className="text-amber-600">Never logged</span>
                        )}
                        {plant.currentLocation && (
                          <>
                            <span>•</span>
                            <span>{plant.currentLocation.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickAction(plant.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-all"
                        title="Quick log"
                      >
                        <Zap className="w-3 h-3" />
                      </button>
                      <Link
                        href={`/plants/${plant.id}`}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bulk Action Button */}
            {currentList.length > 0 && (
              <button
                onClick={handleBulkAction}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Log {selectedTab === 'water' ? 'Water' : selectedTab === 'fertilize' ? 'Feed' : 'Care'} for All ({currentList.length})
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer with keyboard shortcut hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Cmd+K</kbd> for Quick Care
      </div>
    </div>
  )
}
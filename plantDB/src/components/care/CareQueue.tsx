'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Droplets, Leaf, AlertCircle, ChevronRight, Clock, Calendar, Zap } from 'lucide-react'
import { showToast } from '../toast'

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

  // Calculate plants needing care
  const plantsNeedingWater = plants.filter(plant => {
    if (plant.isArchived) return false
    const lastWater = plant.careLogs?.find((log: any) =>
      ['water', 'watering'].includes(log.action?.toLowerCase())
    )
    if (!lastWater) return true
    const daysSince = Math.floor((Date.now() - new Date(lastWater.date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= 5
  }).slice(0, 5) // Top 5

  const plantsNeedingFertilizer = plants.filter(plant => {
    if (plant.isArchived) return false
    const lastFertilize = plant.careLogs?.find((log: any) =>
      ['fertilize', 'fertilizing', 'incremental_feed'].includes(log.action?.toLowerCase())
    )
    if (!lastFertilize) return true
    const daysSince = Math.floor((Date.now() - new Date(lastFertilize.date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= 14
  }).slice(0, 5)

  const criticalPlants = plants.filter(plant => {
    if (plant.isArchived) return false

    // Check for high EC
    const lastMeasurement = plant.careLogs?.find((log: any) => {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
      return details?.ecOut > 2.0 || details?.phIn < 5.5 || details?.phIn > 7.0
    })

    // Check for pest/disease
    const hasPest = plant.careLogs?.find((log: any) =>
      log.action?.toLowerCase().includes('pest') || log.action?.toLowerCase().includes('disease')
    )

    // Check for stale (no activity in 10+ days)
    const lastActivity = plant.lastActivityDate || plant.updatedAt
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))

    return lastMeasurement || hasPest || daysSinceActivity >= 10
  }).slice(0, 5)

  const getDaysSince = (plant: any, actionType: string) => {
    const lastLog = plant.careLogs?.find((log: any) => {
      if (actionType === 'water') {
        return ['water', 'watering'].includes(log.action?.toLowerCase())
      }
      return log.action?.toLowerCase().includes(actionType)
    })

    if (!lastLog) return null
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
    { id: 'water', label: 'Water', icon: Droplets, count: plantsNeedingWater.length, color: 'blue' },
    { id: 'fertilize', label: 'Feed', icon: Leaf, count: plantsNeedingFertilizer.length, color: 'green' },
    { id: 'critical', label: 'Critical', icon: AlertCircle, count: criticalPlants.length, color: 'red' },
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
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                isActive
                  ? `bg-${tab.color}-50 border-b-2 border-${tab.color}-500`
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? `text-${tab.color}-500` : 'text-gray-500'}`} />
              <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? `bg-${tab.color}-500 text-white`
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
                        {daysSince !== null ? (
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
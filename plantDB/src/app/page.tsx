'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle, Droplets, Clock, ChevronRight, Activity } from 'lucide-react'
import QuickCare from '@/components/QuickCare'
import { showToast } from '@/components/toast'

export default function Home() {
  const [quickCareOpen, setQuickCareOpen] = useState(false)
  const [plants, setPlants] = useState<any[]>([])

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      return res.json()
    }
  })

  const { data: plantsData } = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      const res = await fetch('/api/plants')
      const data = await res.json()
      setPlants(Array.isArray(data) ? data : [])
      return data
    }
  })

  // Calculate stale plants (no activity in 7+ days)
  const stalePlants = plants.filter((plant: any) => {
    const lastActivity = plant.lastActivityDate || plant.updatedAt
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= 7
  })

  // Plants needing water (5+ days since last watering)
  const needsWater = plants.filter((plant: any) => {
    if (!plant.careLogs || plant.careLogs.length === 0) return true
    // Check for various water-related action names
    const lastWater = plant.careLogs.find((log: any) => {
      const action = (log.action || '').toLowerCase()
      return action.includes('water') || action.includes('fertil')
    })
    if (!lastWater) return true
    const daysSince = Math.floor((Date.now() - new Date(lastWater.date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince >= 5
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header - minimal */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--forest)]">Cladari</h1>
          <p className="text-sm text-[var(--clay)]">{stats?.totalPlants || 0} plants in collection</p>
        </div>

        {/* Action buttons - immediately visible */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setQuickCareOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--forest)] text-white rounded font-medium"
          >
            <Droplets className="w-5 h-5" />
            Log Care
          </button>
          <Link
            href="/plants"
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-black/[0.08] rounded font-medium text-[var(--bark)]"
          >
            View Plants
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Alerts - what needs attention */}
        {(stalePlants.length > 0 || needsWater.length > 0) && (
          <div className="bg-white border border-black/[0.08] rounded-lg p-4 mb-6">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-3">Needs Attention</h2>
            <div className="space-y-2">
              {stalePlants.length > 0 && (
                <Link
                  href="/plants?filter=stale"
                  className="flex items-center justify-between p-3 bg-[var(--alert-red)]/5 border border-[var(--alert-red)]/20 rounded"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[var(--alert-red)]" />
                    <div>
                      <p className="font-medium text-[var(--alert-red)]">{stalePlants.length} stale plants</p>
                      <p className="text-xs text-[var(--clay)]">No activity in 7+ days</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
                </Link>
              )}
              {needsWater.length > 0 && (
                <Link
                  href="/plants?filter=water"
                  className="flex items-center justify-between p-3 bg-[var(--water-blue)]/5 border border-[var(--water-blue)]/20 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Droplets className="w-5 h-5 text-[var(--water-blue)]" />
                    <div>
                      <p className="font-medium text-[var(--water-blue)]">{needsWater.length} may need water</p>
                      <p className="text-xs text-[var(--clay)]">5+ days since last watering</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
                </Link>
              )}
              {stats?.substrateHealth && stats.substrateHealth.totalRisks > 0 && (
                <Link
                  href="/plants?filter=substrate_risk"
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-700">{stats.substrateHealth.totalRisks} substrate health risks</p>
                      <p className="text-xs text-[var(--clay)]">Declining EC/pH trajectory</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <p className="text-xs text-[var(--clay)] mb-1">Healthy</p>
            <p className="text-2xl font-semibold text-[var(--moss)]">{stats?.healthyPlants || 0}</p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <p className="text-xs text-[var(--clay)] mb-1">Struggling</p>
            <p className="text-2xl font-semibold text-[var(--spadix-yellow)]">
              {(stats?.totalPlants || 0) - (stats?.healthyPlants || 0)}
            </p>
          </div>
          {stats?.avgWateringFrequency && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <p className="text-xs text-[var(--clay)] mb-1">Avg Watering</p>
              <p className="text-2xl font-semibold text-[var(--bark)]">{stats.avgWateringFrequency}d</p>
            </div>
          )}
          {stats?.ecPhInsights?.avgEC && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <p className="text-xs text-[var(--clay)] mb-1">Avg EC</p>
              <p className="text-2xl font-semibold text-[var(--bark)]">{stats.ecPhInsights.avgEC}</p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-black/[0.04]">
              <h2 className="text-sm font-medium text-[var(--bark)] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-black/[0.04]">
              {stats.recentActivity.slice(0, 5).map((activity: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--bark)]">{activity.description}</p>
                    <p className="text-xs text-[var(--clay)]">{activity.date}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-[var(--parchment)] text-[var(--clay)] rounded">
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/locations"
            className="bg-white border border-black/[0.08] rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-[var(--bark)]">Locations</span>
            <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
          </Link>
          <Link
            href="/breeding"
            className="bg-white border border-black/[0.08] rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-[var(--bark)]">Breeding</span>
            <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
          </Link>
          <Link
            href="/genetics"
            className="bg-white border border-black/[0.08] rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-[var(--bark)]">Genetics</span>
            <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
          </Link>
          <Link
            href="/batch-care"
            className="bg-white border border-black/[0.08] rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-[var(--bark)]">Batch Care</span>
            <ChevronRight className="w-4 h-4 text-[var(--clay)]" />
          </Link>
        </div>
      </div>

      {/* Quick Care Modal */}
      <QuickCare
        isOpen={quickCareOpen}
        onClose={() => setQuickCareOpen(false)}
        plants={plants}
        onSuccess={() => {
          refetch()
          showToast({ type: 'success', title: 'Care logged' })
        }}
      />
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Leaf, Droplets, AlertTriangle, Activity, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import QuickCare from '@/components/QuickCare'
import { showToast } from '@/components/toast'

export default function Dashboard() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading analytics...</p>
      </div>
    )
  }

  const COLORS = ['#4a6741', '#87a878', '#d4a03c', '#c27b6e', '#9c8b7a']

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--forest)]">Analytics</h1>
          <p className="text-sm text-[var(--clay)]">Collection insights and trends</p>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-[var(--moss)]" />
              <span className="text-xs text-[var(--clay)]">Total Plants</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.totalPlants || 0}</p>
            <p className="text-xs text-[var(--clay)]">{stats?.healthyPlants || 0} healthy</p>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-[var(--water-blue)]" />
              <span className="text-xs text-[var(--clay)]">Avg Watering</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.avgWateringFrequency || '-'}d</p>
            <p className="text-xs text-[var(--clay)]">between waterings</p>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--spadix-yellow)]" />
              <span className="text-xs text-[var(--clay)]">Needs Attention</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.stalePlants || 0}</p>
            <p className="text-xs text-[var(--clay)]">stale 14+ days</p>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--moss)]" />
              <span className="text-xs text-[var(--clay)]">Breeding Lines</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.totalCrosses || 0}</p>
            <p className="text-xs text-[var(--clay)]">{stats?.activeCrosses || 0} active</p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Species Distribution */}
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-4">Species Distribution</h2>
            {stats?.speciesDistribution && stats.speciesDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.speciesDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.speciesDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-[var(--clay)]">
                No data available
              </div>
            )}
          </div>

          {/* Health Status */}
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-4">Health Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Healthy', count: stats?.healthyPlants || 0, color: 'bg-[var(--moss)]' },
                { label: 'Recovering', count: stats?.recoveringPlants || 0, color: 'bg-[var(--sage)]' },
                { label: 'Struggling', count: stats?.strugglingPlants || 0, color: 'bg-[var(--spadix-yellow)]' },
                { label: 'Critical', count: stats?.criticalPlants || 0, color: 'bg-[var(--alert-red)]' },
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-sm text-[var(--bark)] flex-1">{status.label}</span>
                  <span className="text-sm font-medium text-[var(--forest)]">{status.count}</span>
                  <div className="w-24 h-2 bg-[var(--parchment)] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${status.color}`}
                      style={{ width: `${(status.count / (stats?.totalPlants || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EC/pH Section */}
        {stats?.ecPhInsights && (stats.ecPhInsights.avgEC || stats.ecPhInsights.avgPH) && (
          <div className="bg-white border border-black/[0.08] rounded-lg p-4 mb-6">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-4">EC/pH Insights</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.ecPhInsights.avgEC && (
                <div>
                  <p className="text-xs text-[var(--clay)]">Average EC</p>
                  <p className="text-2xl font-semibold text-[var(--forest)]">{stats.ecPhInsights.avgEC}</p>
                </div>
              )}
              {stats.ecPhInsights.avgPH && (
                <div>
                  <p className="text-xs text-[var(--clay)]">Average pH</p>
                  <p className="text-2xl font-semibold text-[var(--forest)]">{stats.ecPhInsights.avgPH}</p>
                </div>
              )}
              {stats.ecPhInsights.concerningEC?.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--clay)]">High EC Plants</p>
                  <p className="text-2xl font-semibold text-[var(--spadix-yellow)]">{stats.ecPhInsights.concerningEC.length}</p>
                </div>
              )}
              {stats.ecPhInsights.concerningPH?.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--clay)]">pH Issues</p>
                  <p className="text-2xl font-semibold text-[var(--spadix-yellow)]">{stats.ecPhInsights.concerningPH.length}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--clay)] mt-3">
              Based on {stats.ecPhInsights.totalReadings} readings
            </p>
          </div>
        )}

        {/* Elite Genetics */}
        {stats?.eliteGenetics && stats.eliteGenetics.length > 0 && (
          <div className="bg-white border border-black/[0.08] rounded-lg p-4 mb-6">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-4">Elite Genetics (RA Lineages)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.eliteGenetics.map((genetic: any) => (
                <div key={genetic.code} className="bg-[var(--parchment)] rounded-lg p-3">
                  <p className="text-lg font-bold text-[var(--forest)]">{genetic.code}</p>
                  <p className="text-2xl font-semibold text-[var(--bark)]">{genetic.count}</p>
                  <p className="text-xs text-[var(--clay)]">plants</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.04]">
              <h2 className="text-sm font-medium text-[var(--bark)] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-black/[0.04]">
              {stats.recentActivity.map((activity: any, i: number) => (
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

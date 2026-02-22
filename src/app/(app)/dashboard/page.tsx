'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Leaf, Heart, Sprout, FlaskConical, Scissors,
  TreeDeciduous, Activity, ChevronRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import KnowledgeSearch from '@/components/KnowledgeSearch'
import WelcomeBanner from '@/components/WelcomeBanner'

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading dashboard</p>
      </div>
    )
  }

  const COLORS = ['#4a6741', '#87a878', '#d4a03c', '#c27b6e', '#9c8b7a', '#6b8e6b']

  // Helper for status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // Seed batch statuses
      'SOWN': 'bg-amber-100 text-amber-700',
      'GERMINATING': 'bg-lime-100 text-lime-700',
      'PRICKING_OUT': 'bg-emerald-100 text-emerald-700',
      'SELECTING': 'bg-sky-100 text-sky-700',
      'COMPLETE': 'bg-violet-100 text-violet-700',
      'FAILED': 'bg-red-100 text-red-600',
      // Seedling statuses
      'GROWING': 'bg-sky-100 text-sky-700',
      'KEEPER': 'bg-emerald-100 text-emerald-700',
      'HOLDBACK': 'bg-amber-100 text-amber-700',
      'CULLED': 'bg-gray-100 text-gray-500',
      'DIED': 'bg-red-100 text-red-600',
      'GRADUATED': 'bg-violet-100 text-violet-700',
      // Clone batch statuses
      'ROOTING': 'bg-amber-100 text-amber-700',
      'ESTABLISHED': 'bg-emerald-100 text-emerald-700',
      'READY': 'bg-sky-100 text-sky-700',
      // Health statuses
      'healthy': 'bg-emerald-100 text-emerald-700',
      'recovering': 'bg-lime-100 text-lime-700',
      'struggling': 'bg-amber-100 text-amber-700',
      'critical': 'bg-red-100 text-red-600',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      'Breeding': 'bg-rose-100 text-rose-700',
      'Seeds': 'bg-amber-100 text-amber-700',
      'Clones': 'bg-emerald-100 text-emerald-700',
      'Plant': 'bg-sky-100 text-sky-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--forest)]">Dashboard</h1>
          <p className="text-sm text-[var(--clay)]">Overview of your breeding program</p>
        </div>

        {/* Welcome Banner for new users */}
        {stats?.totalPlants === 0 && <WelcomeBanner />}

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/plants" className="bg-white border border-black/[0.08] rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-[var(--moss)]" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Plants</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.totalPlants || 0}</p>
            <p className="text-xs text-[var(--clay)]">{stats?.healthyPlants || 0} healthy</p>
          </Link>

          <Link href="/breeding" className="bg-white border border-black/[0.08] rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Crosses</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.breeding?.totalCrosses || 0}</p>
            <p className="text-xs text-[var(--clay)]">{stats?.breeding?.recentCrosses || 0} this month</p>
          </Link>

          <Link href="/batches" className="bg-white border border-black/[0.08] rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Scissors className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Clone Batches</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.batches?.totalCloneBatches || 0}</p>
            <p className="text-xs text-[var(--clay)]">{stats?.batches?.clonesInProgress || 0} clones in progress</p>
          </Link>

          <Link href="/breeding" className="bg-white border border-black/[0.08] rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="w-4 h-4 text-lime-500" />
              <span className="text-xs text-[var(--clay)] uppercase tracking-wide">Seedlings</span>
            </div>
            <p className="text-3xl font-semibold text-[var(--forest)]">{stats?.breeding?.totalSeedlings || 0}</p>
            <p className="text-xs text-[var(--clay)]">
              {stats?.breeding?.keeperCount || 0} keepers, {stats?.breeding?.holdbackCount || 0} holdbacks
            </p>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Breeding Pipeline */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[var(--bark)] flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-500" />
                Breeding Pipeline
              </h2>
              <Link href="/breeding" className="text-xs text-[var(--moss)] hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Pipeline stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-[var(--forest)]">{stats?.breeding?.totalSeeds || 0}</p>
                <p className="text-xs text-[var(--clay)]">Seeds sown</p>
              </div>
              <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-[var(--forest)]">{stats?.breeding?.activeSeedBatches || 0}</p>
                <p className="text-xs text-[var(--clay)]">Germinating</p>
              </div>
              <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-emerald-600">{stats?.breeding?.graduatedSeedlings || 0}</p>
                <p className="text-xs text-[var(--clay)]">Graduated</p>
              </div>
            </div>

            {/* Seedling status breakdown */}
            {stats?.breeding?.seedlingsByStatus && stats.breeding.seedlingsByStatus.length > 0 && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2">Seedlings by Status</p>
                <div className="flex flex-wrap gap-2">
                  {stats.breeding.seedlingsByStatus.map((s: any) => (
                    <span key={s.status} className={`text-xs px-2 py-1 rounded-full ${getStatusColor(s.status)}`}>
                      {s.status}: {s.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clone Batches */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[var(--bark)] flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-500" />
                Clone Batches
              </h2>
              <Link href="/batches" className="text-xs text-[var(--moss)] hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Batch type breakdown */}
            {stats?.batches?.byType && stats.batches.byType.length > 0 ? (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {stats.batches.byType.map((t: any) => (
                    <span key={t.type} className="text-xs px-2 py-1 rounded-full bg-[var(--bg-primary)] text-[var(--bark)]">
                      {t.type}: {t.count}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--clay)] mb-4">No clone batches yet</p>
            )}

            {/* Recent batches */}
            {stats?.batches?.recentBatches && stats.batches.recentBatches.length > 0 && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2">Recent Batches</p>
                <div className="space-y-2">
                  {stats.batches.recentBatches.slice(0, 3).map((b: any) => (
                    <div key={b.batchId} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-[var(--bark)]">{b.batchId}</span>
                      <span className="text-xs text-[var(--clay)]">{b.source}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Section Distribution */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-4">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-4">Collection by Section</h2>
            {stats?.sectionDistribution && stats.sectionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={stats.sectionDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={95}
                  />
                  <Tooltip formatter={(value: number) => [`${value} plants`, 'Count']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.sectionDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[var(--clay)]">
                No section data
              </div>
            )}
          </div>

          {/* Health Distribution */}
          <div className="bg-white border border-black/[0.08] rounded-xl p-4">
            <h2 className="text-sm font-medium text-[var(--bark)] mb-4">Plant Health</h2>
            <div className="space-y-3">
              {stats?.healthDistribution && stats.healthDistribution.length > 0 ? (
                stats.healthDistribution.map((h: any) => (
                  <div key={h.status} className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      h.status === 'healthy' ? 'bg-emerald-500' :
                      h.status === 'recovering' ? 'bg-lime-500' :
                      h.status === 'struggling' ? 'bg-amber-500' :
                      h.status === 'critical' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-[var(--bark)] flex-1 capitalize">{h.status}</span>
                    <span className="text-sm font-medium text-[var(--forest)]">{h.count}</span>
                    <div className="w-20 h-2 bg-[var(--parchment)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          h.status === 'healthy' ? 'bg-emerald-500' :
                          h.status === 'recovering' ? 'bg-lime-500' :
                          h.status === 'struggling' ? 'bg-amber-500' :
                          h.status === 'critical' ? 'bg-red-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${(h.count / (stats?.totalPlants || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--clay)]">No health data</p>
              )}
            </div>
          </div>
        </div>

        {/* Knowledge Search */}
        <div className="mb-6">
          <KnowledgeSearch />
        </div>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
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
                  <span className={`text-xs px-2 py-1 rounded-full ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

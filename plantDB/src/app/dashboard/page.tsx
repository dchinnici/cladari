'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CareQueue from '@/components/care/CareQueue'
import QuickCare from '@/components/QuickCare'
import { DollarSign, Leaf, Users, TrendingUp, Activity, Package, Sparkles, Dna, FlaskConical, Award, Droplets, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { showToast } from '@/components/toast'

export default function Dashboard() {
  const [quickCareOpen, setQuickCareOpen] = useState(false)
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([])
  const [plants, setPlants] = useState<any[]>([])
  const router = useRouter()

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

  const handleQuickCare = (plantIds: string[]) => {
    setSelectedPlantIds(plantIds)
    setQuickCareOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-lg text-gray-600">Loading your collection...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444']
  const GRADIENT_COLORS = [
    { start: '#10b981', end: '#059669' },
    { start: '#06b6d4', end: '#0891b2' },
    { start: '#8b5cf6', end: '#7c3aed' },
    { start: '#f59e0b', end: '#d97706' },
    { start: '#ef4444', end: '#dc2626' },
  ]

  const metricCards = [
    {
      title: 'Total Plants',
      value: stats?.totalPlants || 0,
      subtext: `${stats?.healthyPlants || 0} healthy`,
      icon: Leaf,
      color: 'from-emerald-400 to-green-600',
      bgColor: 'from-emerald-50 to-green-50',
    },
    {
      title: 'Collection Value',
      value: `$${((stats?.totalInvestment || 0) / 1000).toFixed(1)}k`,
      subtext: `Avg $${Math.round(stats?.avgCost || 0)}`,
      icon: DollarSign,
      color: 'from-amber-400 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
    },
    {
      title: 'Breeding Lines',
      value: stats?.totalCrosses || 0,
      subtext: `${stats?.activeCrosses || 0} active`,
      icon: Dna,
      color: 'from-purple-400 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
    },
    {
      title: 'Elite Genetics',
      value: stats?.elitePlantCount || 0,
      subtext: `${stats?.motherPlantCount || 0} mothers`,
      icon: Award,
      color: 'from-yellow-400 to-amber-600',
      bgColor: 'from-yellow-50 to-amber-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">
            <span className="gradient-text">Collection Dashboard</span>
          </h1>
          <p className="text-gray-600">Real-time insights into your anthurium breeding program</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((metric, i) => {
            const Icon = metric.icon
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgColor} opacity-50`} />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Care Queue and Actionable Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <CareQueue onQuickCare={handleQuickCare} />
          </div>
          <div className="space-y-4">
            {/* Quick Stats Card */}
            <Card className="overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {stats?.avgWateringFrequency && (
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm text-gray-600">Avg Watering</span>
                      <span className="text-sm font-bold text-blue-600">
                        Every {stats.avgWateringFrequency} days
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm text-gray-600">Needs Water</span>
                    <span className="text-sm font-bold text-blue-600">
                      {stats?.plantsNeedingWater?.length || 0} plants
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm text-gray-600">Needs Feed</span>
                    <span className="text-sm font-bold text-green-600">
                      {stats?.plantsNeedingFertilizer?.length || 0} plants
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-sm text-gray-600">Stale (14+ days)</span>
                    <span className="text-sm font-bold text-amber-600">
                      {stats?.stalePlants || 0} plants
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EC/pH Insights Card */}
            {stats?.ecPhInsights && (stats.ecPhInsights.avgEC || stats.ecPhInsights.avgPH) && (
              <Card className="overflow-hidden bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200/50 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    EC/pH Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-3">
                    {/* Average Values */}
                    <div className="grid grid-cols-2 gap-2">
                      {stats.ecPhInsights.avgEC && (
                        <div className="bg-white/60 rounded-lg p-2">
                          <div className="text-xs text-gray-500">Avg EC</div>
                          <div className="text-lg font-bold text-cyan-700">
                            {stats.ecPhInsights.avgEC}
                          </div>
                        </div>
                      )}
                      {stats.ecPhInsights.avgPH && (
                        <div className="bg-white/60 rounded-lg p-2">
                          <div className="text-xs text-gray-500">Avg pH</div>
                          <div className="text-lg font-bold text-blue-700">
                            {stats.ecPhInsights.avgPH}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {(stats.ecPhInsights.concerningEC?.length > 0 ||
                      stats.ecPhInsights.concerningPH?.length > 0) && (
                      <div className="space-y-2 pt-2 border-t border-cyan-200/50">
                        {stats.ecPhInsights.concerningEC?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5" />
                            <div>
                              <div className="text-xs font-medium text-amber-700">
                                High EC ({stats.ecPhInsights.concerningEC.length})
                              </div>
                              <div className="text-xs text-gray-600">
                                {stats.ecPhInsights.concerningEC[0]?.name}
                                {stats.ecPhInsights.concerningEC.length > 1 &&
                                  ` +${stats.ecPhInsights.concerningEC.length - 1} more`}
                              </div>
                            </div>
                          </div>
                        )}
                        {stats.ecPhInsights.concerningPH?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5" />
                            <div>
                              <div className="text-xs font-medium text-orange-700">
                                pH Issues ({stats.ecPhInsights.concerningPH.length})
                              </div>
                              <div className="text-xs text-gray-600">
                                {stats.ecPhInsights.concerningPH[0]?.name}
                                {stats.ecPhInsights.concerningPH.length > 1 &&
                                  ` +${stats.ecPhInsights.concerningPH.length - 1} more`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 text-center pt-1">
                      Based on {stats.ecPhInsights.totalReadings} recent readings
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Species Distribution */}
        <Card className="overflow-hidden bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-600" />
              Species/Complex Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {GRADIENT_COLORS.map((color, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color.start} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={color.end} stopOpacity={0.8} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={stats?.speciesDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(stats?.speciesDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index % GRADIENT_COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Elite Genetics Section */}
        <Card className="overflow-hidden bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-xl border-purple-700/50 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="w-6 h-6 text-yellow-400" />
              Elite Genetics Collection (RA Lineages)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats?.eliteGenetics?.map((genetic: any) => (
                <div
                  key={genetic.code}
                  className="relative overflow-hidden bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative">
                    <div className="text-2xl font-black text-white mb-1">{genetic.code}</div>
                    <div className="text-3xl font-bold text-yellow-400">{genetic.count}</div>
                    <div className="text-sm text-gray-300">plants</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {stats?.recentActivity?.map((activity: any, index: number) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <div>
                      <div className="font-medium text-gray-900">{activity.description}</div>
                      <div className="text-sm text-gray-500">{activity.date}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Care Modal */}
        <QuickCare
          isOpen={quickCareOpen}
          onClose={() => {
            setQuickCareOpen(false)
            setSelectedPlantIds([])
          }}
          plants={plants}
          onSuccess={() => {
            refetch()
            showToast({ type: 'success', title: 'Care logs saved successfully' })
          }}
        />
      </div>
    </div>
  )
}
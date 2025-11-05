'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Leaf, Users, TrendingUp, Activity, Package, Sparkles, Dna, FlaskConical, Award, Droplets } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      return res.json()
    }
  })

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

        {/* TODAY'S TASKS - POWER FEATURE */}
        {(stats?.plantsNeedingWater?.length > 0 || stats?.plantsNeedingFertilizer?.length > 0 || stats?.stalePlants > 0) && (
          <Card className="overflow-hidden bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/50 shadow-xl mb-8">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-orange-600" />
                Today's Tasks - Plants Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats?.plantsNeedingWater?.length > 0 && (
                  <div className="bg-white/80 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-900">Needs Water</h3>
                    </div>
                    <div className="space-y-2">
                      {stats.plantsNeedingWater.slice(0, 5).map((plant: any) => (
                        <a
                          key={plant.id}
                          href={`/plants/${plant.id}`}
                          className="block text-sm hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{plant.name || plant.plantId}</div>
                          <div className="text-xs text-gray-500">{plant.daysSinceWater}+ days ago</div>
                        </a>
                      ))}
                      {stats.plantsNeedingWater.length > 5 && (
                        <div className="text-xs text-gray-500 pt-2">
                          +{stats.plantsNeedingWater.length - 5} more plants
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {stats?.plantsNeedingFertilizer?.length > 0 && (
                  <div className="bg-white/80 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-green-900">Needs Feed</h3>
                    </div>
                    <div className="space-y-2">
                      {stats.plantsNeedingFertilizer.slice(0, 5).map((plant: any) => (
                        <a
                          key={plant.id}
                          href={`/plants/${plant.id}`}
                          className="block text-sm hover:bg-green-50 p-2 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{plant.name || plant.plantId}</div>
                        </a>
                      ))}
                      {stats.plantsNeedingFertilizer.length > 5 && (
                        <div className="text-xs text-gray-500 pt-2">
                          +{stats.plantsNeedingFertilizer.length - 5} more plants
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {stats?.stalePlants > 0 && (
                  <div className="bg-white/80 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-amber-900">No Activity</h3>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-amber-600">{stats.stalePlants}</div>
                      <div className="text-sm text-gray-600 mt-1">plants with no updates</div>
                      <div className="text-xs text-gray-500">in 14+ days</div>
                    </div>
                  </div>
                )}
              </div>

              {stats?.avgWateringFrequency && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Collection Average</span>
                    </div>
                    <span className="text-sm font-bold text-blue-700">
                      Watering every ~{stats.avgWateringFrequency} days
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  )
}
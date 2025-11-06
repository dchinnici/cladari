'use client'

import { useState, useEffect } from 'react'
import { Droplet, Leaf, AlertTriangle, CheckCircle, Calendar, TrendingUp } from 'lucide-react'
import { CareRecommendation } from '@/lib/care/types'

interface UpcomingCareProps {
  plantId: string
  onActionComplete?: () => void
}

export function UpcomingCare({ plantId, onActionComplete }: UpcomingCareProps) {
  const [recommendations, setRecommendations] = useState<CareRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [plantId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/plants/${plantId}/recommendations`)

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
      setError(null)
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'water':
        return <Droplet className="w-5 h-5" />
      case 'fertilize':
        return <Leaf className="w-5 h-5" />
      case 'repot':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Calendar className="w-5 h-5" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'water':
        return 'from-blue-500 to-cyan-600'
      case 'fertilize':
        return 'from-green-500 to-emerald-600'
      case 'repot':
        return 'from-orange-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">High Confidence</span>
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Medium Confidence</span>
      case 'low':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Low Confidence</span>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800">Error loading recommendations: {error}</p>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No care recommendations available yet.</p>
        <p className="text-sm text-gray-500 mt-2">Add more care log entries to get personalized recommendations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getActionColor(rec.action)} p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getActionIcon(rec.action)}
                <div>
                  <h3 className="text-lg font-semibold capitalize">{rec.action}</h3>
                  <p className="text-sm opacity-90">{formatDate(rec.scheduledDate.toString())}</p>
                </div>
              </div>
              {getConfidenceBadge(rec.confidence)}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis</h4>
              <ul className="space-y-1">
                {rec.reasoning.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Environmental Factors */}
            {rec.environmentalFactors && rec.environmentalFactors.reasons.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Environmental Adjustments
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {rec.environmentalFactors.temperature && (
                    <p>Temp: {rec.environmentalFactors.temperature}°C</p>
                  )}
                  {rec.environmentalFactors.humidity && (
                    <p>Humidity: {rec.environmentalFactors.humidity}%</p>
                  )}
                  <p className="text-xs text-blue-700 mt-2">
                    Interval adjusted by {((rec.environmentalFactors.adjustment - 1) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            )}

            {/* Alerts */}
            {rec.alerts && rec.alerts.length > 0 && (
              <div className="space-y-2">
                {rec.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 border ${getAlertColor(alert.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      {alert.level === 'critical' ? (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : alert.level === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.message}</p>
                        {alert.actionRequired && (
                          <p className="text-sm mt-1 opacity-90">
                            <strong>Action:</strong> {alert.actionRequired}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EC/pH Context */}
            {rec.ecPhContext && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Substrate Health</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {rec.ecPhContext.avgInputEC && rec.ecPhContext.avgOutputEC && (
                    <div>
                      <p className="text-gray-600">EC (In/Out)</p>
                      <p className="font-medium">
                        {rec.ecPhContext.avgInputEC.toFixed(2)} / {rec.ecPhContext.avgOutputEC.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {rec.ecPhContext.avgInputPH && rec.ecPhContext.avgOutputPH && (
                    <div>
                      <p className="text-gray-600">pH (In/Out)</p>
                      <p className="font-medium">
                        {rec.ecPhContext.avgInputPH.toFixed(2)} / {rec.ecPhContext.avgOutputPH.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {rec.ecPhContext.substrateHealthScore !== null && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Health Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rec.ecPhContext.substrateHealthScore >= 70
                                ? 'bg-green-500'
                                : rec.ecPhContext.substrateHealthScore >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${rec.ecPhContext.substrateHealthScore}%` }}
                          />
                        </div>
                        <span className="font-medium">{rec.ecPhContext.substrateHealthScore}/100</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

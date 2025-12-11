'use client'

import { useState, useEffect } from 'react'
import {
  Droplet,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Beaker
} from 'lucide-react'

interface HealthMetricsProps {
  plantId: string
  onDataLoaded?: (data: any) => void
}

interface MLPredictions {
  watering: {
    nextDate: string | null
    daysUntil: number | null
    confidence: 'high' | 'medium' | 'low'
    interval: {
      optimal: number
      min: number
      max: number
    }
    history: {
      totalEvents: number
      avgInterval: number
      recentInterval: number
      trend: 'shortening' | 'lengthening' | 'stable'
    }
  }
  health: {
    trajectory: 'improving' | 'stable' | 'declining' | 'critical'
    currentScore: number
    substrateHealthScore: number
    confidence: 'high' | 'medium' | 'low'
    riskFactors: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
    }>
    alerts: Array<{
      level: 'info' | 'warning' | 'critical'
      type: string
      message: string
      actionRequired?: string
    }>
    summary: string
  }
}

export function HealthMetrics({ plantId, onDataLoaded }: HealthMetricsProps) {
  const [predictions, setPredictions] = useState<MLPredictions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPredictions()
  }, [plantId])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/plants/${plantId}/recommendations`)
      if (!response.ok) throw new Error('Failed to fetch predictions')
      const data = await response.json()
      setPredictions(data.predictions)
      onDataLoaded?.(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching predictions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getTrajectoryColor = (trajectory: string) => {
    switch (trajectory) {
      case 'improving': return 'text-[var(--moss)]'
      case 'stable': return 'text-[var(--bark)]'
      case 'declining': return 'text-[var(--spadix-yellow)]'
      case 'critical': return 'text-[var(--alert-red)]'
      default: return 'text-[var(--clay)]'
    }
  }

  const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
      case 'improving': return <TrendingUp className="w-4 h-4" />
      case 'declining':
      case 'critical': return <TrendingDown className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[var(--moss)]'
    if (score >= 60) return 'text-[var(--spadix-yellow)]'
    return 'text-[var(--alert-red)]'
  }

  const getAlertStyles = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-[var(--alert-red)]/10 border-[var(--alert-red)]/30 text-[var(--alert-red)]'
      case 'warning': return 'bg-[var(--spadix-yellow)]/10 border-[var(--spadix-yellow)]/30 text-[var(--spadix-yellow)]'
      default: return 'bg-[var(--water-blue)]/10 border-[var(--water-blue)]/30 text-[var(--water-blue)]'
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--parchment)] rounded-lg p-6">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--moss)]"></div>
          <span className="ml-2 text-[var(--clay)] text-sm">Loading health data...</span>
        </div>
      </div>
    )
  }

  if (error || !predictions) {
    return (
      <div className="bg-[var(--parchment)] rounded-lg p-6">
        <p className="text-[var(--clay)] text-sm text-center">Unable to load health metrics</p>
      </div>
    )
  }

  const { watering, health } = predictions

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {health.alerts.length > 0 && (
        <div className="space-y-2">
          {health.alerts.map((alert, idx) => (
            <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertStyles(alert.level)}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.actionRequired && (
                  <p className="text-xs mt-1 opacity-80">{alert.actionRequired}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Substrate Health */}
        <div className="bg-[var(--parchment)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-[var(--clay)]" />
            <span className="text-xs text-[var(--clay)]">Substrate</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${getScoreColor(health.substrateHealthScore)}`}>
              {health.substrateHealthScore}
            </span>
            <span className="text-xs text-[var(--clay)]">/100</span>
          </div>
        </div>

        {/* Water Due */}
        <div className="bg-[var(--parchment)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-4 h-4 text-[var(--water-blue)]" />
            <span className="text-xs text-[var(--clay)]">Water Due</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[var(--forest)]">
              {watering.daysUntil !== null
                ? watering.daysUntil <= 0 ? 'Now' : watering.daysUntil
                : '?'}
            </span>
            {watering.daysUntil !== null && watering.daysUntil > 0 && (
              <span className="text-xs text-[var(--clay)]">days</span>
            )}
          </div>
          <p className="text-xs text-[var(--clay)] mt-1">
            avg {watering.history.avgInterval}d
          </p>
        </div>

        {/* Health Trajectory */}
        <div className="bg-[var(--parchment)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[var(--clay)]" />
            <span className="text-xs text-[var(--clay)]">Trajectory</span>
          </div>
          <div className={`flex items-center gap-2 ${getTrajectoryColor(health.trajectory)}`}>
            {getTrajectoryIcon(health.trajectory)}
            <span className="text-lg font-medium capitalize">{health.trajectory}</span>
          </div>
          <p className="text-xs text-[var(--clay)] mt-1">
            {health.confidence} confidence
          </p>
        </div>
      </div>

      {/* Risk Factors */}
      {health.riskFactors.length > 0 && (
        <div className="bg-[var(--parchment)] rounded-lg p-4">
          <h4 className="text-xs font-medium text-[var(--bark)] mb-2">Risk Factors</h4>
          <div className="space-y-1">
            {health.riskFactors.slice(0, 3).map((risk, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  risk.severity === 'critical' ? 'bg-[var(--alert-red)]' :
                  risk.severity === 'high' ? 'bg-[var(--spadix-yellow)]' :
                  'bg-[var(--clay)]'
                }`} />
                <span className="text-[var(--bark)]">{risk.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {health.summary && (
        <p className="text-sm text-[var(--clay)] italic">{health.summary}</p>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Droplet,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Beaker,
  ChevronDown,
  ChevronUp,
  Calendar,
  Wrench,
  Target
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
    trend: 'shortening' | 'lengthening' | 'stable'
    factors: string[]
    history: {
      totalEvents: number
      avgInterval: number
      recentInterval: number
      trend: 'shortening' | 'lengthening' | 'stable'
      consistency: 'high' | 'medium' | 'low'
    }
  }
  health: {
    trajectory: 'improving' | 'stable' | 'declining' | 'critical'
    currentScore: number
    substrateHealthScore: number
    predicted: {
      '7d': number
      '14d': number
      '30d': number
    }
    confidence: 'high' | 'medium' | 'low'
    riskFactors: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      value?: number
      threshold?: number
    }>
    interventions: string[]
    trends: {
      ecDelta: any
      phDrift: any
      substrateHealth: any
    }
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
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

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-[var(--moss)]'
    if (score >= 60) return 'bg-[var(--spadix-yellow)]'
    return 'bg-[var(--alert-red)]'
  }

  const getAlertStyles = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-[var(--alert-red)]/10 border-[var(--alert-red)]/30 text-[var(--alert-red)]'
      case 'warning': return 'bg-[var(--spadix-yellow)]/10 border-[var(--spadix-yellow)]/30 text-[var(--spadix-yellow)]'
      default: return 'bg-[var(--water-blue)]/10 border-[var(--water-blue)]/30 text-[var(--water-blue)]'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-[var(--alert-red)]'
      case 'high': return 'bg-[var(--spadix-yellow)]'
      case 'medium': return 'bg-[var(--water-blue)]'
      default: return 'bg-[var(--clay)]'
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
    <div className="space-y-3">
      {/* Alerts Section */}
      {health?.alerts && health.alerts.length > 0 && (
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

      {/* Substrate Health - Expandable */}
      <div className="bg-[var(--parchment)] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('substrate')}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--clay)]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--moss)]/10 rounded-lg">
              <Beaker className="w-4 h-4 text-[var(--moss)]" />
            </div>
            <div className="text-left">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(health?.substrateHealthScore ?? 0)}`}>
                  {health?.substrateHealthScore ?? '?'}
                </span>
                <span className="text-sm text-[var(--clay)]">/100</span>
              </div>
              <p className="text-xs text-[var(--clay)]">Substrate Health</p>
            </div>
          </div>
          {expandedSection === 'substrate' ? (
            <ChevronUp className="w-4 h-4 text-[var(--clay)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
          )}
        </button>

        {expandedSection === 'substrate' && health && (
          <div className="px-4 pb-4 space-y-4">
            {/* Predicted Scores */}
            {health.predicted && (
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Predicted Trajectory
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-white/50 rounded">
                    <span className={`text-lg font-bold ${getScoreColor(health.predicted['7d'])}`}>
                      {health.predicted['7d']}
                    </span>
                    <p className="text-xs text-[var(--clay)]">7 days</p>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded">
                    <span className={`text-lg font-bold ${getScoreColor(health.predicted['14d'])}`}>
                      {health.predicted['14d']}
                    </span>
                    <p className="text-xs text-[var(--clay)]">14 days</p>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded">
                    <span className={`text-lg font-bold ${getScoreColor(health.predicted['30d'])}`}>
                      {health.predicted['30d']}
                    </span>
                    <p className="text-xs text-[var(--clay)]">30 days</p>
                  </div>
                </div>
                {/* Visual bar showing current vs predicted */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--clay)] w-12">Now</span>
                    <div className="flex-1 h-2 bg-[var(--clay)]/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(health.substrateHealthScore ?? 0)} rounded-full transition-all`}
                        style={{ width: `${health.substrateHealthScore ?? 0}%` }}
                      />
                    </div>
                    <span className="text-[var(--bark)] w-8 text-right">{health.substrateHealthScore ?? '?'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--clay)] w-12">30d</span>
                    <div className="flex-1 h-2 bg-[var(--clay)]/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(health.predicted['30d'])} rounded-full transition-all`}
                        style={{ width: `${health.predicted['30d']}%` }}
                      />
                    </div>
                    <span className="text-[var(--bark)] w-8 text-right">{health.predicted['30d']}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Factors - All of them */}
            {health.riskFactors.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Risk Factors ({health.riskFactors.length})
                </h4>
                <div className="space-y-2">
                  {health.riskFactors.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 rounded">
                      <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${getSeverityColor(risk.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--bark)]">{risk.description}</p>
                        {(risk.value !== undefined || risk.threshold !== undefined) && (
                          <p className="text-xs text-[var(--clay)] mt-0.5">
                            {risk.value !== undefined && `Value: ${risk.value}`}
                            {risk.value !== undefined && risk.threshold !== undefined && ' • '}
                            {risk.threshold !== undefined && `Threshold: ${risk.threshold}`}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        risk.severity === 'critical' ? 'bg-[var(--alert-red)]/10 text-[var(--alert-red)]' :
                        risk.severity === 'high' ? 'bg-[var(--spadix-yellow)]/10 text-[var(--spadix-yellow)]' :
                        'bg-[var(--clay)]/10 text-[var(--clay)]'
                      }`}>
                        {risk.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interventions */}
            {health.interventions && health.interventions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  Recommended Actions
                </h4>
                <ul className="space-y-1">
                  {health.interventions.map((intervention, idx) => (
                    <li key={idx} className="text-sm text-[var(--bark)] flex items-start gap-2">
                      <span className="text-[var(--moss)]">•</span>
                      {intervention}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Watering - Expandable */}
      <div className="bg-[var(--parchment)] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('watering')}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--clay)]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--water-blue)]/10 rounded-lg">
              <Droplet className="w-4 h-4 text-[var(--water-blue)]" />
            </div>
            <div className="text-left">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  watering?.daysUntil != null && watering.daysUntil <= 0
                    ? 'text-[var(--alert-red)]'
                    : 'text-[var(--forest)]'
                }`}>
                  {watering?.daysUntil != null
                    ? watering.daysUntil <= 0 ? 'Now' : watering.daysUntil
                    : '?'}
                </span>
                {watering?.daysUntil != null && watering.daysUntil > 0 && (
                  <span className="text-sm text-[var(--clay)]">days</span>
                )}
              </div>
              <p className="text-xs text-[var(--clay)]">
                Water Due • avg {watering?.history?.avgInterval ?? '?'}d
              </p>
            </div>
          </div>
          {expandedSection === 'watering' ? (
            <ChevronUp className="w-4 h-4 text-[var(--clay)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
          )}
        </button>

        {expandedSection === 'watering' && watering && (
          <div className="px-4 pb-4 space-y-4">
            {/* Watering Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/50 rounded">
                <p className="text-xs text-[var(--clay)]">Optimal Interval</p>
                <p className="text-lg font-bold text-[var(--forest)]">
                  {watering.interval?.optimal ?? '?'} days
                </p>
                <p className="text-xs text-[var(--clay)]">
                  Range: {watering.interval?.min ?? '?'}-{watering.interval?.max ?? '?'}d
                </p>
              </div>
              <div className="p-3 bg-white/50 rounded">
                <p className="text-xs text-[var(--clay)]">Recent Interval</p>
                <p className="text-lg font-bold text-[var(--bark)]">
                  {watering.history?.recentInterval ?? '?'} days
                </p>
                <p className={`text-xs ${
                  watering.history?.trend === 'shortening' ? 'text-[var(--spadix-yellow)]' :
                  watering.history?.trend === 'lengthening' ? 'text-[var(--water-blue)]' :
                  'text-[var(--moss)]'
                }`}>
                  {watering.history?.trend === 'shortening' ? '↓ Shortening' :
                   watering.history?.trend === 'lengthening' ? '↑ Lengthening' :
                   '→ Stable'}
                </p>
              </div>
            </div>

            {/* History Stats */}
            {watering.history && (
              <div className="flex items-center justify-between p-3 bg-white/50 rounded">
                <div>
                  <p className="text-xs text-[var(--clay)]">Total Waterings</p>
                  <p className="text-lg font-bold text-[var(--bark)]">
                    {watering.history.totalEvents ?? 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--clay)]">Consistency</p>
                  <p className={`text-sm font-medium capitalize ${
                    watering.history.consistency === 'high' ? 'text-[var(--moss)]' :
                    watering.history.consistency === 'medium' ? 'text-[var(--spadix-yellow)]' :
                    'text-[var(--clay)]'
                  }`}>
                    {watering.history.consistency ?? 'Unknown'}
                  </p>
                </div>
              </div>
            )}

            {/* Contributing Factors */}
            {watering.factors && watering.factors.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2">Contributing Factors</h4>
                <div className="space-y-2">
                  {watering.factors.map((factor: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 rounded text-sm">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        factor.impact === 'decrease' ? 'bg-[var(--spadix-yellow)]/10 text-[var(--spadix-yellow)]' :
                        'bg-[var(--water-blue)]/10 text-[var(--water-blue)]'
                      }`}>
                        {factor.impact === 'decrease' ? '↓' : '↑'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--bark)]">{factor.name}</p>
                        <p className="text-xs text-[var(--clay)]">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Water Date */}
            {watering.nextDate && (
              <div className="flex items-center gap-2 text-sm text-[var(--clay)]">
                <Calendar className="w-4 h-4" />
                <span>Next water: {new Date(watering.nextDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trajectory - Expandable */}
      <div className="bg-[var(--parchment)] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('trajectory')}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--clay)]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              health?.trajectory === 'improving' ? 'bg-[var(--moss)]/10' :
              health?.trajectory === 'declining' ? 'bg-[var(--spadix-yellow)]/10' :
              health?.trajectory === 'critical' ? 'bg-[var(--alert-red)]/10' :
              'bg-[var(--clay)]/10'
            }`}>
              <Activity className={`w-4 h-4 ${getTrajectoryColor(health?.trajectory ?? 'stable')}`} />
            </div>
            <div className="text-left">
              <div className={`flex items-center gap-2 ${getTrajectoryColor(health?.trajectory ?? 'stable')}`}>
                {getTrajectoryIcon(health?.trajectory ?? 'stable')}
                <span className="text-xl font-bold capitalize">{health?.trajectory ?? 'Unknown'}</span>
              </div>
              <p className="text-xs text-[var(--clay)]">
                Health Trajectory • {health?.confidence ?? 'low'} confidence
              </p>
            </div>
          </div>
          {expandedSection === 'trajectory' ? (
            <ChevronUp className="w-4 h-4 text-[var(--clay)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
          )}
        </button>

        {expandedSection === 'trajectory' && health && (
          <div className="px-4 pb-4 space-y-4">
            {/* Current Score */}
            <div className="p-3 bg-white/50 rounded">
              <p className="text-xs text-[var(--clay)]">Current Health Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(health.currentScore ?? 0)}`}>
                  {health.currentScore ?? '?'}
                </span>
                <span className="text-sm text-[var(--clay)]">/100</span>
              </div>
            </div>

            {/* Trends */}
            {health.trends && (
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2">Trend Analysis</h4>
                <div className="space-y-2">
                  {health.trends.ecDelta && (
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded text-sm">
                      <span className="text-[var(--clay)]">EC Delta</span>
                      <span className={
                        health.trends.ecDelta.direction === 'increasing' ? 'text-[var(--spadix-yellow)]' :
                        health.trends.ecDelta.direction === 'decreasing' ? 'text-[var(--moss)]' :
                        'text-[var(--bark)]'
                      }>
                        {health.trends.ecDelta.direction === 'increasing' ? '↑' :
                         health.trends.ecDelta.direction === 'decreasing' ? '↓' : '→'}
                        {' '}{health.trends.ecDelta.direction}
                      </span>
                    </div>
                  )}
                  {health.trends.phDrift && (
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded text-sm">
                      <span className="text-[var(--clay)]">pH Drift</span>
                      <span className={
                        health.trends.phDrift.direction === 'increasing' ? 'text-[var(--spadix-yellow)]' :
                        health.trends.phDrift.direction === 'decreasing' ? 'text-[var(--water-blue)]' :
                        'text-[var(--bark)]'
                      }>
                        {health.trends.phDrift.direction === 'increasing' ? '↑' :
                         health.trends.phDrift.direction === 'decreasing' ? '↓' : '→'}
                        {' '}{health.trends.phDrift.direction}
                      </span>
                    </div>
                  )}
                  {health.trends.substrateHealth && (
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded text-sm">
                      <span className="text-[var(--clay)]">Substrate Health</span>
                      <span className={
                        health.trends.substrateHealth.direction === 'increasing' ? 'text-[var(--moss)]' :
                        health.trends.substrateHealth.direction === 'decreasing' ? 'text-[var(--alert-red)]' :
                        'text-[var(--bark)]'
                      }>
                        {health.trends.substrateHealth.direction === 'increasing' ? '↑' :
                         health.trends.substrateHealth.direction === 'decreasing' ? '↓' : '→'}
                        {' '}{health.trends.substrateHealth.direction}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {health.summary && (
              <p className="text-sm text-[var(--clay)] italic p-3 bg-white/50 rounded">
                {health.summary}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

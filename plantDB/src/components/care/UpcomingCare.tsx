'use client'

import { useState, useEffect } from 'react'
import {
  Droplet,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Flower2,
  BarChart3,
  Clock
} from 'lucide-react'

interface UpcomingCareProps {
  plantId: string
  onActionComplete?: () => void
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
    factors: Array<{
      name: string
      impact: 'increase' | 'decrease' | 'neutral'
      adjustment: number
      description: string
    }>
    trend: {
      direction: 'increasing' | 'decreasing' | 'stable'
      significance: 'high' | 'medium' | 'low'
    } | null
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
    }>
    interventions: string[]
    alerts: Array<{
      level: 'info' | 'warning' | 'critical'
      type: string
      message: string
      actionRequired?: string
    }>
    summary: string
  }
  flowering: {
    likelyNextCycle: string | null
    daysUntilNextCycle: number | null
    confidence: 'high' | 'medium' | 'low'
    predictedPhases: {
      spatheEmergence: { start: string; duration: number } | null
      femalePhase: { start: string; end: string; duration: number } | null
      malePhase: { start: string; end: string; duration: number } | null
      totalDuration: number | null
    }
    pollinationWindow: {
      optimal: string | null
      rangeStart: string | null
      rangeEnd: string | null
      daysFromNow: number | null
    }
    seasonality: {
      hasSeason: boolean
      peakMonth: number | null
      troughMonth: number | null
      amplitude: number
    }
    statistics: {
      totalCycles: number
      completedCycles: number
      avgCycleInterval: number | null
      avgCycleDuration: number | null
      avgFemalePhase: number | null
      avgMalePhase: number | null
      cycleConsistency: 'high' | 'medium' | 'low'
      cyclesPerYear: number | null
    }
    insights: string[]
    summary: string
  }
}

interface RecommendationsResponse {
  recommendations: any[]
  predictions: MLPredictions
  mlMetadata: {
    dataPoints: {
      careLogs: number
      ecPhReadings: number
      floweringCycles: number
    }
    modelConfidence: 'high' | 'medium' | 'low'
    generatedAt: string
  }
  plantContext: {
    plantId: string
    healthStatus: string
    location: string | null
  }
}

export function UpcomingCare({ plantId, onActionComplete }: UpcomingCareProps) {
  const [data, setData] = useState<RecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'watering' | 'health' | 'flowering'>('watering')

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

      const responseData = await response.json()
      setData(responseData)
      setError(null)
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-[var(--moss)]/20 text-[var(--moss)]',
      medium: 'bg-[var(--spadix-yellow)]/20 text-[var(--spadix-yellow)]',
      low: 'bg-[var(--clay)]/20 text-[var(--clay)]'
    }
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[confidence]}`}>
        {confidence} confidence
      </span>
    )
  }

  const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-[var(--moss)]" />
      case 'declining':
      case 'critical':
        return <TrendingDown className="w-4 h-4 text-[var(--alert-red)]" />
      default:
        return <Minus className="w-4 h-4 text-[var(--clay)]" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--moss)]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/20 rounded-lg p-4">
        <p className="text-[var(--alert-red)]">Error: {error}</p>
      </div>
    )
  }

  if (!data) return null

  const { predictions, mlMetadata } = data

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[var(--parchment)] rounded-lg">
        {[
          { key: 'watering', label: 'Watering', icon: Droplet },
          { key: 'health', label: 'Health', icon: Activity },
          { key: 'flowering', label: 'Flowering', icon: Flower2 }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-white text-[var(--forest)] shadow-sm'
                : 'text-[var(--clay)] hover:text-[var(--bark)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Watering Tab */}
      {activeTab === 'watering' && (
        <div className="space-y-4">
          {/* Main Prediction Card */}
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
            <div className="bg-[var(--water-blue)]/10 px-4 py-3 border-b border-black/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-[var(--water-blue)]" />
                  <span className="font-medium text-[var(--bark)]">Next Watering</span>
                </div>
                {getConfidenceBadge(predictions.watering.confidence)}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-[var(--forest)]">
                  {predictions.watering.daysUntil !== null
                    ? predictions.watering.daysUntil <= 0
                      ? 'Now'
                      : predictions.watering.daysUntil
                    : '?'}
                </span>
                {predictions.watering.daysUntil !== null && predictions.watering.daysUntil > 0 && (
                  <span className="text-[var(--clay)]">days</span>
                )}
                <span className="text-sm text-[var(--clay)] ml-2">
                  ({formatDate(predictions.watering.nextDate)})
                </span>
              </div>

              {/* Interval Range */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-[var(--clay)] mb-1">
                  <span>Interval Range</span>
                  <span>{predictions.watering.interval.min}-{predictions.watering.interval.max} days</span>
                </div>
                <div className="relative h-2 bg-[var(--parchment)] rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-[var(--water-blue)]/30"
                    style={{
                      left: `${(predictions.watering.interval.min / 21) * 100}%`,
                      width: `${((predictions.watering.interval.max - predictions.watering.interval.min) / 21) * 100}%`
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-[var(--water-blue)] rounded-full -top-0.5 transform -translate-x-1/2"
                    style={{ left: `${(predictions.watering.interval.optimal / 21) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--clay)] mt-1">
                  <span>2d</span>
                  <span className="text-[var(--water-blue)] font-medium">
                    Optimal: {predictions.watering.interval.optimal}d
                  </span>
                  <span>21d</span>
                </div>
              </div>

              {/* Factors */}
              {predictions.watering.factors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-[var(--bark)]">Adjustment Factors</h4>
                  {predictions.watering.factors.map((factor, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--clay)]">{factor.name}</span>
                      <span className={`font-mono ${
                        factor.impact === 'decrease' ? 'text-[var(--water-blue)]' :
                        factor.impact === 'increase' ? 'text-[var(--spadix-yellow)]' :
                        'text-[var(--clay)]'
                      }`}>
                        {factor.impact === 'decrease' ? '-' : factor.impact === 'increase' ? '+' : ''}
                        {Math.abs(factor.adjustment).toFixed(1)}d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* History Stats */}
          <div className="bg-white border border-black/[0.08] rounded-lg p-4">
            <h4 className="text-sm font-medium text-[var(--bark)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Watering History
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--clay)]">Events</p>
                <p className="text-lg font-semibold text-[var(--forest)]">
                  {predictions.watering.history.totalEvents}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--clay)]">Avg Interval</p>
                <p className="text-lg font-semibold text-[var(--forest)]">
                  {predictions.watering.history.avgInterval}d
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--clay)]">Trend</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  {predictions.watering.history.trend === 'shortening' ? (
                    <TrendingDown className="w-4 h-4 text-[var(--water-blue)]" />
                  ) : predictions.watering.history.trend === 'lengthening' ? (
                    <TrendingUp className="w-4 h-4 text-[var(--spadix-yellow)]" />
                  ) : (
                    <Minus className="w-4 h-4 text-[var(--clay)]" />
                  )}
                  <span className="capitalize text-[var(--bark)]">
                    {predictions.watering.history.trend}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {/* Trajectory Card */}
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
            <div className={`px-4 py-3 border-b border-black/[0.04] ${
              predictions.health.trajectory === 'critical' ? 'bg-[var(--alert-red)]/10' :
              predictions.health.trajectory === 'declining' ? 'bg-[var(--spadix-yellow)]/10' :
              predictions.health.trajectory === 'improving' ? 'bg-[var(--moss)]/10' :
              'bg-[var(--parchment)]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTrajectoryIcon(predictions.health.trajectory)}
                  <span className="font-medium text-[var(--bark)] capitalize">
                    {predictions.health.trajectory} Health
                  </span>
                </div>
                {getConfidenceBadge(predictions.health.confidence)}
              </div>
            </div>
            <div className="p-4">
              {/* Current Score */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--clay)]">Substrate Health</span>
                  <span className="font-semibold text-[var(--bark)]">
                    {predictions.health.currentScore}/100
                  </span>
                </div>
                <div className="h-3 bg-[var(--parchment)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      predictions.health.currentScore >= 70 ? 'bg-[var(--moss)]' :
                      predictions.health.currentScore >= 40 ? 'bg-[var(--spadix-yellow)]' :
                      'bg-[var(--alert-red)]'
                    }`}
                    style={{ width: `${predictions.health.currentScore}%` }}
                  />
                </div>
              </div>

              {/* Predictions */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: '7 days', value: predictions.health.predicted['7d'] },
                  { label: '14 days', value: predictions.health.predicted['14d'] },
                  { label: '30 days', value: predictions.health.predicted['30d'] }
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-[var(--clay)]">{label}</p>
                    <p className={`text-lg font-semibold ${
                      value >= 70 ? 'text-[var(--moss)]' :
                      value >= 40 ? 'text-[var(--spadix-yellow)]' :
                      'text-[var(--alert-red)]'
                    }`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <p className="text-sm text-[var(--bark)] border-t border-black/[0.04] pt-3">
                {predictions.health.summary}
              </p>
            </div>
          </div>

          {/* Risk Factors */}
          {predictions.health.riskFactors.length > 0 && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[var(--bark)] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--spadix-yellow)]" />
                Risk Factors
              </h4>
              <div className="space-y-2">
                {predictions.health.riskFactors.map((risk, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-sm ${
                      risk.severity === 'critical' ? 'bg-[var(--alert-red)]/10 text-[var(--alert-red)]' :
                      risk.severity === 'high' ? 'bg-[var(--spadix-yellow)]/10 text-[var(--bark)]' :
                      'bg-[var(--parchment)] text-[var(--clay)]'
                    }`}
                  >
                    {risk.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interventions */}
          {predictions.health.interventions.length > 0 && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[var(--bark)] mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--moss)]" />
                Recommended Actions
              </h4>
              <ul className="space-y-2">
                {predictions.health.interventions.map((intervention, i) => (
                  <li key={i} className="text-sm text-[var(--clay)] flex items-start gap-2">
                    <span className="text-[var(--moss)] mt-0.5">•</span>
                    {intervention}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alerts */}
          {predictions.health.alerts.length > 0 && (
            <div className="space-y-2">
              {predictions.health.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    alert.level === 'critical'
                      ? 'bg-[var(--alert-red)]/10 border-[var(--alert-red)]/20'
                      : alert.level === 'warning'
                      ? 'bg-[var(--spadix-yellow)]/10 border-[var(--spadix-yellow)]/20'
                      : 'bg-[var(--parchment)] border-black/[0.08]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      alert.level === 'critical' ? 'text-[var(--alert-red)]' :
                      'text-[var(--spadix-yellow)]'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-[var(--bark)]">{alert.message}</p>
                      {alert.actionRequired && (
                        <p className="text-xs text-[var(--clay)] mt-1">{alert.actionRequired}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flowering Tab */}
      {activeTab === 'flowering' && (
        <div className="space-y-4">
          {/* Next Cycle Prediction */}
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
            <div className="bg-[var(--moss)]/10 px-4 py-3 border-b border-black/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flower2 className="w-5 h-5 text-[var(--moss)]" />
                  <span className="font-medium text-[var(--bark)]">Next Flowering Cycle</span>
                </div>
                {getConfidenceBadge(predictions.flowering.confidence)}
              </div>
            </div>
            <div className="p-4">
              {predictions.flowering.daysUntilNextCycle !== null ? (
                <>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-[var(--forest)]">
                      {predictions.flowering.daysUntilNextCycle <= 0
                        ? 'Soon'
                        : predictions.flowering.daysUntilNextCycle}
                    </span>
                    {predictions.flowering.daysUntilNextCycle > 0 && (
                      <span className="text-[var(--clay)]">days</span>
                    )}
                    <span className="text-sm text-[var(--clay)] ml-2">
                      ({formatDate(predictions.flowering.likelyNextCycle)})
                    </span>
                  </div>

                  {/* Pollination Window */}
                  {predictions.flowering.pollinationWindow.optimal && (
                    <div className="bg-[var(--parchment)] rounded-lg p-3 mb-4">
                      <p className="text-xs text-[var(--clay)] mb-1">Optimal Pollination Window</p>
                      <p className="text-sm font-medium text-[var(--forest)]">
                        {formatDate(predictions.flowering.pollinationWindow.rangeStart)} - {formatDate(predictions.flowering.pollinationWindow.rangeEnd)}
                      </p>
                      {predictions.flowering.pollinationWindow.daysFromNow !== null && (
                        <p className="text-xs text-[var(--clay)] mt-1">
                          {predictions.flowering.pollinationWindow.daysFromNow > 0
                            ? `${predictions.flowering.pollinationWindow.daysFromNow} days from now`
                            : 'Window active now'}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[var(--clay)] text-sm">
                  Not enough flowering data for prediction
                </p>
              )}

              {/* Summary */}
              <p className="text-sm text-[var(--bark)]">
                {predictions.flowering.summary}
              </p>
            </div>
          </div>

          {/* Statistics */}
          {predictions.flowering.statistics.completedCycles > 0 && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[var(--bark)] mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Flowering Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--clay)]">Total Cycles</p>
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    {predictions.flowering.statistics.totalCycles}
                  </p>
                </div>
                {predictions.flowering.statistics.cyclesPerYear && (
                  <div>
                    <p className="text-xs text-[var(--clay)]">Cycles/Year</p>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {predictions.flowering.statistics.cyclesPerYear}
                    </p>
                  </div>
                )}
                {predictions.flowering.statistics.avgCycleInterval && (
                  <div>
                    <p className="text-xs text-[var(--clay)]">Avg Interval</p>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {predictions.flowering.statistics.avgCycleInterval}d
                    </p>
                  </div>
                )}
                {predictions.flowering.statistics.avgFemalePhase && (
                  <div>
                    <p className="text-xs text-[var(--clay)]">Female Phase</p>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {predictions.flowering.statistics.avgFemalePhase}d
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          {predictions.flowering.insights.length > 0 && (
            <div className="bg-white border border-black/[0.08] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[var(--bark)] mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[var(--moss)]" />
                Insights
              </h4>
              <ul className="space-y-2">
                {predictions.flowering.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-[var(--clay)] flex items-start gap-2">
                    <span className="text-[var(--moss)] mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seasonality */}
          {predictions.flowering.seasonality.hasSeason && (
            <div className="bg-[var(--parchment)] rounded-lg p-3">
              <p className="text-xs text-[var(--clay)] mb-1">Seasonal Pattern Detected</p>
              <p className="text-sm text-[var(--bark)]">
                Peak flowering: Month {predictions.flowering.seasonality.peakMonth}
                {predictions.flowering.seasonality.troughMonth && (
                  <> • Lowest: Month {predictions.flowering.seasonality.troughMonth}</>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Model Metadata Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--clay)] pt-2 border-t border-black/[0.04]">
        <span>
          Data: {mlMetadata.dataPoints.careLogs} care logs, {mlMetadata.dataPoints.ecPhReadings} EC/pH readings
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(mlMetadata.generatedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

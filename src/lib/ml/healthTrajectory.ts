/**
 * Health Trajectory Predictor
 *
 * Tracks EC/pH trends over time to predict substrate health
 * and identify declining conditions before they become critical.
 *
 * Key metrics:
 * - EC input/output delta (salt buildup)
 * - pH drift rate
 * - Substrate health score trajectory
 */

import {
  DataPoint,
  detectTrend,
  detectAnomaly,
  detectAnomalies,
  linearRegression,
  predictValue,
  calculateConfidenceInterval,
  calculateEWMA,
  standardDeviation,
  calculateModelConfidence,
  TrendResult,
  AnomalyResult
} from './statisticalAnalyzer'

export interface ECPHReading {
  date: Date | string
  ecIn?: number | null
  ecOut?: number | null
  phIn?: number | null
  phOut?: number | null
}

export interface HealthTrajectoryResult {
  trajectory: 'improving' | 'stable' | 'declining' | 'critical'
  currentScore: number              // 0-100
  predictedScore7d: number          // Predicted score in 7 days
  predictedScore14d: number         // Predicted score in 14 days
  predictedScore30d: number         // Predicted score in 30 days
  confidence: 'high' | 'medium' | 'low'
  riskFactors: RiskFactor[]
  interventions: string[]
  trends: {
    ecDelta: TrendResult | null     // EC output - input over time
    phDrift: TrendResult | null     // pH drift from optimal
    substrateHealth: TrendResult | null
  }
  alerts: HealthAlert[]
  dataPoints: number
}

export interface RiskFactor {
  type: 'ec_buildup' | 'ph_drift' | 'substrate_degradation' | 'nutrient_lockout' | 'root_stress'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  value?: number
  threshold?: number
}

export interface HealthAlert {
  level: 'info' | 'warning' | 'critical'
  type: string
  message: string
  actionRequired?: string
}

// Optimal ranges for anthurium
const OPTIMAL_RANGES = {
  ecIn: { min: 0.8, max: 1.5, optimal: 1.15 },
  ecOut: { min: 0.8, max: 2.0, optimal: 1.3 },
  ecDelta: { max: 0.5 },  // Max acceptable EC buildup
  phIn: { min: 5.5, max: 6.0, optimal: 5.7 },
  phOut: { min: 5.5, max: 6.5, optimal: 6.0 },
  phDrift: { max: 0.3 }   // Max acceptable pH change
}

/**
 * Main health trajectory prediction
 */
export function predictHealthTrajectory(
  readings: ECPHReading[],
  lastRepotDate?: Date | string | null
): HealthTrajectoryResult {
  const riskFactors: RiskFactor[] = []
  const interventions: string[] = []
  const alerts: HealthAlert[] = []

  // Need at least 3 readings for trajectory analysis
  if (readings.length < 3) {
    return {
      trajectory: 'stable',
      currentScore: 80,
      predictedScore7d: 80,
      predictedScore14d: 80,
      predictedScore30d: 80,
      confidence: 'low',
      riskFactors: [],
      interventions: ['Continue monitoring - more data needed for predictions'],
      trends: { ecDelta: null, phDrift: null, substrateHealth: null },
      alerts: [],
      dataPoints: readings.length
    }
  }

  // Sort readings by date (most recent first)
  const sortedReadings = [...readings].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calculate EC delta trend (output - input)
  const ecDeltaTrend = analyzeECDelta(sortedReadings)
  if (ecDeltaTrend.trend) {
    if (ecDeltaTrend.currentDelta > OPTIMAL_RANGES.ecDelta.max) {
      riskFactors.push({
        type: 'ec_buildup',
        severity: ecDeltaTrend.currentDelta > 1.0 ? 'high' : 'medium',
        description: `EC buildup of ${ecDeltaTrend.currentDelta.toFixed(2)} detected`,
        value: ecDeltaTrend.currentDelta,
        threshold: OPTIMAL_RANGES.ecDelta.max
      })

      if (ecDeltaTrend.trend.direction === 'increasing') {
        alerts.push({
          level: ecDeltaTrend.currentDelta > 1.0 ? 'critical' : 'warning',
          type: 'ec_buildup',
          message: `EC buildup increasing (${ecDeltaTrend.currentDelta.toFixed(2)})`,
          actionRequired: 'Consider flushing with pH-adjusted water'
        })
        interventions.push('Flush substrate with pH 5.7 water at half strength')
      }
    }
  }

  // Calculate pH drift trend
  const phDriftTrend = analyzePHDrift(sortedReadings)
  if (phDriftTrend.trend) {
    if (phDriftTrend.currentDrift > OPTIMAL_RANGES.phDrift.max) {
      riskFactors.push({
        type: 'ph_drift',
        severity: phDriftTrend.currentDrift > 0.6 ? 'high' : 'medium',
        description: `pH drift of ${phDriftTrend.currentDrift.toFixed(2)} from input`,
        value: phDriftTrend.currentDrift,
        threshold: OPTIMAL_RANGES.phDrift.max
      })

      if (phDriftTrend.avgPhOut && phDriftTrend.avgPhOut > 6.5) {
        alerts.push({
          level: 'warning',
          type: 'ph_high',
          message: `Output pH trending high (${phDriftTrend.avgPhOut.toFixed(2)})`,
          actionRequired: 'Risk of micronutrient lockout - acidify input water'
        })
        interventions.push('Lower input pH to 5.5-5.7')
      } else if (phDriftTrend.avgPhOut && phDriftTrend.avgPhOut < 5.5) {
        alerts.push({
          level: 'warning',
          type: 'ph_low',
          message: `Output pH trending low (${phDriftTrend.avgPhOut.toFixed(2)})`,
          actionRequired: 'Risk of macronutrient lockout - raise input pH'
        })
        interventions.push('Raise input pH to 5.8-6.0')
      }
    }
  }

  // Calculate substrate health scores over time
  const healthScores = calculateHealthScoreTimeSeries(sortedReadings, lastRepotDate)
  const healthTrend = healthScores.length >= 3 ? detectTrend(healthScores) : null

  const currentScore = healthScores.length > 0 ? healthScores[0].value : 80

  // Predict future scores
  const predictedScore7d = healthScores.length >= 3
    ? Math.max(0, Math.min(100, predictValue(healthScores, 7)))
    : currentScore

  const predictedScore14d = healthScores.length >= 3
    ? Math.max(0, Math.min(100, predictValue(healthScores, 14)))
    : currentScore

  const predictedScore30d = healthScores.length >= 3
    ? Math.max(0, Math.min(100, predictValue(healthScores, 30)))
    : currentScore

  // Determine trajectory
  let trajectory: 'improving' | 'stable' | 'declining' | 'critical'
  if (currentScore < 30) {
    trajectory = 'critical'
    alerts.push({
      level: 'critical',
      type: 'substrate_failure',
      message: 'Substrate health critically low',
      actionRequired: 'Immediate repotting recommended'
    })
    interventions.push('Repot with fresh substrate immediately')
  } else if (healthTrend?.direction === 'increasing' && healthTrend.slope > 0.3) {
    trajectory = 'improving'
  } else if (healthTrend?.direction === 'decreasing' && healthTrend.slope < -0.3) {
    trajectory = 'declining'
    if (predictedScore30d < 40) {
      riskFactors.push({
        type: 'substrate_degradation',
        severity: 'high',
        description: 'Substrate health projected to decline below safe threshold'
      })
      interventions.push('Plan substrate refresh within 2-4 weeks')
    }
  } else {
    trajectory = 'stable'
  }

  // Check for nutrient lockout risk
  const lockoutRisk = assessNutrientLockoutRisk(sortedReadings)
  if (lockoutRisk.risk) {
    riskFactors.push({
      type: 'nutrient_lockout',
      severity: lockoutRisk.severity,
      description: lockoutRisk.description
    })
    if (lockoutRisk.intervention) {
      interventions.push(lockoutRisk.intervention)
    }
  }

  // Check substrate age
  if (lastRepotDate) {
    const monthsSinceRepot = daysBetween(new Date(lastRepotDate), new Date()) / 30
    if (monthsSinceRepot > 18) {
      riskFactors.push({
        type: 'substrate_degradation',
        severity: 'medium',
        description: `${Math.round(monthsSinceRepot)} months since last repot`
      })
      interventions.push('Consider substrate refresh based on age')
    }
  }

  // Calculate confidence
  const confidence = calculateModelConfidence(
    readings.length,
    healthTrend?.rSquared || 0,
    alerts.length
  )

  return {
    trajectory,
    currentScore: Math.round(currentScore),
    predictedScore7d: Math.round(predictedScore7d),
    predictedScore14d: Math.round(predictedScore14d),
    predictedScore30d: Math.round(predictedScore30d),
    confidence,
    riskFactors,
    interventions: [...new Set(interventions)], // Dedupe
    trends: {
      ecDelta: ecDeltaTrend.trend,
      phDrift: phDriftTrend.trend,
      substrateHealth: healthTrend
    },
    alerts,
    dataPoints: readings.length
  }
}

/**
 * Analyze EC delta (output - input) trend
 */
function analyzeECDelta(readings: ECPHReading[]): {
  trend: TrendResult | null
  currentDelta: number
  avgDelta: number
} {
  const deltas: DataPoint[] = readings
    .filter(r => r.ecIn != null && r.ecOut != null)
    .map(r => ({
      date: new Date(r.date),
      value: (r.ecOut as number) - (r.ecIn as number)
    }))

  if (deltas.length < 3) {
    return { trend: null, currentDelta: 0, avgDelta: 0 }
  }

  const trend = detectTrend(deltas)
  const currentDelta = deltas[0].value
  const avgDelta = deltas.reduce((sum, d) => sum + d.value, 0) / deltas.length

  return { trend, currentDelta, avgDelta }
}

/**
 * Analyze pH drift trend
 */
function analyzePHDrift(readings: ECPHReading[]): {
  trend: TrendResult | null
  currentDrift: number
  avgPhOut: number | null
} {
  const drifts: DataPoint[] = readings
    .filter(r => r.phIn != null && r.phOut != null)
    .map(r => ({
      date: new Date(r.date),
      value: Math.abs((r.phOut as number) - (r.phIn as number))
    }))

  const phOuts = readings
    .filter(r => r.phOut != null)
    .map(r => r.phOut as number)

  if (drifts.length < 3) {
    return {
      trend: null,
      currentDrift: drifts.length > 0 ? drifts[0].value : 0,
      avgPhOut: phOuts.length > 0 ? phOuts.reduce((a, b) => a + b, 0) / phOuts.length : null
    }
  }

  const trend = detectTrend(drifts)
  const currentDrift = drifts[0].value
  const avgPhOut = phOuts.length > 0 ? phOuts.reduce((a, b) => a + b, 0) / phOuts.length : null

  return { trend, currentDrift, avgPhOut }
}

/**
 * Calculate health score time series
 */
function calculateHealthScoreTimeSeries(
  readings: ECPHReading[],
  lastRepotDate?: Date | string | null
): DataPoint[] {
  return readings
    .filter(r => r.ecIn != null || r.ecOut != null || r.phIn != null || r.phOut != null)
    .map(r => ({
      date: new Date(r.date),
      value: calculateSingleHealthScore(r, lastRepotDate)
    }))
}

/**
 * Calculate health score for a single reading
 */
function calculateSingleHealthScore(
  reading: ECPHReading,
  lastRepotDate?: Date | string | null
): number {
  let score = 100
  const deductions: number[] = []

  // EC input deviation from optimal
  if (reading.ecIn != null) {
    const ecInDev = Math.abs(reading.ecIn - OPTIMAL_RANGES.ecIn.optimal)
    if (ecInDev > 0.5) deductions.push(15)
    else if (ecInDev > 0.3) deductions.push(8)
    else if (ecInDev > 0.15) deductions.push(3)
  }

  // EC output - check for buildup
  if (reading.ecOut != null) {
    if (reading.ecOut > 2.5) deductions.push(25)
    else if (reading.ecOut > 2.0) deductions.push(15)
    else if (reading.ecOut > 1.8) deductions.push(8)
  }

  // EC delta (buildup)
  if (reading.ecIn != null && reading.ecOut != null) {
    const delta = reading.ecOut - reading.ecIn
    if (delta > 1.0) deductions.push(20)
    else if (delta > 0.7) deductions.push(12)
    else if (delta > 0.5) deductions.push(6)
  }

  // pH output deviation from optimal range
  if (reading.phOut != null) {
    if (reading.phOut > 6.8 || reading.phOut < 5.2) deductions.push(25)
    else if (reading.phOut > 6.5 || reading.phOut < 5.5) deductions.push(12)
    else if (reading.phOut > 6.2 || reading.phOut < 5.6) deductions.push(5)
  }

  // pH drift
  if (reading.phIn != null && reading.phOut != null) {
    const drift = Math.abs(reading.phOut - reading.phIn)
    if (drift > 0.8) deductions.push(15)
    else if (drift > 0.5) deductions.push(8)
    else if (drift > 0.3) deductions.push(3)
  }

  // Substrate age factor
  if (lastRepotDate) {
    const monthsSinceRepot = daysBetween(new Date(lastRepotDate), new Date(reading.date)) / 30
    if (monthsSinceRepot > 24) deductions.push(10)
    else if (monthsSinceRepot > 18) deductions.push(5)
  }

  // Apply deductions (diminishing impact)
  deductions.sort((a, b) => b - a)
  deductions.forEach((d, i) => {
    score -= d * Math.pow(0.8, i) // Each subsequent issue has less impact
  })

  return Math.max(0, Math.min(100, score))
}

/**
 * Assess nutrient lockout risk based on pH
 */
function assessNutrientLockoutRisk(readings: ECPHReading[]): {
  risk: boolean
  severity: 'low' | 'medium' | 'high'
  description: string
  intervention?: string
} {
  const recentPhOuts = readings
    .slice(0, 5)
    .filter(r => r.phOut != null)
    .map(r => r.phOut as number)

  if (recentPhOuts.length < 2) {
    return { risk: false, severity: 'low', description: '' }
  }

  const avgPhOut = recentPhOuts.reduce((a, b) => a + b, 0) / recentPhOuts.length

  // High pH - micronutrient lockout (Fe, Mn, Zn, Cu, B)
  if (avgPhOut > 6.8) {
    return {
      risk: true,
      severity: 'high',
      description: `pH ${avgPhOut.toFixed(2)} - high risk of micronutrient lockout (Fe, Mn, Zn)`,
      intervention: 'Add iron chelate supplement, lower input pH'
    }
  } else if (avgPhOut > 6.5) {
    return {
      risk: true,
      severity: 'medium',
      description: `pH ${avgPhOut.toFixed(2)} - moderate risk of micronutrient availability issues`,
      intervention: 'Monitor leaf coloration, consider pH correction'
    }
  }

  // Low pH - macronutrient lockout (Ca, Mg, P)
  if (avgPhOut < 5.0) {
    return {
      risk: true,
      severity: 'high',
      description: `pH ${avgPhOut.toFixed(2)} - high risk of calcium/magnesium lockout`,
      intervention: 'Raise input pH, consider lime amendment'
    }
  } else if (avgPhOut < 5.5) {
    return {
      risk: true,
      severity: 'medium',
      description: `pH ${avgPhOut.toFixed(2)} - moderate risk of macronutrient availability issues`,
      intervention: 'Raise input pH slightly'
    }
  }

  return { risk: false, severity: 'low', description: '' }
}

/**
 * Calculate current substrate health score
 */
export function calculateSubstrateHealthScore(
  readings: ECPHReading[],
  lastRepotDate?: Date | string | null
): number {
  if (readings.length === 0) return 80

  // Use most recent readings with EWMA
  const recentReadings = readings.slice(0, 5)
  const scores = recentReadings.map(r => calculateSingleHealthScore(r, lastRepotDate))

  return Math.round(calculateEWMA(scores.reverse(), 0.4))
}

/**
 * Detect anomalies in EC/pH readings
 */
export function detectReadingAnomalies(readings: ECPHReading[]): {
  ecAnomalies: (ECPHReading & AnomalyResult)[]
  phAnomalies: (ECPHReading & AnomalyResult)[]
} {
  const ecOuts = readings.filter(r => r.ecOut != null)
  const phOuts = readings.filter(r => r.phOut != null)

  const ecDataPoints: DataPoint[] = ecOuts.map(r => ({
    date: new Date(r.date),
    value: r.ecOut as number
  }))

  const phDataPoints: DataPoint[] = phOuts.map(r => ({
    date: new Date(r.date),
    value: r.phOut as number
  }))

  const ecAnomalousPoints = detectAnomalies(ecDataPoints, 2.0)
  const phAnomalousPoints = detectAnomalies(phDataPoints, 2.0)

  // Map anomalies back to original readings
  const ecAnomalies = ecAnomalousPoints.map(ap => {
    const reading = ecOuts.find(r =>
      new Date(r.date).getTime() === new Date(ap.date).getTime()
    )
    return { ...reading!, ...ap }
  })

  const phAnomalies = phAnomalousPoints.map(ap => {
    const reading = phOuts.find(r =>
      new Date(r.date).getTime() === new Date(ap.date).getTime()
    )
    return { ...reading!, ...ap }
  })

  return { ecAnomalies, phAnomalies }
}

/**
 * Generate health trajectory summary
 */
export function generateHealthSummary(result: HealthTrajectoryResult): string {
  const summaryParts: string[] = []

  // Trajectory statement
  switch (result.trajectory) {
    case 'improving':
      summaryParts.push('Substrate health is improving.')
      break
    case 'stable':
      summaryParts.push('Substrate health is stable.')
      break
    case 'declining':
      summaryParts.push('Substrate health is declining - attention needed.')
      break
    case 'critical':
      summaryParts.push('CRITICAL: Immediate substrate intervention required.')
      break
  }

  // Score projection
  if (result.predictedScore30d < result.currentScore - 10) {
    summaryParts.push(`Projected to decline from ${result.currentScore} to ${result.predictedScore30d} over 30 days.`)
  } else if (result.predictedScore30d > result.currentScore + 10) {
    summaryParts.push(`Projected to improve from ${result.currentScore} to ${result.predictedScore30d} over 30 days.`)
  }

  // Key risks
  const highRisks = result.riskFactors.filter(r => r.severity === 'high' || r.severity === 'critical')
  if (highRisks.length > 0) {
    summaryParts.push(`Key concerns: ${highRisks.map(r => r.description).join('; ')}.`)
  }

  return summaryParts.join(' ')
}

/**
 * Helper: Calculate days between dates
 */
function daysBetween(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
}

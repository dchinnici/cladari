/**
 * EC/pH Analysis Utilities
 *
 * Analyzes electrical conductivity and pH data from care logs
 * to detect substrate issues and generate health scores
 */

import {
  ECPHData,
  ECPHContext,
  ECPHTrend,
  Alert,
  AlertLevel,
  SubstrateHealth,
  CareLogWithDetails,
  EC_PH_TARGETS
} from './types'

/**
 * Parse EC/pH data from care log details field (JSON)
 */
export function parseECPHData(details: string | null): ECPHData | null {
  if (!details) return null

  try {
    const parsed = JSON.parse(details)
    return {
      inputEC: parsed.inputEC ? parseFloat(parsed.inputEC) : undefined,
      inputPH: parsed.inputPH ? parseFloat(parsed.inputPH) : undefined,
      outputEC: parsed.outputEC ? parseFloat(parsed.outputEC) : undefined,
      outputPH: parsed.outputPH ? parseFloat(parsed.outputPH) : undefined,
      notes: parsed.notes
    }
  } catch {
    return null
  }
}

/**
 * Calculate average EC/pH values from recent care logs
 * Uses only the last 3 logs by default to show current conditions
 * rather than historical averages that may include outliers
 */
export function calculateAverageECPH(
  careLogs: CareLogWithDetails[],
  limit: number = 3
): {
  avgInputEC: number | null
  avgInputPH: number | null
  avgOutputEC: number | null
  avgOutputPH: number | null
} {
  const recentLogs = careLogs
    .slice(0, limit)
    .map(log => parseECPHData(log.details))
    .filter(Boolean) as ECPHData[]

  if (recentLogs.length === 0) {
    return {
      avgInputEC: null,
      avgInputPH: null,
      avgOutputEC: null,
      avgOutputPH: null
    }
  }

  type AccumulatorType = {
    inputEC: number
    inputPH: number
    outputEC: number
    outputPH: number
    countInputEC: number
    countInputPH: number
    countOutputEC: number
    countOutputPH: number
  }

  const sum = recentLogs.reduce<AccumulatorType>((acc, data) => ({
    inputEC: acc.inputEC + (data.inputEC || 0),
    inputPH: acc.inputPH + (data.inputPH || 0),
    outputEC: acc.outputEC + (data.outputEC || 0),
    outputPH: acc.outputPH + (data.outputPH || 0),
    countInputEC: acc.countInputEC + (data.inputEC ? 1 : 0),
    countInputPH: acc.countInputPH + (data.inputPH ? 1 : 0),
    countOutputEC: acc.countOutputEC + (data.outputEC ? 1 : 0),
    countOutputPH: acc.countOutputPH + (data.outputPH ? 1 : 0)
  }), {
    inputEC: 0,
    inputPH: 0,
    outputEC: 0,
    outputPH: 0,
    countInputEC: 0,
    countInputPH: 0,
    countOutputEC: 0,
    countOutputPH: 0
  })

  return {
    avgInputEC: sum.countInputEC > 0 ? sum.inputEC / sum.countInputEC : null,
    avgInputPH: sum.countInputPH > 0 ? sum.inputPH / sum.countInputPH : null,
    avgOutputEC: sum.countOutputEC > 0 ? sum.outputEC / sum.countOutputEC : null,
    avgOutputPH: sum.countOutputPH > 0 ? sum.outputPH / sum.countOutputPH : null
  }
}

/**
 * Calculate EC variance between input and output
 */
export function calculateECVariance(inputEC: number | null, outputEC: number | null): number | null {
  if (!inputEC || !outputEC) return null
  return Math.abs(outputEC - inputEC)
}

/**
 * Calculate pH drift rate (change per week)
 * Only counts problematic drift (away from optimal range)
 * Improvements toward optimal range are not counted as drift
 */
export function calculatePHDriftRate(careLogs: CareLogWithDetails[]): number | null {
  const logsWithPH = careLogs
    .map(log => ({
      date: log.date,
      data: parseECPHData(log.details)
    }))
    .filter(item => item.data?.outputPH)
    .slice(0, 5) // Last 5 readings for recent pH trend

  if (logsWithPH.length < 2) return null

  const optimalPH = 5.8 // Target pH for anthuriums
  let totalDrift = 0
  let count = 0

  for (let i = 0; i < logsWithPH.length - 1; i++) {
    const current = logsWithPH[i]
    const previous = logsWithPH[i + 1]

    if (current.data?.outputPH && previous.data?.outputPH) {
      const currentPH = current.data.outputPH
      const previousPH = previous.data.outputPH

      // Check if pH is moving away from optimal (problematic drift)
      const prevDistance = Math.abs(previousPH - optimalPH)
      const currDistance = Math.abs(currentPH - optimalPH)

      // Only count as drift if moving away from optimal or if pH is critically low/high
      if (currDistance > prevDistance || currentPH < EC_PH_TARGETS.phCriticalLow || currentPH > EC_PH_TARGETS.phCriticalHigh) {
        const phDiff = currentPH - previousPH
        const daysDiff = (current.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24)
        const weeksDiff = daysDiff / 7

        if (weeksDiff > 0) {
          totalDrift += Math.abs(phDiff) / weeksDiff
          count++
        }
      }
    }
  }

  return count > 0 ? totalDrift / count : null
}

/**
 * Determine EC/pH trend
 */
export function determineECPHTrend(
  avgInputEC: number | null,
  avgOutputEC: number | null,
  avgInputPH: number | null,
  avgOutputPH: number | null,
  phDriftRate: number | null
): ECPHTrend {
  // Critical pH issues take precedence
  if (avgOutputPH && avgOutputPH < EC_PH_TARGETS.phCriticalLow) {
    return 'ph_drift_low'
  }
  if (avgOutputPH && avgOutputPH > EC_PH_TARGETS.phCriticalHigh) {
    return 'ph_drift_high'
  }

  // EC variance checks
  if (avgInputEC && avgOutputEC) {
    const variance = Math.abs(avgOutputEC - avgInputEC)

    if (variance > EC_PH_TARGETS.ecVarianceCritical) {
      if (avgOutputEC > avgInputEC) {
        return 'ec_buildup'
      } else {
        return 'ec_depleted'
      }
    }
  }

  // pH drift rate check
  if (phDriftRate && phDriftRate > EC_PH_TARGETS.phDriftWarning) {
    if (avgOutputPH && avgInputPH && avgOutputPH < avgInputPH) {
      return 'ph_drift_low'
    }
    return 'substrate_degrading'
  }

  return 'healthy'
}

/**
 * Generate alerts based on EC/pH data
 */
export function generateECPHAlerts(
  avgInputEC: number | null,
  avgOutputEC: number | null,
  avgInputPH: number | null,
  avgOutputPH: number | null,
  ecVariance: number | null,
  phDriftRate: number | null
): Alert[] {
  const alerts: Alert[] = []

  // Critical EC buildup
  if (ecVariance && ecVariance > EC_PH_TARGETS.ecVarianceCritical && avgOutputEC && avgInputEC && avgOutputEC > avgInputEC) {
    alerts.push({
      level: 'critical' as AlertLevel,
      type: 'ec_critical',
      message: `Critical EC buildup detected (Output: ${avgOutputEC.toFixed(2)} vs Input: ${avgInputEC.toFixed(2)})`,
      actionRequired: 'Flush substrate with pH-balanced water immediately'
    })
  }

  // Critical pH
  if (avgOutputPH && avgOutputPH < EC_PH_TARGETS.phCriticalLow) {
    alerts.push({
      level: 'critical' as AlertLevel,
      type: 'ph_critical',
      message: `Critical substrate pH (${avgOutputPH.toFixed(1)})`,
      actionRequired: 'Consider substrate replacement or heavy buffering with CalMag'
    })
  }

  // EC variance warning
  if (ecVariance && ecVariance > EC_PH_TARGETS.ecVarianceWarning && ecVariance <= EC_PH_TARGETS.ecVarianceCritical) {
    alerts.push({
      level: 'warning' as AlertLevel,
      type: 'ec_variance_high',
      message: `EC variance elevated (${ecVariance.toFixed(2)})`,
      actionRequired: 'Monitor closely, consider flush if continues'
    })
  }

  // pH drift warning - only if drift is problematic
  if (phDriftRate && phDriftRate > EC_PH_TARGETS.phDriftWarning && avgOutputPH) {
    // Determine if drift is problematic based on current pH
    if (avgOutputPH < 5.5 || avgOutputPH > 6.5) {
      alerts.push({
        level: 'warning' as AlertLevel,
        type: 'ph_drift',
        message: `pH drifting outside optimal range (current: ${avgOutputPH.toFixed(1)})`,
        actionRequired: 'pH buffer with CalMag, monitor substrate age'
      })
    }
  }

  // Healthy status
  if (alerts.length === 0 && avgInputEC && avgOutputEC && avgInputPH && avgOutputPH) {
    alerts.push({
      level: 'healthy' as AlertLevel,
      type: 'ec_critical', // Using existing type for healthy status
      message: 'EC/pH parameters within healthy range'
    })
  }

  return alerts
}

/**
 * Calculate substrate health score (0-100)
 *
 * Based on user's formula:
 * - Base score: 100
 * - EC variance > 0.3: -20
 * - pH drift > 0.8: -15
 * - pH out of range: -25
 * - Age penalty: -2 per month beyond 12 months
 */
export function calculateSubstrateHealth(
  avgInputEC: number | null,
  avgOutputEC: number | null,
  avgInputPH: number | null,
  avgOutputPH: number | null,
  lastRepotDate: Date | null
): SubstrateHealth {
  let score = 100
  const issues: string[] = []
  const recommendations: string[] = []

  // Calculate months since repot
  let monthsSinceRepot: number | null = null
  if (lastRepotDate) {
    monthsSinceRepot = (Date.now() - lastRepotDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  }

  // EC variance penalty
  if (avgInputEC && avgOutputEC) {
    const ecVariance = Math.abs(avgOutputEC - avgInputEC)
    if (ecVariance > 0.3) {
      score -= 20
      issues.push(`High EC variance: ${ecVariance.toFixed(2)}`)
      recommendations.push('Consider flushing substrate')
    }
  }

  // pH drift penalty - only if output pH is problematic
  if (avgInputPH && avgOutputPH) {
    const phDrift = Math.abs(avgOutputPH - avgInputPH)
    // Only penalize if output pH is outside optimal range AND drifting
    if (phDrift > 0.8 && (avgOutputPH < 5.5 || avgOutputPH > 6.5)) {
      score -= 15
      issues.push(`pH drift outside optimal range: ${avgOutputPH.toFixed(1)}`)
      recommendations.push('Add pH buffer (CalMag)')
    }
  }

  // pH out of range penalty
  if (avgOutputPH) {
    if (avgOutputPH < EC_PH_TARGETS.phCriticalLow || avgOutputPH > EC_PH_TARGETS.phCriticalHigh) {
      score -= 25
      issues.push(`Output pH out of range: ${avgOutputPH.toFixed(1)}`)
      recommendations.push('Consider substrate replacement')
    }
  }

  // Age penalty (substrate degrades over time)
  if (monthsSinceRepot && monthsSinceRepot > 12) {
    const agePenalty = (monthsSinceRepot - 12) * 2
    score -= agePenalty
    issues.push(`Substrate age: ${monthsSinceRepot.toFixed(0)} months`)
    recommendations.push('Plan for repotting soon')
  }

  // No issues detected
  if (issues.length === 0) {
    recommendations.push('Substrate health is excellent, maintain current care routine')
  }

  return {
    score: Math.max(0, Math.round(score)),
    issues,
    recommendations,
    monthsSinceRepot: monthsSinceRepot ? Math.round(monthsSinceRepot) : null
  }
}

/**
 * Analyze EC/pH context for a plant
 */
export function analyzeECPHContext(
  careLogs: CareLogWithDetails[],
  lastRepotDate: Date | null
): ECPHContext | undefined {
  // Need at least some care logs with EC/pH data
  const logsWithData = careLogs
    .map(log => parseECPHData(log.details))
    .filter(Boolean)

  if (logsWithData.length === 0) {
    return undefined
  }

  // Calculate averages
  const averages = calculateAverageECPH(careLogs)
  const { avgInputEC, avgInputPH, avgOutputEC, avgOutputPH } = averages

  // Calculate variance and drift
  // IMPORTANT: EC variance should only be calculated from PAIRED readings (logs with both input and output)
  // This prevents false alerts when rain water flushes (input only) artificially lower the average
  // Use only last 3 logs to focus on current conditions
  const pairedReadings = careLogs
    .slice(0, 3)
    .map(log => parseECPHData(log.details))
    .filter(data => data && data.inputEC != null && data.outputEC != null) as ECPHData[]

  let ecVariance: number | null = null
  if (pairedReadings.length > 0) {
    const avgPairedInputEC = pairedReadings.reduce((sum, data) => sum + data.inputEC!, 0) / pairedReadings.length
    const avgPairedOutputEC = pairedReadings.reduce((sum, data) => sum + data.outputEC!, 0) / pairedReadings.length
    ecVariance = calculateECVariance(avgPairedInputEC, avgPairedOutputEC)
  }

  const phDrift = calculatePHDriftRate(careLogs)

  // Determine trend
  const trend = determineECPHTrend(
    avgInputEC,
    avgOutputEC,
    avgInputPH,
    avgOutputPH,
    phDrift
  )

  // Calculate substrate health
  const substrateHealth = calculateSubstrateHealth(
    avgInputEC,
    avgOutputEC,
    avgInputPH,
    avgOutputPH,
    lastRepotDate
  )

  return {
    avgInputEC,
    avgInputPH,
    avgOutputEC,
    avgOutputPH,
    trend,
    variance: {
      ecVariance,
      phDrift
    },
    substrateHealthScore: substrateHealth.score
  }
}

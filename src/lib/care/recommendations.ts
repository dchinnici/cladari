/**
 * Care Recommendation Engine
 *
 * Generates adaptive care recommendations based on:
 * - Historical care patterns
 * - Environmental factors (temp, humidity, VPD)
 * - EC/pH trends
 * - Substrate health
 */

import prisma from '../prisma'
import {
  calculateWateringFrequency,
  calculateFertilizingFrequency,
  getDaysSinceLastWatering,
  getDaysSinceLastFertilizing,
  getLastWateringEvent,
  getLastFertilizingEvent,
  isWateringEvent,
  isFertilizingEvent
} from '../careLogUtils'
import {
  analyzeECPHContext,
  calculateAverageECPH,
  generateECPHAlerts,
  calculateECVariance,
  calculatePHDriftRate
} from './ecPhUtils'
import {
  CareRecommendation,
  EnvironmentalContext,
  ConfidenceLevel,
  DEFAULT_INTERVALS,
  CONFIDENCE_THRESHOLDS,
  CareLogWithDetails
} from './types'

/**
 * Calculate environmental adjustment factor
 *
 * User requirements:
 * - Higher temp (>75°F / 24°C) → reduce watering interval by 15%
 * - Higher humidity (>60%) → increase watering interval by 15%
 */
function getEnvironmentalAdjustment(
  temperature?: number,
  humidity?: number
): EnvironmentalContext {
  let adjustment = 1.0 // No change
  const reasons: string[] = []

  // Temperature adjustment (24°C = 75°F)
  if (temperature && temperature > 24) {
    adjustment *= 0.85 // Reduce interval by 15% (water more frequently)
    reasons.push(`High temperature (${temperature.toFixed(1)}°C) increases water demand`)
  }

  // Humidity adjustment
  if (humidity && humidity > 60) {
    adjustment *= 1.15 // Increase interval by 15% (water less frequently)
    reasons.push(`High humidity (${humidity.toFixed(0)}%) reduces water demand`)
  }

  return {
    temperature,
    humidity,
    adjustment,
    reasons
  }
}

/**
 * Determine confidence level based on data availability
 */
function getConfidenceLevel(
  dataPoints: number,
  daysSinceLastAction: number | null,
  avgInterval: number | null
): ConfidenceLevel {
  // Not enough data
  if (dataPoints < CONFIDENCE_THRESHOLDS.medium.minDataPoints) {
    return 'low'
  }

  // High confidence: enough data points AND action is close to expected interval
  if (dataPoints >= CONFIDENCE_THRESHOLDS.high.minDataPoints) {
    if (daysSinceLastAction !== null && avgInterval !== null) {
      const variance = Math.abs(daysSinceLastAction - avgInterval) / avgInterval
      if (variance <= CONFIDENCE_THRESHOLDS.high.maxVariance) {
        return 'high'
      }
    }
    return 'medium'
  }

  // Medium confidence: some data but not enough for high confidence
  return 'medium'
}

/**
 * Calculate next action date
 */
function calculateNextActionDate(
  lastActionDate: Date | null,
  avgFrequency: number,
  environmentalAdjustment: number
): Date {
  const baseDate = lastActionDate || new Date()
  const adjustedInterval = Math.round(avgFrequency * environmentalAdjustment)
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + adjustedInterval)
  return nextDate
}

/**
 * Generate watering recommendation
 */
async function generateWateringRecommendation(
  plantId: string,
  careLogs: CareLogWithDetails[],
  location: any,
  ecPhContext: any
): Promise<CareRecommendation | null> {
  const wateringLogs = careLogs.filter(log => isWateringEvent(log.action))

  // Calculate frequency
  const avgFrequency = calculateWateringFrequency(careLogs) || DEFAULT_INTERVALS.water
  const lastWater = getLastWateringEvent(careLogs)
  const daysSince = getDaysSinceLastWatering(careLogs)

  // Environmental adjustment
  const envContext = getEnvironmentalAdjustment(
    location?.temperature,
    location?.humidity
  )

  // Calculate next watering date
  const lastWaterDate = lastWater ? new Date(lastWater.date) : null
  const nextDate = calculateNextActionDate(lastWaterDate, avgFrequency, envContext.adjustment)

  // Determine confidence
  const confidence = getConfidenceLevel(
    wateringLogs.length,
    daysSince,
    avgFrequency
  )

  // Build reasoning
  const reasoning: string[] = []

  // Note: Watering always includes baseline fertigation
  reasoning.push(`💧 Watering with baseline feed (CalMag + TPS One)`)

  if (wateringLogs.length >= 2) {
    reasoning.push(`Average watering interval: ${avgFrequency} days`)
  } else {
    reasoning.push(`Default watering interval: ${DEFAULT_INTERVALS.water} days (insufficient historical data)`)
  }

  if (daysSince !== null) {
    reasoning.push(`Last watered: ${daysSince} days ago`)
  } else {
    reasoning.push(`No previous watering recorded`)
  }

  if (envContext.reasons.length > 0) {
    reasoning.push(...envContext.reasons)
    reasoning.push(`Adjusted interval: ${Math.round(avgFrequency * envContext.adjustment)} days`)
  }

  // Add EC/pH context to reasoning
  if (ecPhContext) {
    if (ecPhContext.avgInputEC && ecPhContext.avgOutputEC) {
      const ecVariance = Math.abs(ecPhContext.avgOutputEC - ecPhContext.avgInputEC)
      reasoning.push(`EC Status: Input ${ecPhContext.avgInputEC.toFixed(2)} / Output ${ecPhContext.avgOutputEC.toFixed(2)} (Δ ${ecVariance.toFixed(2)})`)
    }
    if (ecPhContext.avgOutputPH) {
      reasoning.push(`Output pH: ${ecPhContext.avgOutputPH.toFixed(2)}`)
    }
  }

  const daysUntil = Math.round((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  reasoning.push(`Due in: ${daysUntil} days`)

  // Generate alerts
  const alerts = ecPhContext
    ? generateECPHAlerts(
        ecPhContext.avgInputEC,
        ecPhContext.avgOutputEC,
        ecPhContext.avgInputPH,
        ecPhContext.avgOutputPH,
        ecPhContext.variance?.ecVariance,
        ecPhContext.variance?.phDrift
      )
    : []

  return {
    action: 'water',
    scheduledDate: nextDate,
    confidence,
    reasoning,
    environmentalFactors: envContext,
    ecPhContext,
    alerts
  }
}

/**
 * Generate fertilizing recommendation
 */
async function generateFertilizingRecommendation(
  plantId: string,
  careLogs: CareLogWithDetails[],
  location: any,
  ecPhContext: any
): Promise<CareRecommendation | null> {
  const fertilizingLogs = careLogs.filter(log => isFertilizingEvent(log.action))

  // Calculate frequency
  const avgFrequency = calculateFertilizingFrequency(careLogs) || DEFAULT_INTERVALS.fertilize
  const lastFeed = getLastFertilizingEvent(careLogs)
  const daysSince = getDaysSinceLastFertilizing(careLogs)

  // Environmental adjustment (less impact on fertilizing than watering)
  const envContext = getEnvironmentalAdjustment(
    location?.temperature,
    location?.humidity
  )
  // Reduce environmental impact for fertilizing
  envContext.adjustment = 1.0 + (envContext.adjustment - 1.0) * 0.5

  // Calculate next fertilizing date
  const lastFeedDate = lastFeed ? new Date(lastFeed.date) : null
  const nextDate = calculateNextActionDate(lastFeedDate, avgFrequency, envContext.adjustment)

  // Determine confidence
  const confidence = getConfidenceLevel(
    fertilizingLogs.length,
    daysSince,
    avgFrequency
  )

  // Build reasoning
  const reasoning: string[] = []

  if (fertilizingLogs.length >= 2) {
    reasoning.push(`Average fertilizing interval: ${avgFrequency} days`)
  } else {
    reasoning.push(`Default fertilizing interval: ${DEFAULT_INTERVALS.fertilize} days (insufficient historical data)`)
  }

  if (daysSince !== null) {
    reasoning.push(`Last fertilized: ${daysSince} days ago`)
  } else {
    reasoning.push(`No previous fertilizing recorded`)
  }

  if (envContext.reasons.length > 0) {
    reasoning.push(`Environmental factors considered (reduced impact)`)
  }

  // EC/pH insights for fertilizing
  if (ecPhContext) {
    if (ecPhContext.avgInputEC) {
      const targetEC = 1.0
      if (ecPhContext.avgInputEC < 0.8) {
        reasoning.push(`⚠️ Input EC trending low (${ecPhContext.avgInputEC.toFixed(2)}), consider increasing fertilizer strength`)
      } else if (ecPhContext.avgInputEC > 1.2) {
        reasoning.push(`⚠️ Input EC trending high (${ecPhContext.avgInputEC.toFixed(2)}), consider reducing fertilizer strength`)
      } else {
        reasoning.push(`✓ Input EC within optimal range (${ecPhContext.avgInputEC.toFixed(2)})`)
      }
    }

    if (ecPhContext.substrateHealthScore !== null) {
      reasoning.push(`Substrate health: ${ecPhContext.substrateHealthScore}/100`)
    }
  }

  const daysUntil = Math.round((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  reasoning.push(`Due in: ${daysUntil} days`)

  const alerts = ecPhContext
    ? generateECPHAlerts(
        ecPhContext.avgInputEC,
        ecPhContext.avgOutputEC,
        ecPhContext.avgInputPH,
        ecPhContext.avgOutputPH,
        ecPhContext.variance?.ecVariance,
        ecPhContext.variance?.phDrift
      )
    : []

  return {
    action: 'fertilize',
    scheduledDate: nextDate,
    confidence,
    reasoning,
    environmentalFactors: envContext,
    ecPhContext,
    alerts
  }
}

/**
 * Generate repotting recommendation (based on substrate health only)
 */
async function generateRepottingRecommendation(
  plantId: string,
  careLogs: CareLogWithDetails[],
  ecPhContext: any,
  lastRepotDate: Date | null
): Promise<CareRecommendation | null> {
  // Only recommend repotting if substrate health is critical
  if (!ecPhContext || !ecPhContext.substrateHealthScore) {
    return null
  }

  // Don't recommend repotting if recently repotted (within last 14 days)
  // Substrate needs time to stabilize after repotting
  if (lastRepotDate) {
    const daysSinceRepot = Math.floor((Date.now() - lastRepotDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceRepot < 14) {
      return null // Too soon after repotting
    }
  }

  if (ecPhContext.substrateHealthScore < 40) {
    const reasoning: string[] = [
      `Substrate health critically low: ${ecPhContext.substrateHealthScore}/100`,
      'Repotting recommended to restore substrate function'
    ]

    if (ecPhContext.variance?.ecVariance && ecPhContext.variance.ecVariance > 0.5) {
      reasoning.push(`Severe EC imbalance detected (${ecPhContext.variance.ecVariance.toFixed(2)})`)
    }

    if (ecPhContext.avgOutputPH && ecPhContext.avgOutputPH < 5.0) {
      reasoning.push(`Critical substrate pH failure (${ecPhContext.avgOutputPH.toFixed(2)})`)
    }

    return {
      action: 'repot',
      scheduledDate: new Date(), // ASAP
      confidence: 'high',
      reasoning,
      ecPhContext,
      alerts: [{
        level: 'critical',
        type: 'needs_repot',
        message: 'Substrate failure detected',
        actionRequired: 'Repot with fresh substrate immediately'
      }]
    }
  }

  return null
}

/**
 * Main recommendation generator
 */
export async function generateRecommendations(plantId: string): Promise<CareRecommendation[]> {
  try {
    // Fetch plant with all relevant data
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        careLogs: {
          orderBy: { date: 'desc' },
          take: 50, // Last 50 care logs
          select: {
            id: true,
            date: true,
            action: true,
            // Structured EC/pH fields (new)
            inputEC: true,
            inputPH: true,
            outputEC: true,
            outputPH: true,
            isBaselineFeed: true,
            feedComponents: true,
            // Legacy details field
            details: true
          }
        },
        currentLocation: {
          select: {
            temperature: true,
            humidity: true,
            vpd: true
          }
        }
      }
    })

    if (!plant) {
      throw new Error('Plant not found')
    }

    // Find last repot date
    const lastRepot = plant.careLogs.find(log => log.action === 'repotting')
    const lastRepotDate = lastRepot ? new Date(lastRepot.date) : null

    // Analyze EC/pH context
    const ecPhContext = analyzeECPHContext(
      plant.careLogs as CareLogWithDetails[],
      lastRepotDate
    )

    // Generate recommendations
    const recommendations: CareRecommendation[] = []

    // Watering recommendation (includes baseline fertigation)
    const waterRec = await generateWateringRecommendation(
      plantId,
      plant.careLogs as CareLogWithDetails[],
      plant.currentLocation,
      ecPhContext
    )
    if (waterRec) recommendations.push(waterRec)

    // NOTE: Fertilizing recommendation removed
    // User's workflow: Baseline feed is included with EVERY watering
    // "Fertilizing" action is now for incremental/special feeds only (event-based, not scheduled)
    // Therefore, no separate fertilization schedule recommendation is needed

    // Repotting recommendation (only if critical and not recently repotted)
    const repotRec = await generateRepottingRecommendation(
      plantId,
      plant.careLogs as CareLogWithDetails[],
      ecPhContext,
      lastRepotDate
    )
    if (repotRec) recommendations.push(repotRec)

    // Sort by scheduled date
    recommendations.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())

    return recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error)
    throw error
  }
}

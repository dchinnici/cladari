/**
 * Watering Interval Predictor
 *
 * Uses EWMA and environmental factors to predict optimal watering intervals
 * per-plant, not global averages.
 *
 * Factors considered:
 * - Historical watering intervals (EWMA weighted)
 * - Environmental conditions (temp, humidity, VPD, DLI)
 * - Substrate age (time since last repot)
 * - Plant health status
 * - Seasonal patterns
 */

import {
  calculateEWMA,
  calculateTimeWeightedEWMA,
  detectTrend,
  detectAnomaly,
  calculateSeasonality,
  percentile,
  standardDeviation,
  calculateModelConfidence,
  DataPoint,
  TrendResult
} from './statisticalAnalyzer'

export interface CareEvent {
  date: Date | string
  action: string
  ecIn?: number | null
  ecOut?: number | null
  phIn?: number | null
  phOut?: number | null
}

export interface EnvironmentalData {
  temperature?: number | null
  humidity?: number | null
  vpd?: number | null
  dli?: number | null
  co2?: number | null
}

export interface WateringPrediction {
  nextWaterDate: Date
  daysUntilWater: number
  confidence: 'high' | 'medium' | 'low'
  interval: {
    optimal: number      // Most likely interval
    min: number          // Lower bound (dry conditions)
    max: number          // Upper bound (humid conditions)
  }
  factors: WateringFactor[]
  trend: TrendResult | null
  dataPoints: number
}

export interface WateringFactor {
  name: string
  impact: 'increase' | 'decrease' | 'neutral'
  adjustment: number    // Days adjustment
  description: string
}

const DEFAULT_INTERVAL = 7 // Default if no data
const MIN_INTERVAL = 2     // Absolute minimum
const MAX_INTERVAL = 21    // Absolute maximum

/**
 * Main prediction function
 */
export function predictWateringInterval(
  careLogs: CareEvent[],
  environment?: EnvironmentalData,
  lastRepotDate?: Date | string | null,
  healthStatus?: string
): WateringPrediction {
  const factors: WateringFactor[] = []

  // Extract watering events
  const wateringEvents = extractWateringEvents(careLogs)

  // Calculate base interval from history
  const { baseInterval, intervals, trend } = calculateBaseInterval(wateringEvents)

  // Start with base interval
  let optimal = baseInterval

  // Environmental adjustments
  if (environment) {
    const envAdj = calculateEnvironmentalAdjustment(environment)
    if (envAdj.totalAdjustment !== 0) {
      optimal += envAdj.totalAdjustment
      factors.push(...envAdj.factors)
    }
  }

  // Substrate age adjustment
  if (lastRepotDate) {
    const substrateAdj = calculateSubstrateAgeAdjustment(lastRepotDate)
    if (substrateAdj.adjustment !== 0) {
      optimal += substrateAdj.adjustment
      factors.push(substrateAdj.factor)
    }
  }

  // Health status adjustment
  if (healthStatus) {
    const healthAdj = calculateHealthAdjustment(healthStatus)
    if (healthAdj.adjustment !== 0) {
      optimal += healthAdj.adjustment
      factors.push(healthAdj.factor)
    }
  }

  // Seasonal adjustment
  if (wateringEvents.length >= 12) {
    const seasonalAdj = calculateSeasonalAdjustment(wateringEvents)
    if (seasonalAdj.adjustment !== 0) {
      optimal += seasonalAdj.adjustment
      factors.push(seasonalAdj.factor)
    }
  }

  // Bound the interval
  optimal = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, Math.round(optimal)))

  // Calculate min/max intervals
  const stdDev = intervals.length >= 3 ? standardDeviation(intervals) : 1.5
  const min = Math.max(MIN_INTERVAL, Math.round(optimal - stdDev))
  const max = Math.min(MAX_INTERVAL, Math.round(optimal + stdDev))

  // Calculate next water date
  const lastWater = wateringEvents.length > 0
    ? new Date(wateringEvents[0].date)
    : new Date()
  const nextWaterDate = new Date(lastWater)
  nextWaterDate.setDate(nextWaterDate.getDate() + optimal)

  // Calculate days until water
  const daysUntilWater = Math.round(
    (nextWaterDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  // Calculate confidence
  const confidence = calculateModelConfidence(
    wateringEvents.length,
    trend?.rSquared || 0,
    0 // Will add anomaly detection
  )

  return {
    nextWaterDate,
    daysUntilWater,
    confidence,
    interval: { optimal, min, max },
    factors,
    trend,
    dataPoints: wateringEvents.length
  }
}

/**
 * Extract watering events from care logs
 */
function extractWateringEvents(careLogs: CareEvent[]): CareEvent[] {
  return careLogs
    .filter(log => {
      const action = (log.action || '').toLowerCase()
      return action.includes('water') || action.includes('fertil')
    })
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
}

/**
 * Calculate base interval from historical data using EWMA
 */
function calculateBaseInterval(wateringEvents: CareEvent[]): {
  baseInterval: number
  intervals: number[]
  trend: TrendResult | null
} {
  if (wateringEvents.length < 2) {
    return { baseInterval: DEFAULT_INTERVAL, intervals: [], trend: null }
  }

  // Calculate intervals between events
  const intervals: number[] = []
  for (let i = 0; i < wateringEvents.length - 1; i++) {
    const days = daysBetween(wateringEvents[i + 1].date, wateringEvents[i].date)
    // Sanity check - ignore very short or very long intervals
    if (days >= MIN_INTERVAL && days <= MAX_INTERVAL + 7) {
      intervals.push(days)
    }
  }

  if (intervals.length === 0) {
    return { baseInterval: DEFAULT_INTERVAL, intervals: [], trend: null }
  }

  // Use EWMA for base interval (more weight to recent)
  const ewmaInterval = calculateEWMA(intervals.reverse(), 0.35)

  // Detect trend in intervals
  const intervalPoints: DataPoint[] = intervals.map((v, i) => ({
    date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000), // Approximate dates
    value: v
  }))
  const trend = intervalPoints.length >= 5 ? detectTrend(intervalPoints) : null

  return {
    baseInterval: ewmaInterval,
    intervals,
    trend
  }
}

/**
 * Calculate environmental adjustments
 */
function calculateEnvironmentalAdjustment(env: EnvironmentalData): {
  totalAdjustment: number
  factors: WateringFactor[]
} {
  const factors: WateringFactor[] = []
  let totalAdjustment = 0

  // Temperature adjustment
  // Higher temp = more transpiration = water sooner
  if (env.temperature !== undefined && env.temperature !== null) {
    if (env.temperature > 27) {
      const adj = -1.0 * ((env.temperature - 27) / 5) // -1 day per 5°C above 27
      totalAdjustment += adj
      factors.push({
        name: 'High Temperature',
        impact: 'decrease',
        adjustment: adj,
        description: `${env.temperature.toFixed(1)}°C increases water demand`
      })
    } else if (env.temperature < 20) {
      const adj = 0.5 * ((20 - env.temperature) / 5) // +0.5 day per 5°C below 20
      totalAdjustment += adj
      factors.push({
        name: 'Low Temperature',
        impact: 'increase',
        adjustment: adj,
        description: `${env.temperature.toFixed(1)}°C reduces water demand`
      })
    }
  }

  // Humidity adjustment
  if (env.humidity !== undefined && env.humidity !== null) {
    if (env.humidity < 40) {
      const adj = -0.5 * ((40 - env.humidity) / 20) // -0.5 day per 20% below 40
      totalAdjustment += adj
      factors.push({
        name: 'Low Humidity',
        impact: 'decrease',
        adjustment: adj,
        description: `${env.humidity.toFixed(0)}% humidity increases evaporation`
      })
    } else if (env.humidity > 70) {
      const adj = 0.5 * ((env.humidity - 70) / 20) // +0.5 day per 20% above 70
      totalAdjustment += adj
      factors.push({
        name: 'High Humidity',
        impact: 'increase',
        adjustment: adj,
        description: `${env.humidity.toFixed(0)}% humidity reduces evaporation`
      })
    }
  }

  // VPD adjustment (most accurate for transpiration)
  if (env.vpd !== undefined && env.vpd !== null) {
    // Optimal VPD for anthuriums: 0.8-1.2 kPa
    if (env.vpd > 1.4) {
      const adj = -0.7 * ((env.vpd - 1.4) / 0.5)
      totalAdjustment += adj
      factors.push({
        name: 'High VPD',
        impact: 'decrease',
        adjustment: adj,
        description: `VPD ${env.vpd.toFixed(2)} kPa drives high transpiration`
      })
    } else if (env.vpd < 0.6) {
      const adj = 0.5 * ((0.6 - env.vpd) / 0.3)
      totalAdjustment += adj
      factors.push({
        name: 'Low VPD',
        impact: 'increase',
        adjustment: adj,
        description: `VPD ${env.vpd.toFixed(2)} kPa limits transpiration`
      })
    }
  }

  // DLI adjustment (light intensity)
  if (env.dli !== undefined && env.dli !== null) {
    if (env.dli > 16) {
      const adj = -0.3 * ((env.dli - 16) / 4)
      totalAdjustment += adj
      factors.push({
        name: 'High Light',
        impact: 'decrease',
        adjustment: adj,
        description: `DLI ${env.dli.toFixed(1)} increases photosynthesis`
      })
    } else if (env.dli < 8) {
      const adj = 0.3 * ((8 - env.dli) / 4)
      totalAdjustment += adj
      factors.push({
        name: 'Low Light',
        impact: 'increase',
        adjustment: adj,
        description: `DLI ${env.dli.toFixed(1)} reduces water uptake`
      })
    }
  }

  return { totalAdjustment, factors }
}

/**
 * Calculate substrate age adjustment
 * Older substrate = degraded drainage = water less frequently
 */
function calculateSubstrateAgeAdjustment(lastRepotDate: Date | string): {
  adjustment: number
  factor: WateringFactor
} {
  const monthsSinceRepot = daysBetween(new Date(lastRepotDate), new Date()) / 30

  let adjustment = 0
  let description = ''

  if (monthsSinceRepot > 18) {
    adjustment = 1.0
    description = `${Math.round(monthsSinceRepot)} months since repot - substrate may be compacted`
  } else if (monthsSinceRepot > 12) {
    adjustment = 0.5
    description = `${Math.round(monthsSinceRepot)} months since repot - monitor drainage`
  } else if (monthsSinceRepot < 1) {
    adjustment = 0.5
    description = 'Recently repotted - fresh substrate dries faster'
  }

  return {
    adjustment,
    factor: {
      name: 'Substrate Age',
      impact: adjustment > 0 ? 'increase' : adjustment < 0 ? 'decrease' : 'neutral',
      adjustment,
      description
    }
  }
}

/**
 * Calculate health status adjustment
 */
function calculateHealthAdjustment(healthStatus: string): {
  adjustment: number
  factor: WateringFactor
} {
  let adjustment = 0
  let description = ''

  switch (healthStatus.toLowerCase()) {
    case 'excellent':
      adjustment = 0.5
      description = 'Excellent health - can tolerate longer intervals'
      break
    case 'good':
      adjustment = 0
      description = 'Good health - standard interval'
      break
    case 'fair':
      adjustment = -0.5
      description = 'Fair health - more frequent watering may help'
      break
    case 'poor':
      adjustment = -1.0
      description = 'Poor health - requires careful attention'
      break
    case 'critical':
      adjustment = -1.5
      description = 'Critical health - monitor closely'
      break
  }

  return {
    adjustment,
    factor: {
      name: 'Plant Health',
      impact: adjustment > 0 ? 'increase' : adjustment < 0 ? 'decrease' : 'neutral',
      adjustment,
      description
    }
  }
}

/**
 * Calculate seasonal adjustment based on month
 */
function calculateSeasonalAdjustment(wateringEvents: CareEvent[]): {
  adjustment: number
  factor: WateringFactor
} {
  // Convert events to data points for seasonality analysis
  const dataPoints: DataPoint[] = wateringEvents.slice(0, -1).map((event, i) => {
    const nextEvent = wateringEvents[i + 1]
    const interval = daysBetween(nextEvent.date, event.date)
    return { date: new Date(event.date), value: interval }
  })

  const seasonality = calculateSeasonality(dataPoints)

  if (!seasonality.hasSeason) {
    return {
      adjustment: 0,
      factor: {
        name: 'Seasonality',
        impact: 'neutral',
        adjustment: 0,
        description: 'No significant seasonal pattern detected'
      }
    }
  }

  // Adjust based on current month relative to peak/trough
  const currentMonth = new Date().getMonth() + 1

  let adjustment = 0
  let description = ''

  if (seasonality.peakMonth && Math.abs(currentMonth - seasonality.peakMonth) <= 1) {
    adjustment = seasonality.amplitude * 2 // Longer intervals in peak months
    description = `Seasonal peak (month ${seasonality.peakMonth}) - reduced water demand`
  } else if (seasonality.troughMonth && Math.abs(currentMonth - seasonality.troughMonth) <= 1) {
    adjustment = -seasonality.amplitude * 2 // Shorter intervals in trough months
    description = `Seasonal trough (month ${seasonality.troughMonth}) - increased water demand`
  }

  return {
    adjustment,
    factor: {
      name: 'Seasonal Pattern',
      impact: adjustment > 0 ? 'increase' : adjustment < 0 ? 'decrease' : 'neutral',
      adjustment,
      description: description || `Seasonal amplitude: ${(seasonality.amplitude * 100).toFixed(0)}%`
    }
  }
}

/**
 * Helper: Calculate days between dates
 */
function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
}

/**
 * Analyze watering history for a plant
 * Returns detailed statistics
 */
export function analyzeWateringHistory(careLogs: CareEvent[]): {
  totalEvents: number
  avgInterval: number
  minInterval: number
  maxInterval: number
  recentInterval: number  // Last 5 events
  trend: 'shortening' | 'lengthening' | 'stable'
  consistency: 'high' | 'medium' | 'low'
} {
  const wateringEvents = extractWateringEvents(careLogs)

  if (wateringEvents.length < 2) {
    return {
      totalEvents: wateringEvents.length,
      avgInterval: DEFAULT_INTERVAL,
      minInterval: DEFAULT_INTERVAL,
      maxInterval: DEFAULT_INTERVAL,
      recentInterval: DEFAULT_INTERVAL,
      trend: 'stable',
      consistency: 'low'
    }
  }

  // Calculate intervals
  const intervals: number[] = []
  for (let i = 0; i < wateringEvents.length - 1; i++) {
    const days = daysBetween(wateringEvents[i + 1].date, wateringEvents[i].date)
    if (days >= 1 && days <= 30) {
      intervals.push(days)
    }
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const minInterval = Math.min(...intervals)
  const maxInterval = Math.max(...intervals)
  const recentInterval = intervals.length >= 5
    ? calculateEWMA(intervals.slice(0, 5), 0.4)
    : avgInterval

  // Determine trend
  let trend: 'shortening' | 'lengthening' | 'stable' = 'stable'
  if (intervals.length >= 5) {
    const oldAvg = intervals.slice(-5).reduce((a, b) => a + b, 0) / 5
    const newAvg = intervals.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, intervals.length)
    const diff = newAvg - oldAvg

    if (diff < -1) trend = 'shortening'
    else if (diff > 1) trend = 'lengthening'
  }

  // Determine consistency
  const stdDev = standardDeviation(intervals)
  const cv = stdDev / avgInterval // Coefficient of variation
  const consistency: 'high' | 'medium' | 'low' =
    cv < 0.15 ? 'high' :
    cv < 0.3 ? 'medium' : 'low'

  return {
    totalEvents: wateringEvents.length,
    avgInterval: Math.round(avgInterval * 10) / 10,
    minInterval,
    maxInterval,
    recentInterval: Math.round(recentInterval * 10) / 10,
    trend,
    consistency
  }
}

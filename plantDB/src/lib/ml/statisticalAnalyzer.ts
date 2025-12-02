/**
 * Statistical Analysis Engine for Plant Care ML
 *
 * Core algorithms:
 * - Exponential Weighted Moving Average (EWMA)
 * - Linear Regression for trend detection
 * - Z-Score anomaly detection
 * - Seasonality analysis
 */

export interface DataPoint {
  date: Date
  value: number
}

export interface TrendResult {
  slope: number           // Positive = increasing, Negative = decreasing
  intercept: number
  rSquared: number        // 0-1, higher = better fit
  direction: 'increasing' | 'decreasing' | 'stable'
  significance: 'high' | 'medium' | 'low'
}

export interface AnomalyResult {
  isAnomaly: boolean
  zScore: number
  deviation: number
  direction: 'above' | 'below' | 'normal'
}

export interface SeasonalityResult {
  hasSeason: boolean
  peakMonth: number | null      // 1-12
  troughMonth: number | null    // 1-12
  amplitude: number             // Strength of seasonal pattern
}

export interface RegressionStats {
  slope: number
  intercept: number
  rSquared: number
  standardError: number
}

/**
 * Calculate Exponential Weighted Moving Average
 * More recent values are weighted more heavily
 *
 * @param values Array of values (oldest first)
 * @param alpha Smoothing factor (0.1-0.5, higher = more weight to recent)
 */
export function calculateEWMA(values: number[], alpha: number = 0.3): number {
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]

  let ewma = values[0]
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma
  }
  return ewma
}

/**
 * Calculate EWMA for time-series data points
 * Automatically adjusts alpha based on time gaps
 */
export function calculateTimeWeightedEWMA(dataPoints: DataPoint[], baseAlpha: number = 0.3): number {
  if (dataPoints.length === 0) return 0
  if (dataPoints.length === 1) return dataPoints[0].value

  // Sort by date (oldest first)
  const sorted = [...dataPoints].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let ewma = sorted[0].value

  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = daysBetween(sorted[i-1].date, sorted[i].date)
    // Adjust alpha based on time gap - larger gaps reduce influence
    const adjustedAlpha = Math.min(baseAlpha * Math.exp(-daysDiff / 14), 0.9)
    ewma = adjustedAlpha * sorted[i].value + (1 - adjustedAlpha) * ewma
  }

  return ewma
}

/**
 * Linear regression to detect trends
 * Returns slope, intercept, and R-squared
 */
export function linearRegression(dataPoints: DataPoint[]): RegressionStats {
  if (dataPoints.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, standardError: 0 }
  }

  // Sort by date
  const sorted = [...dataPoints].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Convert dates to numeric x values (days from first point)
  const firstDate = new Date(sorted[0].date).getTime()
  const points = sorted.map(p => ({
    x: (new Date(p.date).getTime() - firstDate) / (1000 * 60 * 60 * 24),
    y: p.value
  }))

  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0)

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) {
    return { slope: 0, intercept: sorted[0].value, rSquared: 0, standardError: 0 }
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared
  const yMean = sumY / n
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
  const ssResidual = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)

  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal

  // Standard error of estimate
  const standardError = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0

  return { slope, intercept, rSquared, standardError }
}

/**
 * Detect trend direction and significance
 */
export function detectTrend(dataPoints: DataPoint[]): TrendResult {
  const stats = linearRegression(dataPoints)

  // Determine direction based on slope
  let direction: 'increasing' | 'decreasing' | 'stable'
  if (Math.abs(stats.slope) < 0.01) {
    direction = 'stable'
  } else if (stats.slope > 0) {
    direction = 'increasing'
  } else {
    direction = 'decreasing'
  }

  // Determine significance based on R-squared and data points
  let significance: 'high' | 'medium' | 'low'
  if (stats.rSquared >= 0.7 && dataPoints.length >= 10) {
    significance = 'high'
  } else if (stats.rSquared >= 0.4 && dataPoints.length >= 5) {
    significance = 'medium'
  } else {
    significance = 'low'
  }

  return {
    slope: stats.slope,
    intercept: stats.intercept,
    rSquared: stats.rSquared,
    direction,
    significance
  }
}

/**
 * Detect anomalies using Z-score
 *
 * @param values Historical values
 * @param currentValue Value to check
 * @param threshold Z-score threshold (default 2.0 = ~95% confidence)
 */
export function detectAnomaly(
  values: number[],
  currentValue: number,
  threshold: number = 2.0
): AnomalyResult {
  if (values.length < 3) {
    return { isAnomaly: false, zScore: 0, deviation: 0, direction: 'normal' }
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) {
    return {
      isAnomaly: currentValue !== mean,
      zScore: currentValue === mean ? 0 : Infinity,
      deviation: currentValue - mean,
      direction: currentValue > mean ? 'above' : currentValue < mean ? 'below' : 'normal'
    }
  }

  const zScore = (currentValue - mean) / stdDev

  return {
    isAnomaly: Math.abs(zScore) > threshold,
    zScore,
    deviation: currentValue - mean,
    direction: zScore > threshold ? 'above' : zScore < -threshold ? 'below' : 'normal'
  }
}

/**
 * Detect anomalies in a time series
 * Returns array of anomalous data points
 */
export function detectAnomalies(
  dataPoints: DataPoint[],
  threshold: number = 2.0
): (DataPoint & AnomalyResult)[] {
  if (dataPoints.length < 5) return []

  const values = dataPoints.map(p => p.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return []

  return dataPoints
    .map(p => {
      const zScore = (p.value - mean) / stdDev
      return {
        ...p,
        isAnomaly: Math.abs(zScore) > threshold,
        zScore,
        deviation: p.value - mean,
        direction: zScore > threshold ? 'above' as const :
                   zScore < -threshold ? 'below' as const : 'normal' as const
      }
    })
    .filter(p => p.isAnomaly)
}

/**
 * Calculate seasonality pattern
 * Detects monthly patterns in data
 */
export function calculateSeasonality(dataPoints: DataPoint[]): SeasonalityResult {
  if (dataPoints.length < 12) {
    return { hasSeason: false, peakMonth: null, troughMonth: null, amplitude: 0 }
  }

  // Group values by month
  const monthlyValues: number[][] = Array(12).fill(null).map(() => [])

  dataPoints.forEach(p => {
    const month = new Date(p.date).getMonth()
    monthlyValues[month].push(p.value)
  })

  // Calculate monthly averages
  const monthlyAverages = monthlyValues.map(values =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
  )

  // Find months with data
  const validMonths = monthlyAverages
    .map((avg, i) => avg !== null ? { month: i + 1, avg } : null)
    .filter(m => m !== null) as { month: number; avg: number }[]

  if (validMonths.length < 6) {
    return { hasSeason: false, peakMonth: null, troughMonth: null, amplitude: 0 }
  }

  // Find peak and trough
  const peak = validMonths.reduce((max, m) => m.avg > max.avg ? m : max)
  const trough = validMonths.reduce((min, m) => m.avg < min.avg ? m : min)

  // Calculate amplitude (normalized)
  const overallMean = validMonths.reduce((sum, m) => sum + m.avg, 0) / validMonths.length
  const amplitude = overallMean !== 0 ? (peak.avg - trough.avg) / overallMean : 0

  // Seasonal pattern is significant if amplitude > 20%
  const hasSeason = amplitude > 0.2

  return {
    hasSeason,
    peakMonth: hasSeason ? peak.month : null,
    troughMonth: hasSeason ? trough.month : null,
    amplitude
  }
}

/**
 * Predict future value using linear regression
 */
export function predictValue(dataPoints: DataPoint[], daysAhead: number): number {
  if (dataPoints.length < 2) {
    return dataPoints.length === 1 ? dataPoints[0].value : 0
  }

  const stats = linearRegression(dataPoints)
  const sorted = [...dataPoints].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstDate = new Date(sorted[0].date).getTime()
  const lastDate = new Date(sorted[sorted.length - 1].date).getTime()
  const daysSinceFirst = (lastDate - firstDate) / (1000 * 60 * 60 * 24) + daysAhead

  return stats.slope * daysSinceFirst + stats.intercept
}

/**
 * Calculate prediction confidence interval
 */
export function calculateConfidenceInterval(
  dataPoints: DataPoint[],
  daysAhead: number,
  confidence: number = 0.95
): { lower: number; upper: number; predicted: number } {
  const predicted = predictValue(dataPoints, daysAhead)
  const stats = linearRegression(dataPoints)

  if (dataPoints.length < 3 || stats.standardError === 0) {
    return { lower: predicted, upper: predicted, predicted }
  }

  // t-value for 95% confidence (approximation for n > 30)
  const tValue = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645

  // Prediction interval (wider than confidence interval)
  const margin = tValue * stats.standardError * Math.sqrt(1 + 1/dataPoints.length)

  return {
    lower: predicted - margin,
    upper: predicted + margin,
    predicted
  }
}

/**
 * Calculate moving average
 */
export function movingAverage(values: number[], window: number = 3): number[] {
  if (values.length < window) return values

  const result: number[] = []
  for (let i = 0; i <= values.length - window; i++) {
    const windowSlice = values.slice(i, i + window)
    result.push(windowSlice.reduce((a, b) => a + b, 0) / window)
  }
  return result
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const fraction = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction
}

/**
 * Helper: Calculate days between two dates
 */
function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
}

/**
 * Calculate model confidence based on data quality
 */
export function calculateModelConfidence(
  dataPoints: number,
  rSquared: number,
  anomalyCount: number
): 'high' | 'medium' | 'low' {
  // More data = higher confidence
  let score = 0

  if (dataPoints >= 20) score += 3
  else if (dataPoints >= 10) score += 2
  else if (dataPoints >= 5) score += 1

  // Better fit = higher confidence
  if (rSquared >= 0.7) score += 3
  else if (rSquared >= 0.4) score += 2
  else if (rSquared >= 0.2) score += 1

  // Fewer anomalies = higher confidence
  const anomalyRate = anomalyCount / Math.max(dataPoints, 1)
  if (anomalyRate < 0.05) score += 2
  else if (anomalyRate < 0.15) score += 1

  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

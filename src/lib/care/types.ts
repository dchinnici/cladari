/**
 * Care Recommendation System - Type Definitions
 */

export type CareAction = "water" | "fertilize" | "repot" | "prune"
export type ConfidenceLevel = "low" | "medium" | "high"
export type AlertLevel = "healthy" | "warning" | "critical"

export interface CareRecommendation {
  action: CareAction
  scheduledDate: Date
  confidence: ConfidenceLevel
  reasoning: string[]
  environmentalFactors?: EnvironmentalContext
  ecPhContext?: ECPHContext
  alerts?: Alert[]
}

export interface EnvironmentalContext {
  temperature?: number
  humidity?: number
  vpd?: number
  adjustment: number // Multiplier for interval (e.g., 0.85 = reduce by 15%)
  reasons: string[]
}

export interface ECPHContext {
  avgInputEC: number | null
  avgInputPH: number | null
  avgOutputEC: number | null
  avgOutputPH: number | null
  trend: ECPHTrend
  variance: {
    ecVariance: number | null
    phDrift: number | null
  }
  substrateHealthScore: number | null
}

export type ECPHTrend =
  | "healthy"
  | "ec_buildup"
  | "ec_depleted"
  | "ph_drift_high"
  | "ph_drift_low"
  | "substrate_degrading"

export interface Alert {
  level: AlertLevel
  type: AlertType
  message: string
  actionRequired?: string
}

export type AlertType =
  | "ec_critical"
  | "ph_critical"
  | "substrate_failure"
  | "ec_variance_high"
  | "ph_drift"
  | "needs_flush"
  | "needs_repot"
  | "needs_ph_buffer"

export interface ECPHData {
  inputEC?: number
  inputPH?: number
  outputEC?: number
  outputPH?: number
  notes?: string
}

export interface CareLogWithDetails {
  id: string
  date: Date
  action: string
  // Structured EC/pH fields (new)
  inputEC?: number | null
  inputPH?: number | null
  outputEC?: number | null
  outputPH?: number | null
  isBaselineFeed?: boolean
  feedComponents?: string | null // JSON array
  // Legacy details field (for backwards compatibility)
  details?: string | null
}

export interface SubstrateHealth {
  score: number // 0-100
  issues: string[]
  recommendations: string[]
  monthsSinceRepot: number | null
}

// Target ranges
export const EC_PH_TARGETS = {
  inputEC: { min: 0.8, max: 1.2, optimal: 1.0 },
  inputPH: { min: 5.5, max: 6.5, optimal: 6.0 },
  outputEC: { variance: 0.3 }, // ± from input
  outputPH: { min: 5.0, max: 6.5 },
  ecVarianceCritical: 0.5,
  ecVarianceWarning: 0.3,
  phDriftWarning: 0.2, // per week
  phCriticalLow: 5.0,
  phCriticalHigh: 7.0
} as const

// Default intervals for new plants
export const DEFAULT_INTERVALS = {
  water: 7, // days
  fertilize: 14, // days
  repot: 365, // days (tracked but not predicted)
} as const

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  high: {
    minDataPoints: 5,
    maxVariance: 0.2 // 20% variance from average
  },
  medium: {
    minDataPoints: 2,
    maxVariance: 0.4 // 40% variance
  }
} as const

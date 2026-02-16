/**
 * Application-wide constants for care thresholds and configurations
 *
 * These values are used across multiple components for consistent behavior.
 * Adjusting these values allows tuning the entire application's sensitivity
 * without hunting through individual components.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Care Queue Thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Days since last watering before showing in care queue */
export const WATERING_THRESHOLD_DAYS = 5

/** Days since last fertilizing before showing in care queue */
export const FERTILIZING_THRESHOLD_DAYS = 14

/** Days since any activity before plant is considered "stale" */
export const STALE_ACTIVITY_THRESHOLD_DAYS = 10

// ─────────────────────────────────────────────────────────────────────────────
// Substrate Health Thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum acceptable EC output before triggering critical alert */
export const EC_CRITICAL_THRESHOLD = 2.0

/** Minimum acceptable pH before triggering critical alert */
export const PH_MIN_THRESHOLD = 5.5

/** Maximum acceptable pH before triggering critical alert */
export const PH_MAX_THRESHOLD = 7.0

/** Default EC input value for quick care (Anthurium standard) */
export const DEFAULT_EC_INPUT = 1.25

/** Default pH input value for quick care (Anthurium standard) */
export const DEFAULT_PH_INPUT = 5.85

/** Default baseline feed note */
export const DEFAULT_BASELINE_NOTES = 'CalMag + TPS One'

// ─────────────────────────────────────────────────────────────────────────────
// Health Score Thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Score above this is considered "healthy" (green) */
export const HEALTH_SCORE_GOOD_THRESHOLD = 80

/** Score above this is considered "warning" (yellow), below is "critical" (red) */
export const HEALTH_SCORE_WARNING_THRESHOLD = 60

// ─────────────────────────────────────────────────────────────────────────────
// Service Worker & PWA
// ─────────────────────────────────────────────────────────────────────────────

/** How often to check for service worker updates (ms) */
export const SERVICE_WORKER_UPDATE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/** Delay before showing iOS PWA install prompt (ms) */
export const IOS_INSTALL_PROMPT_DELAY_MS = 30 * 1000 // 30 seconds

// ─────────────────────────────────────────────────────────────────────────────
// API Timeouts
// ─────────────────────────────────────────────────────────────────────────────

/** Default timeout for external API calls (ms) */
export const EXTERNAL_API_TIMEOUT_MS = 10 * 1000 // 10 seconds

// ─────────────────────────────────────────────────────────────────────────────
// ML/Watering Predictor (HYPOTHETICAL VALUES - NOT EMPIRICALLY VALIDATED)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rain adjustment thresholds for outdoor watering predictions
 * These are educated guesses and should be tuned based on observed results
 */
export const RAIN_THRESHOLDS = {
  /** Precipitation below this (mm) has no effect on watering schedule */
  MINIMUM_EFFECTIVE: 5,
  /** Precipitation above this (mm) adds MODERATE_ADJUSTMENT days */
  MODERATE_THRESHOLD: 10,
  /** Precipitation above this (mm) adds HEAVY_ADJUSTMENT days */
  HEAVY_THRESHOLD: 20,
  /** Days to add for moderate rain */
  MODERATE_ADJUSTMENT: 1.0,
  /** Days to add for heavy rain */
  HEAVY_ADJUSTMENT: 1.5,
  /** 48h precipitation threshold for sustained bonus */
  SUSTAINED_THRESHOLD: 25,
  /** Additional days to add for sustained rain */
  SUSTAINED_BONUS: 0.5,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Demo/Sandbox Account
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo account user ID - data from this user should be excluded from:
 * - ML training data exports
 * - Vector embeddings / semantic search corpus
 * - HITL quality scoring aggregations
 * - Any analytics that inform production decisions
 */
export const DEMO_USER_ID = '8073760b-13dd-4019-b4a2-3506cd222e7e'

/** Check if a userId belongs to the demo account */
export const isDemoUser = (userId: string | null | undefined): boolean =>
  userId === DEMO_USER_ID

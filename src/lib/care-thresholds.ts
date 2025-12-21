/**
 * Dynamic Care Thresholds
 *
 * Calculates personalized watering/feeding thresholds based on each plant's
 * actual care history, rather than using fixed intervals for all plants.
 *
 * A plant that's typically watered every 4 days should show as "overdue"
 * sooner than one that's typically watered every 7 days.
 */

import {
  WATERING_THRESHOLD_DAYS,
  FERTILIZING_THRESHOLD_DAYS,
  STALE_ACTIVITY_THRESHOLD_DAYS,
} from './constants'

// Minimum number of care events needed to calculate dynamic thresholds
const MIN_EVENTS_FOR_DYNAMIC = 3

// Threshold multipliers (relative to average interval)
const YELLOW_MULTIPLIER = 1.3  // 30% past average = yellow/warning
const RED_MULTIPLIER = 1.7     // 70% past average = red/overdue

export interface CareThresholds {
  /** Days after which plant enters "warning" (yellow) state */
  warningDays: number
  /** Days after which plant enters "overdue" (red) state */
  overdueDays: number
  /** Whether these are dynamic (from history) or static (fallback) */
  isDynamic: boolean
  /** Average interval in days (null if using static) */
  averageInterval: number | null
  /** Number of events used to calculate (0 if using static) */
  eventCount: number
}

export interface CareStatus {
  status: 'ok' | 'warning' | 'overdue'
  daysSinceLastCare: number | null
  thresholds: CareThresholds
}

interface CareLog {
  id: string
  date: string
  action?: string
  activityType?: string
  [key: string]: any
}

/**
 * Extracts watering-related events from care logs
 * Includes: water, watering, rain, fertilizing (since it includes water)
 */
function extractWateringEvents(careLogs: CareLog[]): Date[] {
  const wateringActions = ['water', 'watering', 'rain', 'fertilizing', 'fertilize', 'incremental_feed']

  return careLogs
    .filter(log => {
      const action = (log.action || log.activityType || '').toLowerCase()
      return wateringActions.some(a => action.includes(a))
    })
    .map(log => new Date(log.date))
    .sort((a, b) => b.getTime() - a.getTime()) // Most recent first
}

/**
 * Extracts fertilizing-specific events from care logs
 */
function extractFertilizingEvents(careLogs: CareLog[]): Date[] {
  const fertilizingActions = ['fertiliz', 'feed', 'incremental_feed']

  return careLogs
    .filter(log => {
      const action = (log.action || log.activityType || '').toLowerCase()
      return fertilizingActions.some(a => action.includes(a))
    })
    .map(log => new Date(log.date))
    .sort((a, b) => b.getTime() - a.getTime())
}

/**
 * Calculates intervals between consecutive events
 */
function calculateIntervals(dates: Date[]): number[] {
  if (dates.length < 2) return []

  const intervals: number[] = []
  for (let i = 0; i < dates.length - 1; i++) {
    const days = Math.floor(
      (dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
    )
    // Only include reasonable intervals (1-30 days) to filter out outliers
    if (days >= 1 && days <= 30) {
      intervals.push(days)
    }
  }
  return intervals
}

/**
 * Calculates dynamic thresholds for watering based on care history
 */
export function getWateringThresholds(careLogs: CareLog[]): CareThresholds {
  const events = extractWateringEvents(careLogs)
  const intervals = calculateIntervals(events)

  // Not enough data - use static thresholds
  if (intervals.length < MIN_EVENTS_FOR_DYNAMIC) {
    return {
      warningDays: WATERING_THRESHOLD_DAYS,
      overdueDays: WATERING_THRESHOLD_DAYS + 2, // 5 + 2 = 7 days
      isDynamic: false,
      averageInterval: null,
      eventCount: intervals.length,
    }
  }

  // Calculate average interval
  const sum = intervals.reduce((a, b) => a + b, 0)
  const average = sum / intervals.length

  return {
    warningDays: Math.round(average * YELLOW_MULTIPLIER),
    overdueDays: Math.round(average * RED_MULTIPLIER),
    isDynamic: true,
    averageInterval: Math.round(average * 10) / 10, // Round to 1 decimal
    eventCount: intervals.length,
  }
}

/**
 * Calculates dynamic thresholds for fertilizing based on care history
 */
export function getFertilizingThresholds(careLogs: CareLog[]): CareThresholds {
  const events = extractFertilizingEvents(careLogs)
  const intervals = calculateIntervals(events)

  // Not enough data - use static thresholds
  if (intervals.length < MIN_EVENTS_FOR_DYNAMIC) {
    return {
      warningDays: FERTILIZING_THRESHOLD_DAYS,
      overdueDays: FERTILIZING_THRESHOLD_DAYS + 7, // 14 + 7 = 21 days
      isDynamic: false,
      averageInterval: null,
      eventCount: intervals.length,
    }
  }

  const sum = intervals.reduce((a, b) => a + b, 0)
  const average = sum / intervals.length

  return {
    warningDays: Math.round(average * YELLOW_MULTIPLIER),
    overdueDays: Math.round(average * RED_MULTIPLIER),
    isDynamic: true,
    averageInterval: Math.round(average * 10) / 10,
    eventCount: intervals.length,
  }
}

/**
 * Gets the current care status for a plant
 */
export function getWateringStatus(careLogs: CareLog[]): CareStatus {
  const thresholds = getWateringThresholds(careLogs)
  const events = extractWateringEvents(careLogs)

  if (events.length === 0) {
    return {
      status: 'overdue',
      daysSinceLastCare: null,
      thresholds,
    }
  }

  const daysSinceLastCare = Math.floor(
    (Date.now() - events[0].getTime()) / (1000 * 60 * 60 * 24)
  )

  let status: CareStatus['status'] = 'ok'
  if (daysSinceLastCare >= thresholds.overdueDays) {
    status = 'overdue'
  } else if (daysSinceLastCare >= thresholds.warningDays) {
    status = 'warning'
  }

  return {
    status,
    daysSinceLastCare,
    thresholds,
  }
}

/**
 * Determines if a plant is "stale" based on dynamic thresholds
 * Uses the plant's actual watering rhythm instead of a fixed 7-day rule
 */
export function isPlantStale(careLogs: CareLog[], lastActivityDate?: string | Date): boolean {
  // First check care-based staleness
  const { status } = getWateringStatus(careLogs)
  if (status === 'overdue') return true

  // Also check general activity staleness
  if (lastActivityDate) {
    const lastActivity = new Date(lastActivityDate)
    const daysSinceActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    )
    // Still use static threshold for general activity
    return daysSinceActivity >= STALE_ACTIVITY_THRESHOLD_DAYS
  }

  return false
}

/**
 * Gets the status color class for a care status
 */
export function getStatusColorClass(status: CareStatus['status']): string {
  switch (status) {
    case 'ok': return 'bg-green-100 text-green-700'
    case 'warning': return 'bg-yellow-100 text-yellow-700'
    case 'overdue': return 'bg-red-100 text-red-700'
  }
}

/**
 * Gets status badge styling for Tailwind
 */
export function getStatusBadgeClass(status: CareStatus['status']): string {
  switch (status) {
    case 'ok': return 'bg-green-500'
    case 'warning': return 'bg-yellow-500'
    case 'overdue': return 'bg-red-500'
  }
}

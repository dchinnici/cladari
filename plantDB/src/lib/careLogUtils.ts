/**
 * Care Log Utilities
 *
 * BUSINESS RULE: Fertilizing always includes watering (liquid feed workflow)
 * - When analyzing watering frequency, include: watering, fertilizing, and rain events
 * - When analyzing fertilizing frequency, include: only fertilizing events
 */

export type CareLogAction = 'watering' | 'water' | 'rain' | 'fertilizing' | 'fertilize' | 'repotting' | 'pruning' | 'pest_treatment' | 'fungicide' | 'other'

/**
 * Check if a care log action counts as a watering event
 * Includes: watering, fertilizing (liquid feed), and rain
 */
export function isWateringEvent(action: string): boolean {
  const wateringActions = ['watering', 'water', 'rain', 'fertilizing', 'fertilize']
  return wateringActions.includes(action)
}

/**
 * Check if a care log action counts as a fertilizing event
 */
export function isFertilizingEvent(action: string): boolean {
  const fertilizingActions = ['fertilizing', 'fertilize']
  return fertilizingActions.includes(action)
}

/**
 * Get the most recent watering event from care logs
 * @param careLogs - Array of care log objects with date and action properties
 * @returns Most recent watering event or null
 */
export function getLastWateringEvent(careLogs: any[]): any | null {
  return careLogs.find(log => isWateringEvent(log.action)) || null
}

/**
 * Get the most recent fertilizing event from care logs
 * @param careLogs - Array of care log objects with date and action properties
 * @returns Most recent fertilizing event or null
 */
export function getLastFertilizingEvent(careLogs: any[]): any | null {
  return careLogs.find(log => isFertilizingEvent(log.action)) || null
}

/**
 * Calculate watering frequency in days
 * @param careLogs - Array of care log objects sorted by date (most recent first)
 * @returns Average days between watering events
 */
export function calculateWateringFrequency(careLogs: any[]): number | null {
  const wateringLogs = careLogs.filter(log => isWateringEvent(log.action))

  if (wateringLogs.length < 2) return null

  let totalDays = 0
  for (let i = 0; i < wateringLogs.length - 1; i++) {
    const current = new Date(wateringLogs[i].date)
    const next = new Date(wateringLogs[i + 1].date)
    const daysDiff = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
    totalDays += daysDiff
  }

  return Math.round(totalDays / (wateringLogs.length - 1))
}

/**
 * Calculate fertilizing frequency in days
 * @param careLogs - Array of care log objects sorted by date (most recent first)
 * @returns Average days between fertilizing events
 */
export function calculateFertilizingFrequency(careLogs: any[]): number | null {
  const feedingLogs = careLogs.filter(log => isFertilizingEvent(log.action))

  if (feedingLogs.length < 2) return null

  let totalDays = 0
  for (let i = 0; i < feedingLogs.length - 1; i++) {
    const current = new Date(feedingLogs[i].date)
    const next = new Date(feedingLogs[i + 1].date)
    const daysDiff = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
    totalDays += daysDiff
  }

  return Math.round(totalDays / (feedingLogs.length - 1))
}

/**
 * Get days since last watering
 * @param careLogs - Array of care log objects sorted by date (most recent first)
 * @returns Number of days since last watering, or null if never watered
 */
export function getDaysSinceLastWatering(careLogs: any[]): number | null {
  const lastWater = getLastWateringEvent(careLogs)
  if (!lastWater) return null

  const days = Math.floor((Date.now() - new Date(lastWater.date).getTime()) / (1000 * 60 * 60 * 24))
  return days
}

/**
 * Get days since last fertilizing
 * @param careLogs - Array of care log objects sorted by date (most recent first)
 * @returns Number of days since last fertilizing, or null if never fertilized
 */
export function getDaysSinceLastFertilizing(careLogs: any[]): number | null {
  const lastFeed = getLastFertilizingEvent(careLogs)
  if (!lastFeed) return null

  const days = Math.floor((Date.now() - new Date(lastFeed.date).getTime()) / (1000 * 60 * 60 * 24))
  return days
}

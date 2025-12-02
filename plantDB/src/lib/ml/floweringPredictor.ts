/**
 * Flowering Cycle Predictor
 *
 * Analyzes flowering history to predict:
 * - When next flowering cycle will occur
 * - Phase durations (spathe → female → male → close)
 * - Optimal pollination windows
 * - Seasonal flowering patterns
 */

import {
  DataPoint,
  detectTrend,
  calculateSeasonality,
  calculateEWMA,
  standardDeviation,
  percentile,
  calculateModelConfidence,
  SeasonalityResult
} from './statisticalAnalyzer'

export interface FloweringCycle {
  id: string
  startDate: Date | string
  endDate?: Date | string | null
  status: 'developing' | 'female_phase' | 'male_phase' | 'pollinated' | 'seeding' | 'closed'
  femalePhaseStart?: Date | string | null
  femalePhaseEnd?: Date | string | null
  malePhaseStart?: Date | string | null
  malePhaseEnd?: Date | string | null
  pollinationDate?: Date | string | null
  notes?: string | null
}

export interface FloweringPrediction {
  likelyNextCycle: Date | null
  daysUntilNextCycle: number | null
  confidence: 'high' | 'medium' | 'low'
  predictedPhases: {
    spatheEmergence: { start: Date; duration: number } | null
    femalePhase: { start: Date; end: Date; duration: number } | null
    malePhase: { start: Date; end: Date; duration: number } | null
    totalDuration: number | null
  }
  pollinationWindow: {
    optimal: Date | null
    rangeStart: Date | null
    rangeEnd: Date | null
    daysFromNow: number | null
  }
  seasonality: SeasonalityResult
  statistics: FloweringStatistics
  insights: string[]
}

export interface FloweringStatistics {
  totalCycles: number
  completedCycles: number
  avgCycleInterval: number | null      // Days between cycles
  avgCycleDuration: number | null      // Days from start to end
  avgFemalePhase: number | null        // Days
  avgMalePhase: number | null          // Days
  avgFemaleToMale: number | null       // Days between phases
  cycleConsistency: 'high' | 'medium' | 'low'
  mostActiveMonth: number | null
  cyclesPerYear: number | null
}

/**
 * Main flowering prediction function
 */
export function predictFloweringCycle(
  floweringCycles: FloweringCycle[]
): FloweringPrediction {
  const insights: string[] = []

  // Need at least 1 completed cycle for meaningful predictions
  const completedCycles = floweringCycles.filter(c =>
    c.endDate || c.status === 'closed'
  )

  if (completedCycles.length === 0) {
    return {
      likelyNextCycle: null,
      daysUntilNextCycle: null,
      confidence: 'low',
      predictedPhases: {
        spatheEmergence: null,
        femalePhase: null,
        malePhase: null,
        totalDuration: null
      },
      pollinationWindow: {
        optimal: null,
        rangeStart: null,
        rangeEnd: null,
        daysFromNow: null
      },
      seasonality: { hasSeason: false, peakMonth: null, troughMonth: null, amplitude: 0 },
      statistics: calculateStatistics(floweringCycles),
      insights: ['No completed flowering cycles - predictions will improve with data']
    }
  }

  // Sort cycles by start date (most recent first)
  const sortedCycles = [...floweringCycles].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  // Calculate statistics
  const stats = calculateStatistics(sortedCycles)

  // Predict next cycle date
  const nextCyclePrediction = predictNextCycleDate(sortedCycles, stats)

  // Predict phase durations
  const phasePredictions = predictPhaseDurations(sortedCycles, nextCyclePrediction.date)

  // Calculate pollination window
  const pollinationWindow = calculatePollinationWindow(phasePredictions, nextCyclePrediction.date)

  // Analyze seasonality
  const seasonality = analyzeFloweringSeasonality(sortedCycles)

  // Generate insights
  if (seasonality.hasSeason) {
    insights.push(`Peak flowering typically occurs in month ${seasonality.peakMonth}`)
  }

  if (stats.avgCycleInterval && stats.avgCycleInterval < 90) {
    insights.push(`This plant flowers frequently (every ${Math.round(stats.avgCycleInterval)} days on average)`)
  } else if (stats.avgCycleInterval && stats.avgCycleInterval > 180) {
    insights.push(`This plant flowers infrequently (every ${Math.round(stats.avgCycleInterval)} days on average)`)
  }

  if (stats.cycleConsistency === 'high') {
    insights.push('Flowering pattern is highly predictable')
  } else if (stats.cycleConsistency === 'low') {
    insights.push('Flowering pattern varies significantly - predictions less certain')
  }

  if (phasePredictions.femalePhase && phasePredictions.malePhase) {
    const overlap = checkPhaseOverlap(phasePredictions)
    if (overlap) {
      insights.push('Female and male phases may overlap - self-pollination possible')
    }
  }

  // Check for active cycle
  const activeCycle = floweringCycles.find(c =>
    !c.endDate && c.status !== 'closed'
  )
  if (activeCycle) {
    const activeInsight = describeActiveCycle(activeCycle)
    if (activeInsight) insights.unshift(activeInsight)
  }

  // Calculate confidence
  const confidence = calculateFloweringConfidence(completedCycles.length, stats)

  return {
    likelyNextCycle: nextCyclePrediction.date,
    daysUntilNextCycle: nextCyclePrediction.daysUntil,
    confidence,
    predictedPhases: phasePredictions,
    pollinationWindow,
    seasonality,
    statistics: stats,
    insights
  }
}

/**
 * Calculate flowering statistics
 */
function calculateStatistics(cycles: FloweringCycle[]): FloweringStatistics {
  const completedCycles = cycles.filter(c => c.endDate || c.status === 'closed')

  if (completedCycles.length === 0) {
    return {
      totalCycles: cycles.length,
      completedCycles: 0,
      avgCycleInterval: null,
      avgCycleDuration: null,
      avgFemalePhase: null,
      avgMalePhase: null,
      avgFemaleToMale: null,
      cycleConsistency: 'low',
      mostActiveMonth: null,
      cyclesPerYear: null
    }
  }

  // Calculate intervals between cycles
  const intervals: number[] = []
  for (let i = 0; i < completedCycles.length - 1; i++) {
    const current = new Date(completedCycles[i].startDate)
    const previous = new Date(completedCycles[i + 1].startDate)
    const days = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    if (days > 0 && days < 365) {
      intervals.push(days)
    }
  }

  // Calculate cycle durations
  const durations = completedCycles
    .filter(c => c.endDate)
    .map(c => {
      const start = new Date(c.startDate)
      const end = new Date(c.endDate!)
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(d => d > 0 && d < 120)

  // Calculate female phase durations
  const femalePhaseDurations = completedCycles
    .filter(c => c.femalePhaseStart && c.femalePhaseEnd)
    .map(c => {
      const start = new Date(c.femalePhaseStart!)
      const end = new Date(c.femalePhaseEnd!)
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(d => d > 0 && d < 30)

  // Calculate male phase durations
  const malePhaseDurations = completedCycles
    .filter(c => c.malePhaseStart && c.malePhaseEnd)
    .map(c => {
      const start = new Date(c.malePhaseStart!)
      const end = new Date(c.malePhaseEnd!)
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(d => d > 0 && d < 30)

  // Calculate female to male gap
  const femaleToMaleGaps = completedCycles
    .filter(c => c.femalePhaseEnd && c.malePhaseStart)
    .map(c => {
      const femaleEnd = new Date(c.femalePhaseEnd!)
      const maleStart = new Date(c.malePhaseStart!)
      return (maleStart.getTime() - femaleEnd.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(d => d >= 0 && d < 20)

  // Find most active month
  const monthCounts = new Array(12).fill(0)
  completedCycles.forEach(c => {
    const month = new Date(c.startDate).getMonth()
    monthCounts[month]++
  })
  const maxCount = Math.max(...monthCounts)
  const mostActiveMonth = maxCount > 0 ? monthCounts.indexOf(maxCount) + 1 : null

  // Calculate cycles per year
  let cyclesPerYear: number | null = null
  if (completedCycles.length >= 2) {
    const firstCycle = new Date(completedCycles[completedCycles.length - 1].startDate)
    const lastCycle = new Date(completedCycles[0].startDate)
    const yearSpan = (lastCycle.getTime() - firstCycle.getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (yearSpan > 0.25) { // At least 3 months of data
      cyclesPerYear = completedCycles.length / yearSpan
    }
  }

  // Determine consistency
  let cycleConsistency: 'high' | 'medium' | 'low' = 'low'
  if (intervals.length >= 3) {
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const stdDev = standardDeviation(intervals)
    const cv = stdDev / avgInterval // Coefficient of variation

    if (cv < 0.2) cycleConsistency = 'high'
    else if (cv < 0.4) cycleConsistency = 'medium'
  }

  return {
    totalCycles: cycles.length,
    completedCycles: completedCycles.length,
    avgCycleInterval: intervals.length > 0
      ? Math.round(calculateEWMA(intervals.reverse(), 0.3))
      : null,
    avgCycleDuration: durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
    avgFemalePhase: femalePhaseDurations.length > 0
      ? Math.round(femalePhaseDurations.reduce((a, b) => a + b, 0) / femalePhaseDurations.length)
      : null,
    avgMalePhase: malePhaseDurations.length > 0
      ? Math.round(malePhaseDurations.reduce((a, b) => a + b, 0) / malePhaseDurations.length)
      : null,
    avgFemaleToMale: femaleToMaleGaps.length > 0
      ? Math.round(femaleToMaleGaps.reduce((a, b) => a + b, 0) / femaleToMaleGaps.length)
      : null,
    cycleConsistency,
    mostActiveMonth,
    cyclesPerYear: cyclesPerYear ? Math.round(cyclesPerYear * 10) / 10 : null
  }
}

/**
 * Predict next cycle date
 */
function predictNextCycleDate(
  cycles: FloweringCycle[],
  stats: FloweringStatistics
): { date: Date | null; daysUntil: number | null } {
  // Check for active cycle
  const activeCycle = cycles.find(c => !c.endDate && c.status !== 'closed')
  if (activeCycle) {
    // If there's an active cycle, next cycle is after this one
    const expectedEnd = stats.avgCycleDuration
      ? new Date(new Date(activeCycle.startDate).getTime() + stats.avgCycleDuration * 24 * 60 * 60 * 1000)
      : null

    if (expectedEnd && stats.avgCycleInterval) {
      const nextStart = new Date(expectedEnd.getTime() + stats.avgCycleInterval * 24 * 60 * 60 * 1000)
      const daysUntil = Math.round((nextStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return { date: nextStart, daysUntil }
    }
    return { date: null, daysUntil: null }
  }

  // No active cycle - predict based on last completed cycle
  const lastCompletedCycle = cycles.find(c => c.endDate || c.status === 'closed')
  if (!lastCompletedCycle || !stats.avgCycleInterval) {
    return { date: null, daysUntil: null }
  }

  const lastEndDate = lastCompletedCycle.endDate
    ? new Date(lastCompletedCycle.endDate)
    : new Date(lastCompletedCycle.startDate)

  const nextStart = new Date(lastEndDate.getTime() + stats.avgCycleInterval * 24 * 60 * 60 * 1000)
  const daysUntil = Math.round((nextStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return { date: nextStart, daysUntil }
}

/**
 * Predict phase durations for next cycle
 */
function predictPhaseDurations(
  cycles: FloweringCycle[],
  nextCycleStart: Date | null
): {
  spatheEmergence: { start: Date; duration: number } | null
  femalePhase: { start: Date; end: Date; duration: number } | null
  malePhase: { start: Date; end: Date; duration: number } | null
  totalDuration: number | null
} {
  if (!nextCycleStart) {
    return {
      spatheEmergence: null,
      femalePhase: null,
      malePhase: null,
      totalDuration: null
    }
  }

  const stats = calculateStatistics(cycles)

  // Calculate days from start to female phase
  const daysToFemale = cycles
    .filter(c => c.femalePhaseStart)
    .map(c => {
      const start = new Date(c.startDate)
      const female = new Date(c.femalePhaseStart!)
      return (female.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter(d => d >= 0 && d < 60)

  const avgDaysToFemale = daysToFemale.length > 0
    ? Math.round(daysToFemale.reduce((a, b) => a + b, 0) / daysToFemale.length)
    : 7 // Default estimate

  // Spathe emergence prediction
  const spatheEmergence = {
    start: nextCycleStart,
    duration: avgDaysToFemale
  }

  // Female phase prediction
  let femalePhase: { start: Date; end: Date; duration: number } | null = null
  if (stats.avgFemalePhase) {
    const femaleStart = new Date(nextCycleStart.getTime() + avgDaysToFemale * 24 * 60 * 60 * 1000)
    const femaleEnd = new Date(femaleStart.getTime() + stats.avgFemalePhase * 24 * 60 * 60 * 1000)
    femalePhase = {
      start: femaleStart,
      end: femaleEnd,
      duration: stats.avgFemalePhase
    }
  }

  // Male phase prediction
  let malePhase: { start: Date; end: Date; duration: number } | null = null
  if (stats.avgMalePhase && femalePhase) {
    const gapDays = stats.avgFemaleToMale ?? 2
    const maleStart = new Date(femalePhase.end.getTime() + gapDays * 24 * 60 * 60 * 1000)
    const maleEnd = new Date(maleStart.getTime() + stats.avgMalePhase * 24 * 60 * 60 * 1000)
    malePhase = {
      start: maleStart,
      end: maleEnd,
      duration: stats.avgMalePhase
    }
  }

  return {
    spatheEmergence,
    femalePhase,
    malePhase,
    totalDuration: stats.avgCycleDuration
  }
}

/**
 * Calculate optimal pollination window
 */
function calculatePollinationWindow(
  phasePredictions: ReturnType<typeof predictPhaseDurations>,
  nextCycleStart: Date | null
): {
  optimal: Date | null
  rangeStart: Date | null
  rangeEnd: Date | null
  daysFromNow: number | null
} {
  if (!phasePredictions.femalePhase) {
    return { optimal: null, rangeStart: null, rangeEnd: null, daysFromNow: null }
  }

  const { start, end } = phasePredictions.femalePhase

  // Optimal pollination is midway through female phase
  const optimalTime = start.getTime() + (end.getTime() - start.getTime()) / 2
  const optimal = new Date(optimalTime)

  // Buffer of 1-2 days on each side
  const rangeStart = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const rangeEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000)

  const daysFromNow = Math.round((optimal.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return { optimal, rangeStart, rangeEnd, daysFromNow }
}

/**
 * Analyze flowering seasonality
 */
function analyzeFloweringSeasonality(cycles: FloweringCycle[]): SeasonalityResult {
  if (cycles.length < 6) {
    return { hasSeason: false, peakMonth: null, troughMonth: null, amplitude: 0 }
  }

  // Count cycles per month
  const monthCounts = new Array(12).fill(0)
  cycles.forEach(c => {
    const month = new Date(c.startDate).getMonth()
    monthCounts[month]++
  })

  // Need cycles across multiple months for seasonality
  const monthsWithCycles = monthCounts.filter(c => c > 0).length
  if (monthsWithCycles < 4) {
    return { hasSeason: false, peakMonth: null, troughMonth: null, amplitude: 0 }
  }

  const maxCount = Math.max(...monthCounts)
  const minCount = Math.min(...monthCounts.filter(c => c > 0))
  const avgCount = cycles.length / 12

  // Amplitude measures how much variation there is
  const amplitude = avgCount > 0 ? (maxCount - minCount) / avgCount : 0

  // Need significant variation for seasonality
  if (amplitude < 0.5) {
    return { hasSeason: false, peakMonth: null, troughMonth: null, amplitude }
  }

  const peakMonth = monthCounts.indexOf(maxCount) + 1
  const troughMonth = monthCounts.indexOf(minCount) + 1

  return {
    hasSeason: true,
    peakMonth,
    troughMonth,
    amplitude
  }
}

/**
 * Check if female and male phases might overlap
 */
function checkPhaseOverlap(
  phasePredictions: ReturnType<typeof predictPhaseDurations>
): boolean {
  if (!phasePredictions.femalePhase || !phasePredictions.malePhase) {
    return false
  }

  const femaleEnd = phasePredictions.femalePhase.end
  const maleStart = phasePredictions.malePhase.start

  // Overlap if male starts before female ends
  return maleStart.getTime() <= femaleEnd.getTime()
}

/**
 * Describe active flowering cycle
 */
function describeActiveCycle(cycle: FloweringCycle): string | null {
  const daysSinceStart = Math.round(
    (Date.now() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  switch (cycle.status) {
    case 'developing':
      return `Currently developing spathe (day ${daysSinceStart})`
    case 'female_phase':
      return `Currently in FEMALE PHASE - pollination window open!`
    case 'male_phase':
      return `Currently in male phase - pollen available`
    case 'pollinated':
      return `Pollinated - seeds developing`
    case 'seeding':
      return `Seeds maturing`
    default:
      return null
  }
}

/**
 * Calculate flowering prediction confidence
 */
function calculateFloweringConfidence(
  completedCycles: number,
  stats: FloweringStatistics
): 'high' | 'medium' | 'low' {
  if (completedCycles < 2) return 'low'

  let score = 0

  // More cycles = higher confidence
  if (completedCycles >= 5) score += 3
  else if (completedCycles >= 3) score += 2
  else score += 1

  // Higher consistency = higher confidence
  if (stats.cycleConsistency === 'high') score += 2
  else if (stats.cycleConsistency === 'medium') score += 1

  // Having phase data increases confidence
  if (stats.avgFemalePhase) score += 1
  if (stats.avgMalePhase) score += 1

  if (score >= 5) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

/**
 * Find plants with overlapping female phases (for cross-pollination planning)
 */
export function findPollinationPartners(
  plants: { id: string; name: string; floweringCycles: FloweringCycle[] }[]
): {
  plantAId: string
  plantAName: string
  plantBId: string
  plantBName: string
  overlapStart: Date
  overlapEnd: Date
  overlapDays: number
}[] {
  const partners: {
    plantAId: string
    plantAName: string
    plantBId: string
    plantBName: string
    overlapStart: Date
    overlapEnd: Date
    overlapDays: number
  }[] = []

  // Get plants with predicted female phases
  const plantsWithPredictions = plants
    .map(p => {
      const prediction = predictFloweringCycle(p.floweringCycles)
      return {
        id: p.id,
        name: p.name,
        femalePhase: prediction.predictedPhases.femalePhase
      }
    })
    .filter(p => p.femalePhase !== null)

  // Find overlapping female phases
  for (let i = 0; i < plantsWithPredictions.length; i++) {
    for (let j = i + 1; j < plantsWithPredictions.length; j++) {
      const plantA = plantsWithPredictions[i]
      const plantB = plantsWithPredictions[j]

      if (!plantA.femalePhase || !plantB.femalePhase) continue

      // Check for overlap
      const overlapStart = new Date(
        Math.max(plantA.femalePhase.start.getTime(), plantB.femalePhase.start.getTime())
      )
      const overlapEnd = new Date(
        Math.min(plantA.femalePhase.end.getTime(), plantB.femalePhase.end.getTime())
      )

      if (overlapStart < overlapEnd) {
        const overlapDays = Math.round(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        )

        partners.push({
          plantAId: plantA.id,
          plantAName: plantA.name,
          plantBId: plantB.id,
          plantBName: plantB.name,
          overlapStart,
          overlapEnd,
          overlapDays
        })
      }
    }
  }

  return partners.sort((a, b) => b.overlapDays - a.overlapDays)
}

/**
 * Generate flowering summary for a plant
 */
export function generateFloweringSummary(prediction: FloweringPrediction): string {
  const parts: string[] = []

  if (prediction.likelyNextCycle) {
    if (prediction.daysUntilNextCycle !== null && prediction.daysUntilNextCycle <= 0) {
      parts.push('Next flowering cycle may begin any time now.')
    } else if (prediction.daysUntilNextCycle !== null) {
      parts.push(`Next flowering cycle predicted in ~${prediction.daysUntilNextCycle} days.`)
    }
  } else {
    parts.push('Insufficient data to predict next flowering cycle.')
  }

  if (prediction.pollinationWindow.optimal && prediction.pollinationWindow.daysFromNow !== null) {
    if (prediction.pollinationWindow.daysFromNow > 0) {
      parts.push(`Optimal pollination window: ${prediction.pollinationWindow.daysFromNow} days from now.`)
    }
  }

  if (prediction.statistics.cyclesPerYear) {
    parts.push(`Average: ${prediction.statistics.cyclesPerYear} cycles per year.`)
  }

  return parts.join(' ')
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateRecommendations } from '@/lib/care/recommendations'
import { predictWateringInterval, analyzeWateringHistory, PrecipitationData } from '@/lib/ml/wateringPredictor'
import { predictHealthTrajectory, generateHealthSummary, calculateSubstrateHealthScore } from '@/lib/ml/healthTrajectory'
import { predictFloweringCycle, generateFloweringSummary } from '@/lib/ml/floweringPredictor'
import { getWeather } from '@/lib/weather'

/**
 * Convert Fahrenheit to Celsius
 * SensorPush stores temps in °F, ML predictor expects °C
 */
function fahrenheitToCelsius(f: number | null): number | null {
  if (f === null) return null
  return (f - 32) * 5 / 9
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const plantId = params.id

    // Fetch plant with all relevant data for ML predictions
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        careLogs: {
          orderBy: { date: 'desc' },
          take: 50,
          select: {
            id: true,
            date: true,
            action: true,
            details: true,
            // EC/pH structured columns (for ML analysis)
            inputEC: true,
            inputPH: true,
            outputEC: true,
            outputPH: true
          }
        },
        currentLocation: {
          select: {
            name: true,
            isOutdoor: true,
            temperature: true,
            humidity: true,
            vpd: true,
            dli: true,
            co2: true
          }
        },
        floweringCycles: {
          orderBy: { spatheEmergence: 'desc' },
          select: {
            id: true,
            spatheEmergence: true,
            spatheClose: true,
            femaleStart: true,
            femaleEnd: true,
            maleStart: true,
            maleEnd: true,
            pollenCollected: true,
            pollenQuality: true,
            notes: true
          }
        }
      }
    })

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      )
    }

    // Generate base recommendations (existing system)
    const recommendations = await generateRecommendations(plantId)

    // Extract EC/pH readings from care logs (use structured columns)
    const ecPhReadings = plant.careLogs
      .filter((log: any) => {
        return (
          log.inputEC != null ||
          log.outputEC != null ||
          log.inputPH != null ||
          log.outputPH != null
        )
      })
      .map((log: any) => ({
        date: log.date,
        ecIn: log.inputEC ?? null,
        ecOut: log.outputEC ?? null,
        phIn: log.inputPH ?? null,
        phOut: log.outputPH ?? null
      }))

    // Find last repot date
    const lastRepot = plant.careLogs.find((log: any) =>
      log.action?.toLowerCase().includes('repot')
    )
    const lastRepotDate = lastRepot ? new Date(lastRepot.date) : null

    // ML Predictions - Each predictor wrapped for graceful degradation
    // If one fails, others still return data instead of 500ing the whole response

    // 1. Watering Prediction
    // Note: SensorPush stores temperature in °F, predictor expects °C
    const tempF = plant.currentLocation?.temperature
    const tempC = fahrenheitToCelsius(tempF ?? null)
    console.log(`[Watering ML] Temperature: ${tempF}°F → ${tempC?.toFixed(1)}°C`)

    // Fetch weather data for rain-adjusted predictions (outdoor locations only)
    let precipitationData: PrecipitationData | undefined
    const isOutdoor = plant.currentLocation?.isOutdoor ?? false

    if (isOutdoor) {
      try {
        const weather = await getWeather()
        // Get last 24h and 48h precipitation from daily forecast
        // daily[0] is today, daily[1] is yesterday (if we had historical)
        // For now, use current + today's sum as approximation
        const last24h = weather.current.precipitation + (weather.daily[0]?.precipitationSum ?? 0)
        // 48h would need historical data - approximate with today + forecast
        const last48h = last24h + (weather.daily[1]?.precipitationSum ?? 0)

        precipitationData = {
          last24h,
          last48h,
          isOutdoor: true
        }
        console.log(`[Watering ML] Rain: ${last24h.toFixed(1)}mm (24h), ${last48h.toFixed(1)}mm (48h), outdoor=${isOutdoor}`)
      } catch (err) {
        console.error('[Watering ML] Failed to fetch weather:', err)
        // Continue without rain data
      }
    }

    // Watering prediction with graceful degradation
    let wateringPrediction: ReturnType<typeof predictWateringInterval> | null = null
    let wateringHistory: ReturnType<typeof analyzeWateringHistory> | null = null
    try {
      wateringPrediction = predictWateringInterval(
        plant.careLogs.map((log: any) => ({
          date: new Date(log.date),
          action: log.action,
          ecIn: log.inputEC ?? null,
          ecOut: log.outputEC ?? null,
          phIn: log.inputPH ?? null,
          phOut: log.outputPH ?? null
        })),
        plant.currentLocation ? {
          temperature: fahrenheitToCelsius(plant.currentLocation.temperature),
          humidity: plant.currentLocation.humidity,
          vpd: plant.currentLocation.vpd,
          dli: plant.currentLocation.dli,
          co2: plant.currentLocation.co2
        } : undefined,
        lastRepotDate,
        plant.healthStatus,
        precipitationData
      )

      wateringHistory = analyzeWateringHistory(
        plant.careLogs.map((log: any) => ({
          date: new Date(log.date),
          action: log.action
        }))
      )
    } catch (err) {
      console.error('[ML Recommendations] Watering prediction failed:', err)
    }

    // 2. Health Trajectory with graceful degradation
    let healthTrajectory: ReturnType<typeof predictHealthTrajectory> | null = null
    let substrateHealthScore: ReturnType<typeof calculateSubstrateHealthScore> | null = null
    try {
      healthTrajectory = predictHealthTrajectory(
        ecPhReadings,
        lastRepotDate
      )

      substrateHealthScore = calculateSubstrateHealthScore(
        ecPhReadings,
        lastRepotDate
      )
    } catch (err) {
      console.error('[ML Recommendations] Health trajectory failed:', err)
    }

    // 3. Flowering Prediction with graceful degradation
    // Map from Prisma schema (spatheEmergence, etc.) to predictor interface (startDate, etc.)
    let floweringPrediction: ReturnType<typeof predictFloweringCycle> | null = null
    try {
      floweringPrediction = predictFloweringCycle(
        plant.floweringCycles.map((cycle: any) => {
          // Determine status based on which phase dates are filled
          let status: 'developing' | 'female_phase' | 'male_phase' | 'pollinated' | 'seeding' | 'closed' = 'developing'
          if (cycle.spatheClose) status = 'closed'
          else if (cycle.maleEnd) status = 'seeding'
          else if (cycle.maleStart) status = 'male_phase'
          else if (cycle.femaleStart) status = 'female_phase'
          else if (cycle.pollenCollected) status = 'pollinated'

          return {
            id: cycle.id,
            startDate: cycle.spatheEmergence ? new Date(cycle.spatheEmergence) : new Date(),
            endDate: cycle.spatheClose ? new Date(cycle.spatheClose) : null,
            status,
            femalePhaseStart: cycle.femaleStart ? new Date(cycle.femaleStart) : null,
            femalePhaseEnd: cycle.femaleEnd ? new Date(cycle.femaleEnd) : null,
            malePhaseStart: cycle.maleStart ? new Date(cycle.maleStart) : null,
            malePhaseEnd: cycle.maleEnd ? new Date(cycle.maleEnd) : null,
            pollinationDate: null, // Not tracked separately in schema
            notes: cycle.notes
          }
        })
      )
    } catch (err) {
      console.error('[ML Recommendations] Flowering prediction failed:', err)
    }

    // Build enhanced response with graceful null handling
    const response = {
      recommendations,
      predictions: {
        watering: wateringPrediction ? {
          nextDate: wateringPrediction.nextWaterDate,
          daysUntil: wateringPrediction.daysUntilWater,
          confidence: wateringPrediction.confidence,
          interval: wateringPrediction.interval,
          factors: wateringPrediction.factors,
          trend: wateringPrediction.trend,
          history: wateringHistory ? {
            totalEvents: wateringHistory.totalEvents,
            avgInterval: wateringHistory.avgInterval,
            recentInterval: wateringHistory.recentInterval,
            trend: wateringHistory.trend,
            consistency: wateringHistory.consistency
          } : null
        } : { error: 'Watering prediction unavailable', confidence: 'low' as const },
        health: healthTrajectory ? {
          trajectory: healthTrajectory.trajectory,
          currentScore: healthTrajectory.currentScore,
          substrateHealthScore,
          predicted: {
            '7d': healthTrajectory.predictedScore7d,
            '14d': healthTrajectory.predictedScore14d,
            '30d': healthTrajectory.predictedScore30d
          },
          confidence: healthTrajectory.confidence,
          riskFactors: healthTrajectory.riskFactors,
          interventions: healthTrajectory.interventions,
          trends: healthTrajectory.trends,
          alerts: healthTrajectory.alerts,
          summary: generateHealthSummary(healthTrajectory)
        } : { error: 'Health trajectory unavailable', confidence: 'low' as const },
        flowering: floweringPrediction ? {
          likelyNextCycle: floweringPrediction.likelyNextCycle,
          daysUntilNextCycle: floweringPrediction.daysUntilNextCycle,
          confidence: floweringPrediction.confidence,
          predictedPhases: floweringPrediction.predictedPhases,
          pollinationWindow: floweringPrediction.pollinationWindow,
          seasonality: floweringPrediction.seasonality,
          statistics: floweringPrediction.statistics,
          insights: floweringPrediction.insights,
          summary: generateFloweringSummary(floweringPrediction)
        } : { error: 'Flowering prediction unavailable', confidence: 'low' as const }
      },
      mlMetadata: {
        dataPoints: {
          careLogs: plant.careLogs.length,
          ecPhReadings: ecPhReadings.length,
          floweringCycles: plant.floweringCycles.length
        },
        modelConfidence: calculateOverallConfidence(
          wateringPrediction?.confidence ?? 'low',
          healthTrajectory?.confidence ?? 'low',
          floweringPrediction?.confidence ?? 'low'
        ),
        predictorStatus: {
          watering: wateringPrediction ? 'ok' : 'failed',
          health: healthTrajectory ? 'ok' : 'failed',
          flowering: floweringPrediction ? 'ok' : 'failed'
        },
        generatedAt: new Date().toISOString()
      },
      plantContext: {
        plantId: plant.plantId,
        healthStatus: plant.healthStatus,
        location: plant.currentLocation?.name,
        isOutdoor,
        lastRepotDate,
        environment: plant.currentLocation ? {
          temperature: plant.currentLocation.temperature,
          humidity: plant.currentLocation.humidity,
          vpd: plant.currentLocation.vpd,
          dli: plant.currentLocation.dli
        } : null,
        precipitation: precipitationData ? {
          last24h: precipitationData.last24h,
          last48h: precipitationData.last48h
        } : null
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate overall model confidence from individual predictions
 */
function calculateOverallConfidence(
  wateringConfidence: 'high' | 'medium' | 'low',
  healthConfidence: 'high' | 'medium' | 'low',
  floweringConfidence: 'high' | 'medium' | 'low'
): 'high' | 'medium' | 'low' {
  const confidenceMap = { high: 3, medium: 2, low: 1 }

  const avgScore = (
    confidenceMap[wateringConfidence] +
    confidenceMap[healthConfidence] +
    confidenceMap[floweringConfidence]
  ) / 3

  if (avgScore >= 2.5) return 'high'
  if (avgScore >= 1.5) return 'medium'
  return 'low'
}

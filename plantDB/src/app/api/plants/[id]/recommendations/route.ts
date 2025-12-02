import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateRecommendations } from '@/lib/care/recommendations'
import { predictWateringInterval, analyzeWateringHistory } from '@/lib/ml/wateringPredictor'
import { predictHealthTrajectory, generateHealthSummary, calculateSubstrateHealthScore } from '@/lib/ml/healthTrajectory'
import { predictFloweringCycle, generateFloweringSummary } from '@/lib/ml/floweringPredictor'

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
            details: true
          }
        },
        currentLocation: {
          select: {
            name: true,
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

    // Extract EC/pH readings from care logs
    const ecPhReadings = plant.careLogs
      .filter((log: any) => {
        const details = log.details
        return details && (
          details.ecIn != null ||
          details.ecOut != null ||
          details.phIn != null ||
          details.phOut != null
        )
      })
      .map((log: any) => ({
        date: log.date,
        ecIn: log.details?.ecIn ?? null,
        ecOut: log.details?.ecOut ?? null,
        phIn: log.details?.phIn ?? null,
        phOut: log.details?.phOut ?? null
      }))

    // Find last repot date
    const lastRepot = plant.careLogs.find((log: any) =>
      log.action?.toLowerCase().includes('repot')
    )
    const lastRepotDate = lastRepot ? new Date(lastRepot.date) : null

    // ML Predictions

    // 1. Watering Prediction
    const wateringPrediction = predictWateringInterval(
      plant.careLogs.map((log: any) => ({
        date: new Date(log.date),
        action: log.action,
        ecIn: log.details?.ecIn,
        ecOut: log.details?.ecOut,
        phIn: log.details?.phIn,
        phOut: log.details?.phOut
      })),
      plant.currentLocation ? {
        temperature: plant.currentLocation.temperature,
        humidity: plant.currentLocation.humidity,
        vpd: plant.currentLocation.vpd,
        dli: plant.currentLocation.dli,
        co2: plant.currentLocation.co2
      } : undefined,
      lastRepotDate,
      plant.healthStatus
    )

    const wateringHistory = analyzeWateringHistory(
      plant.careLogs.map((log: any) => ({
        date: new Date(log.date),
        action: log.action
      }))
    )

    // 2. Health Trajectory
    const healthTrajectory = predictHealthTrajectory(
      ecPhReadings,
      lastRepotDate
    )

    const substrateHealthScore = calculateSubstrateHealthScore(
      ecPhReadings,
      lastRepotDate
    )

    // 3. Flowering Prediction
    // Map from Prisma schema (spatheEmergence, etc.) to predictor interface (startDate, etc.)
    const floweringPrediction = predictFloweringCycle(
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

    // Build enhanced response
    const response = {
      recommendations,
      predictions: {
        watering: {
          nextDate: wateringPrediction.nextWaterDate,
          daysUntil: wateringPrediction.daysUntilWater,
          confidence: wateringPrediction.confidence,
          interval: wateringPrediction.interval,
          factors: wateringPrediction.factors,
          trend: wateringPrediction.trend,
          history: {
            totalEvents: wateringHistory.totalEvents,
            avgInterval: wateringHistory.avgInterval,
            recentInterval: wateringHistory.recentInterval,
            trend: wateringHistory.trend,
            consistency: wateringHistory.consistency
          }
        },
        health: {
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
        },
        flowering: {
          likelyNextCycle: floweringPrediction.likelyNextCycle,
          daysUntilNextCycle: floweringPrediction.daysUntilNextCycle,
          confidence: floweringPrediction.confidence,
          predictedPhases: floweringPrediction.predictedPhases,
          pollinationWindow: floweringPrediction.pollinationWindow,
          seasonality: floweringPrediction.seasonality,
          statistics: floweringPrediction.statistics,
          insights: floweringPrediction.insights,
          summary: generateFloweringSummary(floweringPrediction)
        }
      },
      mlMetadata: {
        dataPoints: {
          careLogs: plant.careLogs.length,
          ecPhReadings: ecPhReadings.length,
          floweringCycles: plant.floweringCycles.length
        },
        modelConfidence: calculateOverallConfidence(
          wateringPrediction.confidence,
          healthTrajectory.confidence,
          floweringPrediction.confidence
        ),
        generatedAt: new Date().toISOString()
      },
      plantContext: {
        plantId: plant.plantId,
        healthStatus: plant.healthStatus,
        location: plant.currentLocation?.name,
        lastRepotDate,
        environment: plant.currentLocation ? {
          temperature: plant.currentLocation.temperature,
          humidity: plant.currentLocation.humidity,
          vpd: plant.currentLocation.vpd,
          dli: plant.currentLocation.dli
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

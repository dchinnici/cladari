/**
 * Plant Diagnosis API Endpoint
 * Analyzes symptoms to distinguish complex issues
 * Example: Differentiating thrip damage from manganese lockout
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { diagnosisEngine } from '@/lib/ml/diagnosis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      plantId,
      visualPattern,
      affectedArea,
      pestEvidence = false,
      photoUrl
    } = body;

    if (!plantId) {
      return NextResponse.json(
        { error: 'Plant ID is required' },
        { status: 400 }
      );
    }

    // Fetch plant and recent measurements
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        location: true,
        measurements: {
          orderBy: { date: 'desc' },
          take: 5
        },
        careLogs: {
          where: {
            action: { in: ['Fertilizing', 'Watering'] }
          },
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Get latest measurement values
    const latestMeasurement = plant.measurements[0];
    const latestCare = plant.careLogs[0];

    // Prepare symptoms for diagnosis
    const symptoms = {
      photo: photoUrl,
      visualPattern: visualPattern as any,
      affectedArea: affectedArea as any,
      pestEvidence,
      environment: {
        ec: latestMeasurement?.ecOutput || latestMeasurement?.ecInput || undefined,
        ph: latestMeasurement?.phOutput || latestMeasurement?.phInput || undefined,
        vpd: plant.location?.vpd || undefined,
        dli: plant.location?.dli || undefined,
        temperature: plant.location?.temperature || undefined,
        humidity: plant.location?.humidity || undefined
      },
      recentCare: latestCare ? {
        lastFertilized: latestCare.date,
        lastWatered: latestCare.date,
        fertilizerType: latestCare.details?.fertilizer || 'Baseline feed'
      } : undefined
    };

    // Run diagnosis
    const diagnosis = await diagnosisEngine.analyze(symptoms);

    // Add context from plant history
    const enhancedDiagnosis = {
      ...diagnosis,
      plantContext: {
        accessionNumber: plant.accessionNumber,
        healthStatus: plant.healthStatus,
        genetics: plant.genetics,
        location: plant.location?.name,
        daysSinceLastCare: latestCare
          ? Math.floor((Date.now() - new Date(latestCare.date).getTime()) / (1000 * 60 * 60 * 24))
          : null
      },
      environmentalReadings: {
        ec: symptoms.environment.ec,
        ph: symptoms.environment.ph,
        vpd: symptoms.environment.vpd,
        dli: symptoms.environment.dli,
        temperature: symptoms.environment.temperature,
        humidity: symptoms.environment.humidity
      }
    };

    // Log diagnosis for learning (future ML training)
    console.log('Diagnosis generated:', {
      plantId,
      primary: diagnosis.primary.issue,
      confidence: diagnosis.confidence
    });

    return NextResponse.json(enhancedDiagnosis);

  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagnosis' },
      { status: 500 }
    );
  }
}

// GET endpoint for common symptoms reference
export async function GET() {
  return NextResponse.json({
    visualPatterns: [
      'stippling',
      'yellowing',
      'browning',
      'wilting',
      'spots'
    ],
    affectedAreas: [
      'new_growth',
      'old_leaves',
      'all_leaves',
      'veins',
      'edges'
    ],
    commonIssues: [
      {
        issue: 'Thrip Damage',
        symptoms: ['stippling', 'silvery streaks'],
        evidence: 'Visual pests, feeding marks'
      },
      {
        issue: 'Manganese Lockout',
        symptoms: ['stippling', 'interveinal chlorosis'],
        evidence: 'High pH (>6.5), high EC, no pests'
      },
      {
        issue: 'Nitrogen Deficiency',
        symptoms: ['yellowing on old leaves'],
        evidence: 'Mobile nutrient pattern'
      },
      {
        issue: 'Iron Deficiency',
        symptoms: ['yellowing on new growth'],
        evidence: 'High pH, immobile nutrient pattern'
      }
    ]
  });
}
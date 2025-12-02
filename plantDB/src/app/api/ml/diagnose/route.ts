/**
 * Plant Diagnosis API Endpoint
 * Analyzes symptoms to distinguish complex issues
 * Example: Differentiating thrip damage from manganese lockout
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    // Fetch plant and recent data
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      select: {
        id: true,
        plantId: true,
        healthStatus: true,
        genetics: true,
        currentLocation: {
          select: {
            name: true,
            temperature: true,
            humidity: true,
            vpd: true,
            dli: true
          }
        },
        careLogs: {
          where: {
            action: { in: ['Fertilizing', 'Watering', 'watering', 'fertilizing'] }
          },
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            date: true,
            action: true,
            details: true
          }
        }
      }
    });

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Get latest care log with EC/pH data
    const latestCare = plant.careLogs[0];

    // Get EC/pH from care log details
    const careDetails = latestCare?.details as { ecIn?: number; ecOut?: number; phIn?: number; phOut?: number } | null;

    // Prepare symptoms for diagnosis
    const symptoms = {
      photo: photoUrl,
      visualPattern: visualPattern as any,
      affectedArea: affectedArea as any,
      pestEvidence,
      environment: {
        ec: careDetails?.ecOut || careDetails?.ecIn || undefined,
        ph: careDetails?.phOut || careDetails?.phIn || undefined,
        vpd: plant.currentLocation?.vpd || undefined,
        dli: plant.currentLocation?.dli || undefined,
        temperature: plant.currentLocation?.temperature || undefined,
        humidity: plant.currentLocation?.humidity || undefined
      },
      recentCare: latestCare ? {
        lastFertilized: latestCare.date,
        lastWatered: latestCare.date,
        fertilizerType: (careDetails as any)?.fertilizer || 'Baseline feed'
      } : undefined
    };

    // Run diagnosis
    const diagnosis = await diagnosisEngine.analyze(symptoms);

    // Add context from plant history
    const enhancedDiagnosis = {
      ...diagnosis,
      plantContext: {
        plantId: plant.plantId,
        healthStatus: plant.healthStatus,
        genetics: plant.genetics,
        location: plant.currentLocation?.name,
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
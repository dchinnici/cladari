/**
 * Care Prediction API Endpoint
 * Uses ML to predict optimal care schedules based on all available data
 * Integrates environmental, substrate, health, and genetic factors
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { carePredictor } from '@/lib/ml/carePredictor';

export async function POST(request: NextRequest) {
  try {
    const { plantId } = await request.json();

    if (!plantId) {
      return NextResponse.json(
        { error: 'Plant ID is required' },
        { status: 400 }
      );
    }

    // Fetch comprehensive plant data
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        location: true,
        careLogs: {
          orderBy: { date: 'desc' },
          take: 50 // Get recent history
        },
        measurements: {
          orderBy: { date: 'desc' },
          take: 10
        },
        traits: {
          orderBy: { observedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Prepare data for prediction
    const plantData = {
      id: plant.id,
      accessionNumber: plant.accessionNumber,
      healthStatus: plant.healthStatus,
      vigor: plant.vigor,
      genetics: plant.genetics || undefined,
      location: plant.location ? {
        temperature: plant.location.temperature || undefined,
        humidity: plant.location.humidity || undefined,
        dli: plant.location.dli || undefined,
        vpd: plant.location.vpd || undefined,
        co2: plant.location.co2Level || undefined
      } : undefined,
      careHistory: plant.careLogs.map(log => ({
        date: log.date,
        action: log.action,
        ecIn: log.ecIn || undefined,
        ecOut: log.ecOut || undefined,
        phIn: log.phIn || undefined,
        phOut: log.phOut || undefined,
        details: log.details
      })),
      measurements: plant.measurements.map(m => ({
        date: m.date,
        ecInput: m.ecInput || undefined,
        ecOutput: m.ecOutput || undefined,
        phInput: m.phInput || undefined,
        phOutput: m.phOutput || undefined
      })),
      traits: plant.traits.map(t => t.value)
    };

    // Generate prediction
    const prediction = await carePredictor.predictNextCare(plantData);

    // Calculate next care date
    const lastCareLog = plant.careLogs[0];
    const nextCareDate = lastCareLog
      ? new Date(lastCareLog.date.getTime() + prediction.daysUntilWater * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + prediction.daysUntilWater * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      plantId: plant.id,
      accessionNumber: plant.accessionNumber,
      prediction: {
        ...prediction,
        nextCareDate: nextCareDate.toISOString().split('T')[0],
        lastCareDate: lastCareLog?.date.toISOString().split('T')[0]
      },
      dataPoints: {
        careLogs: plant.careLogs.length,
        measurements: plant.measurements.length,
        traits: plant.traits.length
      }
    });

  } catch (error) {
    console.error('Care prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
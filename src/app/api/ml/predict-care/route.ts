/**
 * Care Prediction API Endpoint
 * Uses ML to predict optimal care schedules based on all available data
 * Integrates environmental, substrate, health, and genetic factors
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
        currentLocation: true,
        genetics: true,
        careLogs: {
          orderBy: { date: 'desc' },
          take: 50 // Get recent history
        },
        measurements: {
          orderBy: { measurementDate: 'desc' },
          take: 10
        },
        traits: {
          orderBy: { observationDate: 'desc' },
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

    // Parse EC/pH from care log details JSON
    const parseDetails = (details: string | null) => {
      if (!details) return {};
      try {
        return JSON.parse(details);
      } catch {
        return {};
      }
    };

    // Extract EC/pH from recent care logs for substrate health
    const ecphMeasurements = plant.careLogs
      .map(log => {
        const details = parseDetails(log.details);
        if (details.ecIn || details.ecOut || details.phIn || details.phOut) {
          return {
            date: log.date,
            ecInput: details.ecIn || undefined,
            ecOutput: details.ecOut || undefined,
            phInput: details.phIn || undefined,
            phOutput: details.phOut || undefined
          };
        }
        return null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // Build genetics string for the predictor
    const geneticsStr = plant.genetics
      ? [
          plant.genetics.raNumber,
          plant.genetics.ogNumber,
          plant.genetics.provenance
        ].filter(Boolean).join(' ')
      : undefined;

    // Prepare data for prediction
    const plantData = {
      id: plant.id,
      accessionNumber: plant.plantId,
      healthStatus: plant.healthStatus,
      vigor: plant.measurements[0]?.vigorScore || undefined,
      genetics: geneticsStr,
      location: plant.currentLocation ? {
        temperature: plant.currentLocation.temperature || undefined,
        humidity: plant.currentLocation.humidity || undefined,
        dli: plant.currentLocation.dli || undefined,
        vpd: plant.currentLocation.vpd || undefined,
        co2: plant.currentLocation.co2 || undefined
      } : undefined,
      careHistory: plant.careLogs.map(log => {
        const details = parseDetails(log.details);
        return {
          date: log.date,
          action: log.action,
          ecIn: details.ecIn || undefined,
          ecOut: details.ecOut || undefined,
          phIn: details.phIn || undefined,
          phOut: details.phOut || undefined,
          details: log.details
        };
      }),
      measurements: ecphMeasurements,
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
      accessionNumber: plant.plantId,
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
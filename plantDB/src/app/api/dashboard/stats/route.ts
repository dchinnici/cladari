import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { predictHealthTrajectory, ECPHReading } from '@/lib/ml/healthTrajectory'

export async function GET() {
  try {
    // === CORE COUNTS ===
    const [
      totalPlants,
      healthyPlants,
      totalCrosses,
      totalCloneBatches,
      totalSeedBatches,
      totalSeedlings
    ] = await Promise.all([
      prisma.plant.count({ where: { isArchived: { not: true } } }),
      prisma.plant.count({ where: { healthStatus: 'healthy', isArchived: { not: true } } }),
      prisma.breedingRecord.count(),
      prisma.cloneBatch.count(),
      prisma.seedBatch.count(),
      prisma.seedling.count()
    ])

    // === BREEDING PIPELINE STATS ===
    // Seed batches by status
    const seedBatchesByStatus = await prisma.seedBatch.groupBy({
      by: ['status'],
      _count: true
    })

    // Seedlings by selection status
    const seedlingsByStatus = await prisma.seedling.groupBy({
      by: ['selectionStatus'],
      _count: true
    })

    // Recent crosses (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentCrosses = await prisma.breedingRecord.count({
      where: { crossDate: { gte: thirtyDaysAgo } }
    })

    // Crosses with active germination
    const activeSeedBatches = await prisma.seedBatch.count({
      where: { status: { in: ['SOWN', 'GERMINATING'] } }
    })

    // Total seeds sown (sum of seedCount from all batches)
    const seedsStats = await prisma.seedBatch.aggregate({
      _sum: { seedCount: true, germinatedCount: true }
    })

    // Recent graduations (seedlings that became plants)
    const graduatedSeedlings = await prisma.seedling.count({
      where: { selectionStatus: 'GRADUATED' }
    })

    // === CLONE BATCH STATS ===
    // Clone batches by status
    const cloneBatchesByStatus = await prisma.cloneBatch.groupBy({
      by: ['status'],
      _count: true
    })

    // Clone batches by type
    const cloneBatchesByType = await prisma.cloneBatch.groupBy({
      by: ['propagationType'],
      _count: true
    })

    // Total clones in progress
    const totalClonesInProgress = await prisma.cloneBatch.aggregate({
      _sum: { acquiredCount: true, currentCount: true },
      where: { status: { notIn: ['COMPLETE', 'FAILED'] } }
    })

    // Recent batch activity
    const recentBatches = await prisma.cloneBatch.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        sourcePlant: {
          select: { plantId: true, hybridName: true, species: true }
        }
      }
    })

    // === PLANT HEALTH DISTRIBUTION ===
    const healthDistribution = await prisma.plant.groupBy({
      by: ['healthStatus'],
      _count: true,
      where: { isArchived: { not: true } }
    })

    // === SPECIES/SECTION DISTRIBUTION ===
    const sectionDistribution = await prisma.plant.groupBy({
      by: ['section'],
      _count: true,
      where: {
        section: { not: null },
        isArchived: { not: true }
      }
    })

    // === RECENT ACTIVITY (mixed from all sources) ===
    const activities: Array<{ description: string, date: string, type: string, timestamp: Date }> = []

    // Recent crosses
    const recentCrossRecords = await prisma.breedingRecord.findMany({
      take: 5,
      orderBy: { crossDate: 'desc' },
      include: {
        femalePlant: { select: { hybridName: true, species: true } },
        malePlant: { select: { hybridName: true, species: true } }
      }
    })
    recentCrossRecords.forEach(cross => {
      const female = cross.femalePlant.hybridName || cross.femalePlant.species || '?'
      const male = cross.malePlant.hybridName || cross.malePlant.species || '?'
      activities.push({
        description: `Cross ${cross.crossId}: ${female} × ${male}`,
        date: cross.crossDate.toLocaleDateString(),
        type: 'Breeding',
        timestamp: cross.crossDate
      })
    })

    // Recent seed batches
    const recentSeedBatches = await prisma.seedBatch.findMany({
      take: 5,
      orderBy: { sowDate: 'desc' },
      select: {
        batchId: true,
        seedCount: true,
        sowDate: true,
        status: true
      }
    })
    recentSeedBatches.forEach(batch => {
      activities.push({
        description: `Sowed ${batch.batchId} (${batch.seedCount} seeds)`,
        date: batch.sowDate.toLocaleDateString(),
        type: 'Seeds',
        timestamp: batch.sowDate
      })
    })

    // Recent clone batches
    recentBatches.forEach(batch => {
      const sourceName = batch.sourcePlant?.hybridName || batch.sourcePlant?.species || 'External'
      activities.push({
        description: `${batch.propagationType} batch ${batch.batchId} from ${sourceName}`,
        date: batch.createdAt.toLocaleDateString(),
        type: 'Clones',
        timestamp: batch.createdAt
      })
    })

    // Recent plants added
    const recentPlants = await prisma.plant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        plantId: true,
        hybridName: true,
        species: true,
        createdAt: true
      }
    })
    recentPlants.forEach(plant => {
      activities.push({
        description: `Added ${plant.hybridName || plant.species || plant.plantId}`,
        date: plant.createdAt.toLocaleDateString(),
        type: 'Plant',
        timestamp: plant.createdAt
      })
    })

    // Sort and take top 10
    const recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
      .map(({ timestamp, ...rest }) => rest)

    // === KEEPERS/HOLDBACKS COUNT ===
    const keeperCount = await prisma.seedling.count({
      where: { selectionStatus: 'KEEPER' }
    })
    const holdbackCount = await prisma.seedling.count({
      where: { selectionStatus: 'HOLDBACK' }
    })

    // === SUBSTRATE HEALTH ANALYSIS ===
    // Find plants with recent EC/pH measurements (last 60 days) to assess trends
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const plantsWithMeasurements = await prisma.plant.findMany({
      where: {
        careLogs: {
          some: {
            date: { gte: sixtyDaysAgo },
            OR: [
              { outputEC: { not: null } },
              { outputPH: { not: null } }
            ]
          }
        },
        isArchived: false
      },
      select: {
        id: true,
        plantId: true,
        lastRepotDate: true,
        careLogs: {
          where: {
            OR: [
              { outputEC: { not: null } },
              { outputPH: { not: null } }
            ]
          },
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            date: true,
            inputEC: true,
            outputEC: true,
            inputPH: true,
            outputPH: true
          }
        }
      }
    })

    // Analyze trajectories
    let substrateRiskCount = 0
    let substrateCriticalCount = 0

    // Process each plant's health trajectory
    plantsWithMeasurements.forEach(plant => {
      // Map Prisma logs to ECPHReading interface
      const readings: ECPHReading[] = plant.careLogs.map(log => ({
        date: log.date,
        ecIn: log.inputEC,
        ecOut: log.outputEC,
        phIn: log.inputPH,
        phOut: log.outputPH
      }))

      const analysis = predictHealthTrajectory(readings, plant.lastRepotDate)

      if (analysis.trajectory === 'declining') {
        substrateRiskCount++
      } else if (analysis.trajectory === 'critical') {
        substrateCriticalCount++
      }
    })

    return NextResponse.json({
      // Core counts
      totalPlants,

      healthyPlants,

      // Breeding stats
      breeding: {
        totalCrosses,
        recentCrosses,
        totalSeedBatches,
        activeSeedBatches,
        totalSeeds: seedsStats._sum.seedCount || 0,
        germinatedSeeds: seedsStats._sum.germinatedCount || 0,
        totalSeedlings,
        graduatedSeedlings,
        keeperCount,
        holdbackCount,
        seedBatchesByStatus: seedBatchesByStatus.map(s => ({
          status: s.status,
          count: s._count
        })),
        seedlingsByStatus: seedlingsByStatus.map(s => ({
          status: s.selectionStatus,
          count: s._count
        }))
      },

      // Clone batch stats
      batches: {
        totalCloneBatches,
        clonesInProgress: totalClonesInProgress._sum.currentCount || totalClonesInProgress._sum.acquiredCount || 0,
        byStatus: cloneBatchesByStatus.map(s => ({
          status: s.status,
          count: s._count
        })),
        byType: cloneBatchesByType.map(s => ({
          type: s.propagationType,
          count: s._count
        })),
        recentBatches: recentBatches.map(b => ({
          batchId: b.batchId,
          type: b.propagationType,
          status: b.status,
          count: b.currentCount || b.acquiredCount,
          source: b.sourcePlant?.hybridName || b.sourcePlant?.species || b.externalSource || 'Unknown'
        }))
      },

      // Plant distribution
      healthDistribution: healthDistribution.map(h => ({
        status: h.healthStatus || 'unknown',
        count: h._count
      })),
      substrateHealth: {
        analyzed: plantsWithMeasurements.length,
        declining: substrateRiskCount,
        critical: substrateCriticalCount,
        totalRisks: substrateRiskCount + substrateCriticalCount
      },
      sectionDistribution: sectionDistribution.map(s => ({
        name: s.section || 'Unknown',
        value: s._count
      })),

      // Activity feed
      recentActivity
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

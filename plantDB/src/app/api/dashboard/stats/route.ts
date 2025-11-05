import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isWateringEvent, isFertilizingEvent, getDaysSinceLastWatering, calculateWateringFrequency } from '@/lib/careLogUtils'

export async function GET() {
  try {
    // Basic counts
    const [totalPlants, healthyPlants, totalCrosses, totalVendors] = await Promise.all([
      prisma.plant.count(),
      prisma.plant.count({ where: { healthStatus: 'healthy' } }),
      prisma.breedingRecord.count(),
      prisma.vendor.count(),
    ])

    // Financial stats
    const financialStats = await prisma.plant.aggregate({
      _sum: { acquisitionCost: true },
      _avg: { acquisitionCost: true },
      _max: { acquisitionCost: true },
    })

    // Species distribution
    const speciesData = await prisma.plant.groupBy({
      by: ['section'],
      _count: true,
      where: {
        section: { not: null }
      }
    })

    const speciesDistribution = speciesData.map(item => ({
      name: item.section || 'Unknown',
      value: item._count
    }))

    // Top vendors
    const vendorData = await prisma.plant.groupBy({
      by: ['vendorId'],
      _count: true,
      where: {
        vendorId: { not: null }
      },
      orderBy: {
        _count: {
          vendorId: 'desc'
        }
      },
      take: 5
    })

    const vendorIds = vendorData.map(v => v.vendorId).filter(Boolean)
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds as string[] } }
    })

    const topVendors = vendorData.map(item => {
      const vendor = vendors.find(v => v.id === item.vendorId)
      return {
        name: vendor?.name || 'Unknown',
        count: item._count
      }
    })

    // Elite genetics count
    const eliteGeneticsData = await prisma.plant.groupBy({
      by: ['breederCode'],
      _count: true,
      where: {
        breederCode: {
          in: ['RA', 'OG', 'NSE', 'TZ']
        }
      }
    })

    const eliteGenetics = eliteGeneticsData.map(item => ({
      code: item.breederCode,
      count: item._count
    }))

    // Recent activity - comprehensive view of all changes
    const activities: Array<{description: string, date: string, type: string, timestamp: Date}> = []

    // Recent plants added
    const recentPlants = await prisma.plant.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        plantId: true,
        hybridName: true,
        species: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    recentPlants.forEach(plant => {
      activities.push({
        description: `Added ${plant.hybridName || plant.species || plant.plantId}`,
        date: plant.createdAt.toLocaleDateString(),
        type: 'Added',
        timestamp: plant.createdAt
      })

      // If plant was updated after creation, add an update activity
      if (plant.updatedAt.getTime() - plant.createdAt.getTime() > 1000) {
        activities.push({
          description: `Updated ${plant.hybridName || plant.species || plant.plantId}`,
          date: plant.updatedAt.toLocaleDateString(),
          type: 'Updated',
          timestamp: plant.updatedAt
        })
      }
    })

    // Recent care logs
    const recentCareLogs = await prisma.careLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        plant: {
          select: {
            plantId: true,
            hybridName: true,
            species: true
          }
        }
      }
    })

    recentCareLogs.forEach(log => {
      const plantName = log.plant.hybridName || log.plant.species || log.plant.plantId
      activities.push({
        description: `${log.action} - ${plantName}`,
        date: log.createdAt.toLocaleDateString(),
        type: 'Care Log',
        timestamp: log.createdAt
      })
    })

    // Recent measurements
    const recentMeasurements = await prisma.measurement.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        plant: {
          select: {
            plantId: true,
            hybridName: true,
            species: true
          }
        }
      }
    })

    recentMeasurements.forEach(measurement => {
      const plantName = measurement.plant.hybridName || measurement.plant.species || measurement.plant.plantId
      activities.push({
        description: `Measured ${plantName}`,
        date: measurement.createdAt.toLocaleDateString(),
        type: 'Measurement',
        timestamp: measurement.createdAt
      })
    })

    // Recent flowering cycles
    const recentFlowering = await prisma.floweringCycle.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        plant: {
          select: {
            plantId: true,
            hybridName: true,
            species: true
          }
        }
      }
    })

    recentFlowering.forEach(cycle => {
      const plantName = cycle.plant.hybridName || cycle.plant.species || cycle.plant.plantId
      activities.push({
        description: `Flowering tracked - ${plantName}`,
        date: cycle.createdAt.toLocaleDateString(),
        type: 'Flowering',
        timestamp: cycle.createdAt
      })
    })

    // Sort all activities by timestamp and take top 15
    const recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 15)
      .map(({ timestamp, ...rest }) => rest) // Remove timestamp from final output

    // Active vendors (vendors with plants added in last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const activeVendorCount = await prisma.vendor.count({
      where: {
        plants: {
          some: {
            createdAt: {
              gte: ninetyDaysAgo
            }
          }
        }
      }
    })

    // Active crosses (with F1 plants raised)
    const activeCrosses = await prisma.breedingRecord.count({
      where: {
        f1PlantsRaised: {
          gt: 0
        }
      }
    })

    // POWER FEATURES: Plants needing attention
    const plantsWithCare = await prisma.plant.findMany({
      include: {
        careLogs: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    const plantsNeedingWater = plantsWithCare.filter(plant => {
      const daysSince = getDaysSinceLastWatering(plant.careLogs)
      return daysSince === null || daysSince >= 7
    }).map(p => ({
      id: p.id,
      plantId: p.plantId,
      name: p.hybridName || p.species,
      daysSinceWater: getDaysSinceLastWatering(p.careLogs) || 999
    })).slice(0, 10)

    const plantsNeedingFertilizer = plantsWithCare.filter(plant => {
      const lastFeed = plant.careLogs.find(log => isFertilizingEvent(log.action))
      if (!lastFeed) return true
      const daysSince = Math.floor((Date.now() - new Date(lastFeed.date).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= 14
    }).slice(0, 10)

    // Health distribution
    const healthDistribution = await prisma.plant.groupBy({
      by: ['healthStatus'],
      _count: true
    })

    const healthStats = healthDistribution.map(item => ({
      status: item.healthStatus,
      count: item._count
    }))

    // Plants with no activity in 14+ days (stale plants)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const stalePlants = await prisma.plant.count({
      where: {
        updatedAt: {
          lt: fourteenDaysAgo
        }
      }
    })

    // Care frequency insights (avg days between watering across collection)
    const avgWateringFrequency = plantsWithCare
      .map(p => calculateWateringFrequency(p.careLogs))
      .filter(f => f !== null)
      .reduce((sum, freq) => sum + (freq || 0), 0) / plantsWithCare.length || 7

    // Market value insights
    const elitePlantCount = await prisma.plant.count({ where: { isEliteGenetics: true } })
    const motherPlantCount = await prisma.plant.count({ where: { isMother: true } })
    const forSaleCount = await prisma.plant.count({ where: { isForSale: true } })

    return NextResponse.json({
      // Basic stats
      totalPlants,
      healthyPlants,
      totalInvestment: financialStats._sum.acquisitionCost || 0,
      avgCost: financialStats._avg.acquisitionCost || 0,
      maxCost: financialStats._max.acquisitionCost || 0,
      totalCrosses,
      activeCrosses,
      totalVendors,
      activeVendors: activeVendorCount,

      // Distribution data
      speciesDistribution,
      healthDistribution: healthStats,
      topVendors,
      eliteGenetics,

      // Activity
      recentActivity,

      // POWER FEATURES - Today's Tasks
      plantsNeedingWater,
      plantsNeedingFertilizer,
      stalePlants,

      // Insights
      avgWateringFrequency: Math.round(avgWateringFrequency),
      elitePlantCount,
      motherPlantCount,
      forSaleCount,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Plant Diary Export API
 *
 * Returns a comprehensive export of a plant's complete history in a format
 * optimized for multiple use cases:
 * - Blockchain/Stream Protocol: Structured JSON with content hash
 * - AI Chat: Markdown narrative for pasting into Claude/ChatGPT
 * - ML/Embeddings: Pre-chunked semantic sections
 */

interface ExportEvent {
  date: string
  type: string
  summary: string
  metrics?: {
    ecIn?: number | null
    ecOut?: number | null
    phIn?: number | null
    phOut?: number | null
  }
  details?: string
}

interface ExportChunk {
  chunkType: string
  dateRange?: [string, string]
  text: string
}

// GET /api/plants/[id]/export
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const plantId = params.id

    // Fetch plant with all related data
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        currentLocation: { select: { name: true } },
        vendor: { select: { name: true } },
        femaleParent: { select: { plantId: true, hybridName: true, species: true } },
        maleParent: { select: { plantId: true, hybridName: true, species: true } },
        careLogs: {
          orderBy: { date: 'asc' },
          select: {
            id: true,
            date: true,
            action: true,
            details: true,
            inputEC: true,
            inputPH: true,
            outputEC: true,
            outputPH: true
          }
        },
        floweringCycles: {
          orderBy: { spatheEmergence: 'asc' },
          select: {
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
        },
        photos: {
          orderBy: { dateTaken: 'asc' },
          select: {
            dateTaken: true,
            photoType: true,
            growthStage: true
          }
        },
        chatLogs: {
          orderBy: { conversationDate: 'asc' },
          select: {
            conversationDate: true,
            title: true,
            displayContent: true,
            originalContent: true,
            qualityScore: true,
            confidence: true
          }
        }
      }
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    // Build structured events array
    const events: ExportEvent[] = []

    // Care logs
    plant.careLogs.forEach(log => {
      let notes = ''
      if (log.details) {
        try {
          const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
          notes = parsed.notes || ''
        } catch {
          notes = String(log.details)
        }
      }

      const hasMetrics = log.inputEC || log.outputEC || log.inputPH || log.outputPH

      events.push({
        date: new Date(log.date).toISOString().split('T')[0],
        type: log.action || 'care',
        summary: notes || log.action || 'Care event',
        ...(hasMetrics && {
          metrics: {
            ecIn: log.inputEC,
            ecOut: log.outputEC,
            phIn: log.inputPH,
            phOut: log.outputPH
          }
        })
      })
    })

    // Flowering cycles
    plant.floweringCycles.forEach(cycle => {
      if (cycle.spatheEmergence) {
        events.push({
          date: new Date(cycle.spatheEmergence).toISOString().split('T')[0],
          type: 'flowering_start',
          summary: 'Spathe emergence',
          details: cycle.notes || undefined
        })
      }
      if (cycle.femaleStart) {
        events.push({
          date: new Date(cycle.femaleStart).toISOString().split('T')[0],
          type: 'flowering_female',
          summary: 'Female phase began'
        })
      }
      if (cycle.maleStart) {
        events.push({
          date: new Date(cycle.maleStart).toISOString().split('T')[0],
          type: 'flowering_male',
          summary: `Male phase began${cycle.pollenCollected ? ' - pollen collected' : ''}`,
          details: cycle.pollenQuality ? `Pollen quality: ${cycle.pollenQuality}` : undefined
        })
      }
      if (cycle.spatheClose) {
        events.push({
          date: new Date(cycle.spatheClose).toISOString().split('T')[0],
          type: 'flowering_end',
          summary: 'Flowering cycle complete'
        })
      }
    })

    // Sort events by date
    events.sort((a, b) => a.date.localeCompare(b.date))

    // Generate markdown narrative
    const narrative = generateMarkdownNarrative(plant, events)

    // Generate pre-chunked summaries for embeddings
    const chunks = generateChunks(plant, events)

    // Build export object
    const exportData = {
      plantId: plant.plantId,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',

      // Plant identity
      identity: {
        id: plant.plantId,
        genus: plant.genus,
        species: plant.species,
        hybridName: plant.hybridName,
        section: plant.section,
        breeder: plant.breeder,
        breederCode: plant.breederCode,
        generation: plant.generation,
        accessionDate: plant.accessionDate?.toISOString().split('T')[0],
        source: plant.vendor?.name,
        femaleParent: plant.femaleParent ? `${plant.femaleParent.plantId} (${plant.femaleParent.hybridName || plant.femaleParent.species})` : null,
        maleParent: plant.maleParent ? `${plant.maleParent.plantId} (${plant.maleParent.hybridName || plant.maleParent.species})` : null
      },

      // Current status
      status: {
        health: plant.healthStatus,
        location: plant.currentLocation?.name,
        potSize: plant.currentPotSize,
        potType: plant.currentPotType,
        lastRepot: plant.lastRepotDate?.toISOString().split('T')[0]
      },

      // Statistics
      statistics: {
        totalCareEvents: plant.careLogs.length,
        totalPhotos: plant.photos.length,
        totalFloweringCycles: plant.floweringCycles.length,
        totalAIConsultations: plant.chatLogs.length,
        dateRange: events.length > 0 ? {
          first: events[0].date,
          last: events[events.length - 1].date
        } : null
      },

      // Structured events for embeddings
      events,

      // Pre-chunked for embedding pipeline
      chunks,

      // Full markdown narrative for AI chat
      narrative
    }

    // Generate content hash for blockchain verification
    const contentForHash = JSON.stringify({
      plantId: exportData.plantId,
      identity: exportData.identity,
      events: exportData.events
    })
    const contentHash = crypto.createHash('sha256').update(contentForHash).digest('hex')

    return NextResponse.json({
      ...exportData,
      contentHash: `sha256:${contentHash}`
    })

  } catch (error) {
    console.error('Error exporting plant diary:', error)
    return NextResponse.json(
      { error: 'Failed to export plant diary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Generate a markdown narrative suitable for pasting into AI chat
 */
function generateMarkdownNarrative(plant: any, events: ExportEvent[]): string {
  const lines: string[] = []

  // Header
  const name = plant.hybridName || plant.species || 'Unknown'
  lines.push(`# ${plant.plantId} - ${name}`)
  lines.push('')

  // Identity section
  lines.push('## Plant Identity')
  lines.push(`- **ID**: ${plant.plantId}`)
  if (plant.genus) lines.push(`- **Genus**: ${plant.genus}`)
  if (plant.species) lines.push(`- **Species**: ${plant.species}`)
  if (plant.hybridName) lines.push(`- **Hybrid Name**: ${plant.hybridName}`)
  if (plant.section) lines.push(`- **Section**: ${plant.section}`)
  if (plant.breeder) lines.push(`- **Breeder**: ${plant.breeder}${plant.breederCode ? ` (${plant.breederCode})` : ''}`)
  if (plant.generation) lines.push(`- **Generation**: ${plant.generation}`)
  if (plant.accessionDate) lines.push(`- **Accessioned**: ${new Date(plant.accessionDate).toLocaleDateString()}`)
  if (plant.femaleParent) lines.push(`- **Female Parent**: ${plant.femaleParent.plantId}`)
  if (plant.maleParent) lines.push(`- **Male Parent**: ${plant.maleParent.plantId}`)
  lines.push('')

  // Current status
  lines.push('## Current Status')
  lines.push(`- **Health**: ${plant.healthStatus}`)
  if (plant.currentLocation?.name) lines.push(`- **Location**: ${plant.currentLocation.name}`)
  if (plant.currentPotSize) lines.push(`- **Pot**: ${plant.currentPotSize}" ${plant.currentPotType || ''}`.trim())
  if (plant.lastRepotDate) lines.push(`- **Last Repot**: ${new Date(plant.lastRepotDate).toLocaleDateString()}`)
  lines.push('')

  // Care history
  if (events.length > 0) {
    lines.push('## Care History')
    lines.push('')

    // Group events by month
    const byMonth: Record<string, ExportEvent[]> = {}
    events.forEach(e => {
      const monthKey = e.date.substring(0, 7) // YYYY-MM
      if (!byMonth[monthKey]) byMonth[monthKey] = []
      byMonth[monthKey].push(e)
    })

    Object.entries(byMonth).forEach(([month, monthEvents]) => {
      const [year, m] = month.split('-')
      const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      lines.push(`### ${monthName}`)

      monthEvents.forEach(e => {
        const day = e.date.split('-')[2]
        let line = `- **${day}** - ${e.type.replace(/_/g, ' ')}`
        if (e.summary && e.summary !== e.type) {
          line += `: ${e.summary}`
        }
        if (e.metrics) {
          const parts: string[] = []
          if (e.metrics.ecIn) parts.push(`EC in: ${e.metrics.ecIn}`)
          if (e.metrics.phIn) parts.push(`pH in: ${e.metrics.phIn}`)
          if (e.metrics.ecOut) parts.push(`EC out: ${e.metrics.ecOut}`)
          if (e.metrics.phOut) parts.push(`pH out: ${e.metrics.phOut}`)
          if (parts.length > 0) line += ` [${parts.join(', ')}]`
        }
        lines.push(line)
      })
      lines.push('')
    })
  }

  // AI consultations summary
  if (plant.chatLogs && plant.chatLogs.length > 0) {
    lines.push('## AI Consultations')
    lines.push(`${plant.chatLogs.length} consultation(s) on record.`)
    plant.chatLogs.forEach((log: any) => {
      const date = new Date(log.conversationDate).toLocaleDateString()
      const quality = log.qualityScore !== null ? ` (Quality: ${log.qualityScore}/4)` : ''
      lines.push(`- ${date}: ${log.title || 'Consultation'}${quality}`)
    })
    lines.push('')
  }

  // Footer
  lines.push('---')
  lines.push(`*Exported from Cladari PlantDB on ${new Date().toLocaleString()}*`)

  return lines.join('\n')
}

/**
 * Generate pre-chunked text for embedding pipeline
 */
function generateChunks(plant: any, events: ExportEvent[]): ExportChunk[] {
  const chunks: ExportChunk[] = []

  // Identity chunk
  const name = plant.hybridName || plant.species || 'Unknown'
  let identityText = `Plant ${plant.plantId} is a ${plant.genus} ${plant.species || ''} ${plant.hybridName ? `'${plant.hybridName}'` : ''}`.trim()
  if (plant.section) identityText += ` from section ${plant.section}`
  if (plant.breeder) identityText += `, bred by ${plant.breeder}`
  if (plant.generation) identityText += `, ${plant.generation} generation`
  identityText += '.'

  chunks.push({
    chunkType: 'identity',
    text: identityText
  })

  // Care summary chunk
  if (events.length > 0) {
    const careEvents = events.filter(e => ['watering', 'fertilizing', 'feeding', 'repotting'].includes(e.type))
    const wateringEvents = events.filter(e => e.type === 'watering')

    let careText = `${plant.plantId} has ${events.length} recorded care events`
    if (events.length > 0) {
      careText += ` from ${events[0].date} to ${events[events.length - 1].date}`
    }
    careText += '.'

    if (wateringEvents.length >= 2) {
      // Calculate average interval
      let totalDays = 0
      for (let i = 1; i < wateringEvents.length; i++) {
        const d1 = new Date(wateringEvents[i - 1].date)
        const d2 = new Date(wateringEvents[i].date)
        totalDays += (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
      }
      const avgInterval = totalDays / (wateringEvents.length - 1)
      careText += ` Average watering interval: ${avgInterval.toFixed(1)} days.`
    }

    chunks.push({
      chunkType: 'care_summary',
      dateRange: events.length > 0 ? [events[0].date, events[events.length - 1].date] : undefined,
      text: careText
    })
  }

  // EC/pH trends chunk
  const eventsWithMetrics = events.filter(e => e.metrics && (e.metrics.ecIn || e.metrics.phIn))
  if (eventsWithMetrics.length >= 3) {
    const ecValues = eventsWithMetrics.filter(e => e.metrics?.ecIn).map(e => e.metrics!.ecIn!)
    const phValues = eventsWithMetrics.filter(e => e.metrics?.phIn).map(e => e.metrics!.phIn!)

    let metricsText = `${plant.plantId} substrate metrics: `
    if (ecValues.length > 0) {
      const avgEc = ecValues.reduce((a, b) => a + b, 0) / ecValues.length
      metricsText += `Average input EC ${avgEc.toFixed(2)}. `
    }
    if (phValues.length > 0) {
      const avgPh = phValues.reduce((a, b) => a + b, 0) / phValues.length
      metricsText += `Average input pH ${avgPh.toFixed(2)}. `
    }

    chunks.push({
      chunkType: 'substrate_metrics',
      text: metricsText.trim()
    })
  }

  // Pest/disease chunk
  const pestEvents = events.filter(e => e.type.includes('pest') || e.type.includes('disease'))
  if (pestEvents.length > 0) {
    const pestText = `${plant.plantId} pest/disease history: ${pestEvents.map(e => `${e.date} - ${e.type}: ${e.summary}`).join('; ')}`
    chunks.push({
      chunkType: 'pest_history',
      text: pestText
    })
  }

  // Flowering chunk
  const floweringEvents = events.filter(e => e.type.startsWith('flowering'))
  if (floweringEvents.length > 0) {
    const flowerText = `${plant.plantId} flowering history: ${floweringEvents.length} flowering events recorded. ${floweringEvents.map(e => `${e.date}: ${e.summary}`).join('. ')}`
    chunks.push({
      chunkType: 'flowering_history',
      text: flowerText
    })
  }

  return chunks
}

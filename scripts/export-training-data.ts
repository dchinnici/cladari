/**
 * Weekly Training Data Export Script
 *
 * Exports HITL-scored ChatLogs and NegativeExamples for fine-tuning.
 *
 * Usage:
 *   npx tsx scripts/export-training-data.ts
 *   npx tsx scripts/export-training-data.ts --since 2025-12-01
 *   npx tsx scripts/export-training-data.ts --min-quality 4
 *
 * Output:
 *   exports/training_positives_YYYY-MM-DD.jsonl
 *   exports/training_negatives_YYYY-MM-DD.jsonl
 *   exports/export_manifest.json
 */

import prisma from '../src/lib/prisma'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'

interface ExportOptions {
  since?: Date
  minQuality: number
  outputDir: string
}

interface TrainingExample {
  id: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  metadata: {
    quality: number
    chunkTypes: string[]
    plantSpecies?: string
    dateCreated: string
  }
}

interface DPOExample {
  id: string
  prompt: string
  chosen: string
  rejected: string
  failureType: string
  metadata: {
    dateCreated: string
  }
}

async function exportTrainingData(options: ExportOptions) {
  const { since, minQuality, outputDir } = options
  const dateStr = new Date().toISOString().split('T')[0]

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  console.log('\n=== Training Data Export ===\n')
  console.log(`Min quality: ${minQuality}`)
  console.log(`Since: ${since ? since.toISOString() : 'all time'}`)
  console.log(`Output: ${outputDir}\n`)

  // ─────────────────────────────────────────────
  // Export Positive Examples (HITL 3+)
  // ─────────────────────────────────────────────

  const whereClause: any = {
    qualityScore: { gte: minQuality }
  }

  if (since) {
    whereClause.createdAt = { gte: since }
  }

  const chatLogs = await prisma.chatLog.findMany({
    where: whereClause,
    include: {
      plant: {
        select: {
          species: true,
          hybridName: true,
          section: true
        }
      },
      chunks: {
        select: {
          chunkType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${chatLogs.length} high-quality ChatLogs (score >= ${minQuality})`)

  const positives: TrainingExample[] = chatLogs.map(log => {
    // Parse the conversation into messages format
    const content = log.displayContent || log.originalContent || ''

    // Build training example
    return {
      id: log.id,
      messages: [
        {
          role: 'system' as const,
          content: 'You are a botanical expert specializing in Anthurium cultivation, breeding, and diagnostics. Provide detailed, actionable advice based on the user\'s specific plant and conditions.'
        },
        {
          role: 'user' as const,
          content: `[Plant: ${log.plant.hybridName || log.plant.species || 'Unknown'}]\n\n${content.split('## AI Response')[0].trim()}`
        },
        {
          role: 'assistant' as const,
          content: content.includes('## AI Response')
            ? content.split('## AI Response')[1]?.trim() || content
            : content
        }
      ],
      metadata: {
        quality: log.qualityScore || 0,
        chunkTypes: [...new Set(log.chunks.map(c => c.chunkType))],
        plantSpecies: log.plant.species || log.plant.hybridName || undefined,
        dateCreated: log.createdAt.toISOString()
      }
    }
  })

  // Write positives JSONL
  const positivesPath = path.join(outputDir, `training_positives_${dateStr}.jsonl`)
  const positivesContent = positives.map(p => JSON.stringify(p)).join('\n')
  writeFileSync(positivesPath, positivesContent)
  console.log(`  → Wrote ${positives.length} examples to ${positivesPath}`)

  // Count by quality tier
  const tier4 = positives.filter(p => p.metadata.quality === 4).length
  const tier3 = positives.filter(p => p.metadata.quality === 3).length
  console.log(`    Gold (4): ${tier4}, Silver (3): ${tier3}`)

  // ─────────────────────────────────────────────
  // Export Negative Examples (for DPO/RLHF)
  // ─────────────────────────────────────────────

  const negativeWhere: any = {}
  if (since) {
    negativeWhere.createdAt = { gte: since }
  }

  const negatives = await prisma.negativeExample.findMany({
    where: negativeWhere,
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\nFound ${negatives.length} NegativeExamples for DPO training`)

  const dpoExamples: DPOExample[] = negatives
    .filter(n => n.correctedResponse) // Only include if we have a correction
    .map(neg => ({
      id: neg.id,
      prompt: neg.userPrompt || 'Unknown context',
      chosen: neg.correctedResponse || '',
      rejected: neg.originalContent || '',
      failureType: neg.failureType || 'unknown',
      metadata: {
        dateCreated: neg.createdAt.toISOString()
      }
    }))

  // Write negatives JSONL
  const negativesPath = path.join(outputDir, `training_negatives_${dateStr}.jsonl`)
  const negativesContent = dpoExamples.map(n => JSON.stringify(n)).join('\n')
  writeFileSync(negativesPath, negativesContent)
  console.log(`  → Wrote ${dpoExamples.length} DPO pairs to ${negativesPath}`)

  // Count by failure type
  const failureTypes = negatives.reduce((acc, n) => {
    const type = n.failureType || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log(`    Failure types:`, failureTypes)

  // ─────────────────────────────────────────────
  // Write Manifest
  // ─────────────────────────────────────────────

  const manifest = {
    exportDate: new Date().toISOString(),
    since: since?.toISOString() || null,
    minQuality,
    positives: {
      file: `training_positives_${dateStr}.jsonl`,
      count: positives.length,
      tier4Count: tier4,
      tier3Count: tier3
    },
    negatives: {
      file: `training_negatives_${dateStr}.jsonl`,
      count: dpoExamples.length,
      failureTypes
    }
  }

  const manifestPath = path.join(outputDir, 'export_manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\n  → Manifest: ${manifestPath}`)

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────

  console.log('\n=== Export Complete ===')
  console.log(`Total training examples: ${positives.length + dpoExamples.length}`)
  console.log(`  - Positive examples: ${positives.length}`)
  console.log(`  - DPO pairs: ${dpoExamples.length}`)

  await prisma.$disconnect()
}

// Parse CLI arguments
const args = process.argv.slice(2)
let since: Date | undefined
let minQuality = 3

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--since' && args[i + 1]) {
    since = new Date(args[i + 1])
    i++
  }
  if (args[i] === '--min-quality' && args[i + 1]) {
    minQuality = parseInt(args[i + 1])
    i++
  }
}

exportTrainingData({
  since,
  minQuality,
  outputDir: path.join(process.cwd(), 'exports')
}).catch(console.error)

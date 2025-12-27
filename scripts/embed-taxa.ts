/**
 * Embed Taxa Script
 *
 * Generates semantic embeddings for TaxonReference entries.
 * Creates rich text representation combining descriptions, traits, and morphometrics.
 *
 * Run with: npx tsx scripts/embed-taxa.ts
 *
 * Options:
 *   --dry-run       Show what would be processed without making changes
 *   --limit=N       Process only N taxa
 *   --skip-existing Skip taxa that already have embeddings
 *   --section=X     Only process taxa from section X
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { embedder, EmbeddingService, EMBEDDING_DIMENSION } from '../src/lib/ml/embeddings'

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const skipExisting = args.includes('--skip-existing')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const sectionArg = args.find(a => a.startsWith('--section='))
const section = sectionArg ? sectionArg.split('=')[1] : undefined

interface MeasurementRange {
  min?: number
  max?: number
  typical?: number
  unit?: string
}

/**
 * Format a measurement range for embedding text
 */
function formatMeasurement(name: string, measurement: MeasurementRange | null): string {
  if (!measurement) return ''
  const { min, max, unit = 'cm' } = measurement
  if (min !== undefined && max !== undefined) {
    return `${name}: ${min}-${max}${unit}`
  } else if (min !== undefined) {
    return `${name}: ${min}+${unit}`
  } else if (max !== undefined) {
    return `${name}: up to ${max}${unit}`
  }
  return ''
}

/**
 * Build rich text representation of a taxon for embedding
 * Combines all available data into a coherent description
 */
function buildTaxonText(taxon: any): string {
  const parts: string[] = []

  // Header with taxonomy
  const header = `Anthurium ${taxon.species}${taxon.authority ? ` ${taxon.authority}` : ''}`
  parts.push(header)

  if (taxon.section) {
    parts.push(`Section: ${taxon.section}`)
  }

  // Habit and ecology
  if (taxon.habit) {
    parts.push(`Habit: ${taxon.habit}`)
  }

  if (taxon.distribution) {
    parts.push(`Distribution: ${taxon.distribution}`)
  }

  // Morphometric summary
  const measurements: string[] = []
  measurements.push(formatMeasurement('Blade length', taxon.bladeLength as MeasurementRange))
  measurements.push(formatMeasurement('Blade width', taxon.bladeWidth as MeasurementRange))
  measurements.push(formatMeasurement('Petiole length', taxon.petioleLength as MeasurementRange))
  measurements.push(formatMeasurement('Spadix length', taxon.spadixLength as MeasurementRange))
  measurements.push(formatMeasurement('Spathe length', taxon.spatheLength as MeasurementRange))

  const validMeasurements = measurements.filter(m => m.length > 0)
  if (validMeasurements.length > 0) {
    parts.push('Morphometrics: ' + validMeasurements.join(', '))
  }

  // Color information
  const colors: string[] = []
  if (taxon.spadixColor) colors.push(`Spadix: ${taxon.spadixColor}`)
  if (taxon.spatheColor) colors.push(`Spathe: ${taxon.spatheColor}`)
  if (colors.length > 0) {
    parts.push('Colors: ' + colors.join('; '))
  }

  // Blade characteristics
  if (taxon.bladeShape) {
    parts.push(`Blade shape: ${taxon.bladeShape}`)
  }
  if (taxon.basalVeins) {
    parts.push(`Basal veins: ${taxon.basalVeins} pairs`)
  }
  if (taxon.lateralVeins) {
    parts.push(`Lateral veins: ${taxon.lateralVeins} per side`)
  }

  // Key diagnostic traits (critical for species ID)
  if (taxon.diagnosticTraits) {
    parts.push(`Diagnostic traits: ${taxon.diagnosticTraits}`)
  }

  // Full description (truncated if very long)
  if (taxon.fullDescription) {
    const desc = taxon.fullDescription.length > 2000
      ? taxon.fullDescription.slice(0, 2000) + '...'
      : taxon.fullDescription
    parts.push(`Description: ${desc}`)
  }

  // Taxonomic notes (relationships, confusion species)
  if (taxon.taxonomicNotes) {
    parts.push(`Notes: ${taxon.taxonomicNotes}`)
  }

  return parts.join('\n')
}

async function embedTaxa() {
  console.log('='.repeat(60))
  console.log('TaxonReference Embedding')
  console.log('='.repeat(60))
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Skip existing: ${skipExisting}`)
  console.log(`Limit: ${limit || 'none'}`)
  console.log(`Section filter: ${section || 'all'}`)
  console.log('')

  // Initialize embedding service
  console.log('Initializing embedding service...')
  await embedder.initialize()

  if (!embedder.isAvailable()) {
    console.error('ERROR: Embedding service not available')
    console.error('Install: npm install @xenova/transformers')
    process.exit(1)
  }
  console.log('Embedding service ready (BGE-base-en-v1.5, 768 dimensions)')
  console.log('')

  // Build where clause
  const whereClause: Prisma.TaxonReferenceWhereInput = {}

  if (section) {
    whereClause.section = { equals: section, mode: 'insensitive' }
  }

  // For skip-existing, we'd need raw SQL since Prisma can't filter on vector null
  // For now, we'll check in the loop

  const taxa = await prisma.taxonReference.findMany({
    where: whereClause,
    take: limit,
    orderBy: [
      { section: 'asc' },
      { species: 'asc' }
    ]
  })

  console.log(`Found ${taxa.length} taxa to process`)
  console.log('')

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  // Group by section for progress display
  const bySection = taxa.reduce((acc, t) => {
    const s = t.section || 'Unknown'
    if (!acc[s]) acc[s] = []
    acc[s].push(t)
    return acc
  }, {} as Record<string, typeof taxa>)

  console.log('Sections:', Object.keys(bySection).join(', '))
  console.log('')

  for (let i = 0; i < taxa.length; i++) {
    const taxon = taxa[i]
    const progress = `[${i + 1}/${taxa.length}]`

    // Check if already has embedding (via raw query)
    if (skipExisting) {
      const existing = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
        SELECT embedding IS NOT NULL as has_embedding
        FROM "TaxonReference"
        WHERE id = ${taxon.id}
      `
      if (existing[0]?.has_embedding) {
        console.log(`${progress} SKIP: ${taxon.species} (already embedded)`)
        skipCount++
        continue
      }
    }

    console.log(`${progress} ${taxon.genus} ${taxon.species}`)
    console.log(`  Section: ${taxon.section || 'Unknown'}`)

    try {
      // Build text representation
      const text = buildTaxonText(taxon)
      const textLength = text.length

      console.log(`  Text: ${textLength} chars`)

      if (textLength < 50) {
        console.log(`  SKIP: Content too short`)
        skipCount++
        continue
      }

      if (isDryRun) {
        // Show preview
        console.log(`  Preview: ${text.slice(0, 200).replace(/\n/g, ' ')}...`)
        successCount++
        continue
      }

      // Generate embedding
      const embedding = await embedder.embedDocument(text)
      console.log(`  Embedding: ${embedding.length} dimensions`)

      // Store embedding via raw query
      await prisma.$executeRaw`
        UPDATE "TaxonReference"
        SET embedding = ${Prisma.raw(`'${EmbeddingService.toPgVector(embedding)}'::vector`)}
        WHERE id = ${taxon.id}
      `

      console.log(`  ✓ Embedded`)
      successCount++

    } catch (error) {
      console.error(`  ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errorCount++
    }
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  console.log(`Taxa processed: ${successCount}`)
  console.log(`Skipped: ${skipCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes made)' : 'LIVE'}`)

  if (isDryRun) {
    console.log('')
    console.log('Run without --dry-run to apply changes')
  }
}

async function main() {
  try {
    await embedTaxa()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

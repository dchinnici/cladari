#!/usr/bin/env npx tsx
/**
 * IAS Taxon Reference Scraper
 *
 * Scrapes Anthurium species descriptions from the International Aroid Society
 * website and populates the TaxonReference table.
 *
 * Source: http://www.aroidsociety.org/genera/anthurium/
 * Based on: Croat, T.B. - A Revision of Anthurium (various monographs)
 *
 * Usage:
 *   npx tsx scripts/scrape-ias-taxa.ts                    # Full scrape
 *   npx tsx scripts/scrape-ias-taxa.ts --section cardiolonchium  # Single section
 *   npx tsx scripts/scrape-ias-taxa.ts --species papillilaminum  # Single species
 *   npx tsx scripts/scrape-ias-taxa.ts --dry-run          # Parse without saving
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_URL = 'http://www.aroidsociety.org/genera/anthurium'
const INDEX_URL = `${BASE_URL}/indpl.php`

// Parse command line args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sectionFilter = args.find((a, i) => args[i - 1] === '--section')
const speciesFilter = args.find((a, i) => args[i - 1] === '--species')
const verbose = args.includes('--verbose') || args.includes('-v')

// =============================================================================
// HTML Parsing Utilities
// =============================================================================

/**
 * Extract text content from HTML, cleaning up whitespace
 */
function cleanText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')        // Remove tags
    .replace(/&nbsp;/g, ' ')         // Replace entities
    .replace(/&amp;/g, '&')
    .replace(/&iacute;/g, 'í')
    .replace(/&eacute;/g, 'é')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/\s+/g, ' ')            // Collapse whitespace
    .trim()
}

/**
 * Extract a range of numbers like "16.5-34 cm" into structured data
 */
function parseRange(text: string, expectedUnit: string = 'cm'): { min: number, max: number, unit: string } | null {
  // Match patterns like "16.5-34 cm" or "3-13.5 mm" or "4–6 mm"
  const rangeMatch = text.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*(cm|mm|m)?/i)
  if (rangeMatch) {
    const unit = rangeMatch[3]?.toLowerCase() || expectedUnit
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
      unit
    }
  }

  // Match single value like "ca. 10 cm"
  const singleMatch = text.match(/(?:ca\.?\s*)?(\d+\.?\d*)\s*(cm|mm|m)?/i)
  if (singleMatch) {
    const val = parseFloat(singleMatch[1])
    const unit = singleMatch[2]?.toLowerCase() || expectedUnit
    return { min: val, max: val, unit }
  }

  return null
}

/**
 * Extract elevation range from text like "sea level to 100m" or "100-500 m"
 */
function parseElevation(text: string): { min: number, max: number, unit: string } | null {
  // "sea level to 100m"
  const seaLevelMatch = text.match(/sea level[^0-9]*(\d+)\s*m/i)
  if (seaLevelMatch) {
    return { min: 0, max: parseInt(seaLevelMatch[1]), unit: 'm' }
  }

  // "100-500 m" or "100 to 500 m"
  const rangeMatch = text.match(/(\d+)\s*[-–to]\s*(\d+)\s*m/i)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]), unit: 'm' }
  }

  // "less than 100 m"
  const lessThanMatch = text.match(/less than\s*(\d+)\s*m/i)
  if (lessThanMatch) {
    return { min: 0, max: parseInt(lessThanMatch[1]), unit: 'm' }
  }

  return null
}

/**
 * Extract number of veins like "4-5 pairs"
 */
function parseVeinCount(text: string): number | null {
  const match = text.match(/(\d+)[-–]?(\d+)?\s*pairs?/i)
  if (match) {
    // Return max if range, otherwise single value
    return parseInt(match[2] || match[1])
  }
  const singleMatch = text.match(/(\d+)\s*per side/i)
  if (singleMatch) {
    return parseInt(singleMatch[1])
  }
  return null
}

// =============================================================================
// Species Page Parser
// =============================================================================

interface ParsedSpecies {
  species: string
  section: string
  authority: string | null
  typeSpecimen: string | null
  typeLocality: string | null
  latinDiagnosis: string | null
  fullDescription: string | null
  diagnosticTraits: string | null

  // Measurements
  petioleLength: object | null
  petioleDiameter: object | null
  bladeLength: object | null
  bladeWidth: object | null
  bladeShape: string | null
  sinusShape: string | null
  basalVeins: number | null
  lateralVeins: number | null
  peduncleLength: object | null
  spatheLength: object | null
  spatheWidth: object | null
  spatheColor: string | null
  spadixLength: object | null
  spadixDiameter: object | null
  spadixColor: string | null
  stipeLength: object | null

  // Ecology
  habit: string | null
  elevationRange: object | null
  distribution: string | null

  // Other
  relatedSpecies: object[] | null
  taxonomicNotes: string | null
  specimenCitations: object[] | null
  images: object[] | null
  sourceUrl: string
}

async function parseSpeciesPage(html: string, url: string, section: string): Promise<ParsedSpecies | null> {
  // Extract species name and authority from title
  const titleMatch = html.match(/<TITLE>([^<]+)<\/TITLE>/i) ||
                     html.match(/<font size="\+2">([^<]+)<\/font>/i)
  if (!titleMatch) {
    console.error(`  Could not find title in page`)
    return null
  }

  const titleText = cleanText(titleMatch[1])

  // Parse "Anthurium papillilaminum Croat, sp. nov."
  const nameMatch = titleText.match(/Anthurium\s+(\w+)(?:\s+(.+))?/i)
  if (!nameMatch) {
    console.error(`  Could not parse species name from: ${titleText}`)
    return null
  }

  const species = nameMatch[1].toLowerCase()
  const authority = nameMatch[2]?.trim() || null

  // Extract TYPE specimen
  const typeMatch = html.match(/TYPE:\s*([^<]+)</i)
  const typeSpecimen = typeMatch ? cleanText(typeMatch[1]) : null

  // Extract type locality from TYPE line
  let typeLocality: string | null = null
  if (typeSpecimen) {
    const localityMatch = typeSpecimen.match(/^([^,]+(?:,\s*[^:]+)?):/)
    typeLocality = localityMatch ? localityMatch[1].trim() : null
  }

  // Extract Latin diagnosis (first <P> after TYPE that starts with lowercase Latin)
  const latinMatch = html.match(/<P>([^<]*(?:cataphyllum|plantae|terrestri|epiphy)[^<]*)<\/P>/i)
  const latinDiagnosis = latinMatch ? cleanText(latinMatch[1]) : null

  // Extract major sections
  const leavesMatch = html.match(/<B>LEAVES<\/b>([^]*?)<P><B>/i) ||
                      html.match(/<B>LEAVES<\/b>([^]*?)<\/P>\s*<P>/i)
  const infloMatch = html.match(/<B>INFLORESCENCE<\/b>([^]*?)(?:<P><B>|<P><I>Anthurium)/i)

  // Full description combines all paragraphs between TYPE and figures
  const descStart = html.indexOf('</P>', html.indexOf('TYPE:'))
  const descEnd = html.indexOf('<a name="1">')
  const descSection = descStart > 0 && descEnd > descStart
    ? html.substring(descStart, descEnd)
    : ''
  const fullDescription = cleanText(descSection).substring(0, 10000) // Limit length

  // Parse LEAVES section for measurements
  let petioleLength = null, petioleDiameter = null
  let bladeLength = null, bladeWidth = null, bladeShape = null, sinusShape = null
  let basalVeins = null, lateralVeins = null

  if (leavesMatch) {
    const leavesText = leavesMatch[1]

    // Petiole: "petioles 16.5-34 cm long, 4–6 mm diam."
    const petioleLengthMatch = leavesText.match(/petioles?\s+(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+long/i)
    if (petioleLengthMatch) {
      petioleLength = { min: parseFloat(petioleLengthMatch[1]), max: parseFloat(petioleLengthMatch[2]), unit: 'cm' }
    }
    const petioleDiamMatch = leavesText.match(/(\d+\.?\d*)\s*[-–]?\s*(\d+\.?\d*)?\s*mm\s+diam/i)
    if (petioleDiamMatch) {
      petioleDiameter = {
        min: parseFloat(petioleDiamMatch[1]),
        max: parseFloat(petioleDiamMatch[2] || petioleDiamMatch[1]),
        unit: 'mm'
      }
    }

    // Blade: "blades oblong-ovate to narrowly ovate... 25-43 cm long, 11.5-26.5 cm wide"
    const bladeLengthMatch = leavesText.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+long/i)
    if (bladeLengthMatch) {
      bladeLength = { min: parseFloat(bladeLengthMatch[1]), max: parseFloat(bladeLengthMatch[2]), unit: 'cm' }
    }
    const bladeWidthMatch = leavesText.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+wide/i)
    if (bladeWidthMatch) {
      bladeWidth = { min: parseFloat(bladeWidthMatch[1]), max: parseFloat(bladeWidthMatch[2]), unit: 'cm' }
    }

    // Blade shape: "blades oblong-ovate to narrowly ovate"
    const shapeMatch = leavesText.match(/blades?\s+([\w-]+(?:\s+to\s+[\w-]+)?)/i)
    bladeShape = shapeMatch ? shapeMatch[1] : null

    // Sinus shape: "sinus hippocrepiform to nearly triangular"
    const sinusMatch = leavesText.match(/sinus\s+([\w-]+(?:\s+to\s+[\w\s-]+)?)/i)
    sinusShape = sinusMatch ? sinusMatch[1].replace(/,.*/, '').trim() : null

    // Basal veins: "basal veins 4-5 pairs"
    const basalMatch = leavesText.match(/basal veins?\s+(\d+)[-–]?(\d+)?\s*pairs?/i)
    if (basalMatch) {
      basalVeins = parseInt(basalMatch[2] || basalMatch[1])
    }

    // Lateral veins: "primary lateral veins 3-4 per side"
    const lateralMatch = leavesText.match(/lateral veins?\s+(\d+)[-–]?(\d+)?\s*per side/i)
    if (lateralMatch) {
      lateralVeins = parseInt(lateralMatch[2] || lateralMatch[1])
    }
  }

  // Parse INFLORESCENCE section
  let peduncleLength = null, spatheLength = null, spatheWidth = null, spatheColor = null
  let spadixLength = null, spadixDiameter = null, spadixColor = null, stipeLength = null

  if (infloMatch) {
    const infloText = infloMatch[1]

    // Peduncle: "peduncle 28.5-54 cm long"
    const pedMatch = infloText.match(/peduncle[^0-9]*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+long/i)
    if (pedMatch) {
      peduncleLength = { min: parseFloat(pedMatch[1]), max: parseFloat(pedMatch[2]), unit: 'cm' }
    }

    // Spathe: "spathe ... lanceolate, 6.3-12 cm long, 0.8-1.8 cm wide"
    const spatheLengthMatch = infloText.match(/spathe[^]*?(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+long/i)
    if (spatheLengthMatch) {
      spatheLength = { min: parseFloat(spatheLengthMatch[1]), max: parseFloat(spatheLengthMatch[2]), unit: 'cm' }
    }
    const spatheWidthMatch = infloText.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+wide/i)
    if (spatheWidthMatch) {
      spatheWidth = { min: parseFloat(spatheWidthMatch[1]), max: parseFloat(spatheWidthMatch[2]), unit: 'cm' }
    }

    // Spathe color: "green tinged with red-violet"
    const spatheColorMatch = infloText.match(/spathe[^,]*,\s*([\w-]+(?:\s+(?:tinged|suffused|with)[^,;]+)?)/i)
    spatheColor = spatheColorMatch ? spatheColorMatch[1].trim() : null

    // Spadix: "spadix green (B & K Yellow-green 6/10), tapered toward apex, 3-13.5 cm long"
    const spadixColorMatch = infloText.match(/spadix\s+([\w-]+(?:\s*\([^)]+\))?)/i)
    spadixColor = spadixColorMatch ? spadixColorMatch[1] : null

    const spadixLengthMatch = infloText.match(/spadix[^]*?(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*cm\s+long/i)
    if (spadixLengthMatch) {
      spadixLength = { min: parseFloat(spadixLengthMatch[1]), max: parseFloat(spadixLengthMatch[2]), unit: 'cm' }
    }
    const spadixDiamMatch = infloText.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*mm\s+diam.*?(?:near base|at base)/i)
    if (spadixDiamMatch) {
      spadixDiameter = { min: parseFloat(spadixDiamMatch[1]), max: parseFloat(spadixDiamMatch[2]), unit: 'mm' }
    }

    // Stipe: "stipe 4-14 mm long"
    const stipeMatch = infloText.match(/stipe\s+(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*mm\s+long/i)
    if (stipeMatch) {
      stipeLength = { min: parseFloat(stipeMatch[1]), max: parseFloat(stipeMatch[2]), unit: 'mm' }
    }
  }

  // Extract habit: "Terrestrial" or "Epiphytic"
  let habit: string | null = null
  if (html.match(/\bterrestrial\b/i)) habit = 'terrestrial'
  else if (html.match(/\bepiphyt/i)) habit = 'epiphytic'
  else if (html.match(/\blithophyt/i)) habit = 'lithophytic'

  // Extract elevation from distribution paragraph
  const distMatch = html.match(/<I>Anthurium\s+\w+<\/i>\s+is known[^<]*(?:<[^>]*>[^<]*)*([^<]*(?:m\.|from|in)[^<]*)/i)
  const distText = distMatch ? cleanText(distMatch[0]) : ''
  const elevationRange = parseElevation(distText)
  const distribution = distText.replace(/Anthurium\s+\w+\s+is known\s*/i, '').trim() || null

  // Extract diagnostic comparison (paragraph that starts with "It is closest to" or similar)
  const diagMatch = html.match(/(?:is\s+closest\s+to|differs?\s+(?:from|by)|characterized\s+by)[^<]+/i)
  const diagnosticTraits = diagMatch ? cleanText(diagMatch[0]) : null

  // Extract related species mentions
  const relatedSpecies: object[] = []
  const relatedMatches = html.matchAll(/<I><a href="[^"]+">Anthurium\s+(\w+)<\/a><\/I>/gi)
  for (const match of relatedMatches) {
    relatedSpecies.push({ species: match[1].toLowerCase(), context: 'mentioned' })
  }

  // Extract taxonomic notes (the comparison paragraph)
  const taxNoteMatch = html.match(/<P>The species is a member[^]*?<\/P>/i)
  const taxonomicNotes = taxNoteMatch ? cleanText(taxNoteMatch[0]) : null

  // Extract specimen citations
  const specimenCitations: object[] = []
  const citationMatches = html.matchAll(/<P>\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:\s*,\s*,\s*(\w+\s+\d+)\s*\(([^)]+)\)/g)
  for (const match of citationMatches) {
    specimenCitations.push({
      location: match[1],
      collector: match[2],
      herbarium: match[3]
    })
  }

  // Extract images
  const images: object[] = []
  const imgMatches = html.matchAll(/<img\s+src="([^"]+)"/gi)
  for (const match of imgMatches) {
    const imgFile = match[1]
    if (imgFile.match(/\.(?:jpg|gif|png)$/i) && !imgFile.includes('home') && !imgFile.includes('prior')) {
      const imgUrl = imgFile.startsWith('http') ? imgFile : `${BASE_URL}/${section}/${imgFile}`
      images.push({ url: imgUrl, source: 'IAS' })
    }
  }

  return {
    species,
    section,
    authority,
    typeSpecimen,
    typeLocality,
    latinDiagnosis,
    fullDescription,
    diagnosticTraits,
    petioleLength,
    petioleDiameter,
    bladeLength,
    bladeWidth,
    bladeShape,
    sinusShape,
    basalVeins,
    lateralVeins,
    peduncleLength,
    spatheLength,
    spatheWidth,
    spatheColor,
    spadixLength,
    spadixDiameter,
    spadixColor,
    stipeLength,
    habit,
    elevationRange,
    distribution,
    relatedSpecies: relatedSpecies.length > 0 ? relatedSpecies : null,
    taxonomicNotes,
    specimenCitations: specimenCitations.length > 0 ? specimenCitations : null,
    images: images.length > 0 ? images : null,
    sourceUrl: url
  }
}

// =============================================================================
// HTTP Fetching
// =============================================================================

async function fetchPage(url: string): Promise<string | null> {
  try {
    // Using native fetch with a simple workaround for expired certs
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Cladari TaxonReference Scraper (botanical research)'
      }
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`  HTTP ${response.status} for ${url}`)
      return null
    }

    return await response.text()
  } catch (error: any) {
    // If SSL error, try with curl
    if (error.cause?.code === 'CERT_HAS_EXPIRED' || error.message?.includes('certificate')) {
      try {
        const { execSync } = await import('child_process')
        const result = execSync(`curl -k -s "${url}"`, { encoding: 'utf-8', timeout: 30000 })
        return result
      } catch (curlError) {
        console.error(`  Curl failed for ${url}:`, curlError)
        return null
      }
    }
    console.error(`  Fetch error for ${url}:`, error.message)
    return null
  }
}

// =============================================================================
// Main Scraper Logic
// =============================================================================

async function getSpeciesIndex(): Promise<{ section: string, path: string }[]> {
  console.log('Fetching species index from IAS...')

  const html = await fetchPage(INDEX_URL)
  if (!html) {
    throw new Error('Failed to fetch index page')
  }

  // Extract all species links
  const links: { section: string, path: string }[] = []
  const matches = html.matchAll(/href="([^"]+)\.php"/gi)

  for (const match of matches) {
    const path = match[1]
    // Skip non-species pages
    if (path.includes('content') || path.includes('spexod') || path.includes('litera') ||
        path.includes('abstract') || path.includes('distri') || path.includes('history') ||
        path.includes('key') || path.includes('scecl')) {
      continue
    }

    // Extract section from path like "cardiolonchium/papillilaminum"
    const parts = path.split('/')
    if (parts.length === 2) {
      links.push({
        section: parts[0],
        path: `${path}.php`
      })
    }
  }

  console.log(`Found ${links.length} species pages`)
  return links
}

async function scrapeAndSaveSpecies(speciesPath: string, section: string): Promise<boolean> {
  const url = `${BASE_URL}/${speciesPath}`
  console.log(`  Fetching: ${speciesPath}`)

  const html = await fetchPage(url)
  if (!html) {
    return false
  }

  const parsed = await parseSpeciesPage(html, url, section)
  if (!parsed) {
    return false
  }

  if (verbose) {
    console.log(`    Species: ${parsed.species}`)
    console.log(`    Authority: ${parsed.authority}`)
    console.log(`    Blade: ${JSON.stringify(parsed.bladeLength)} x ${JSON.stringify(parsed.bladeWidth)}`)
    console.log(`    Spadix: ${JSON.stringify(parsed.spadixLength)}`)
  }

  if (dryRun) {
    console.log(`    [DRY RUN] Would save ${parsed.species}`)
    return true
  }

  // Upsert to database
  try {
    await prisma.taxonReference.upsert({
      where: {
        genus_species_source: {
          genus: 'Anthurium',
          species: parsed.species,
          source: 'IAS'
        }
      },
      update: {
        authority: parsed.authority,
        section: parsed.section,
        typeSpecimen: parsed.typeSpecimen,
        typeLocality: parsed.typeLocality,
        latinDiagnosis: parsed.latinDiagnosis,
        fullDescription: parsed.fullDescription,
        diagnosticTraits: parsed.diagnosticTraits,
        petioleLength: parsed.petioleLength,
        petioleDiameter: parsed.petioleDiameter,
        bladeLength: parsed.bladeLength,
        bladeWidth: parsed.bladeWidth,
        bladeShape: parsed.bladeShape,
        sinusShape: parsed.sinusShape,
        basalVeins: parsed.basalVeins,
        lateralVeins: parsed.lateralVeins,
        peduncleLength: parsed.peduncleLength,
        spatheLength: parsed.spatheLength,
        spatheWidth: parsed.spatheWidth,
        spatheColor: parsed.spatheColor,
        spadixLength: parsed.spadixLength,
        spadixDiameter: parsed.spadixDiameter,
        spadixColor: parsed.spadixColor,
        stipeLength: parsed.stipeLength,
        habit: parsed.habit,
        elevationRange: parsed.elevationRange,
        distribution: parsed.distribution,
        relatedSpecies: parsed.relatedSpecies,
        taxonomicNotes: parsed.taxonomicNotes,
        specimenCitations: parsed.specimenCitations,
        images: parsed.images,
        sourceUrl: parsed.sourceUrl,
        sourcePublication: 'A Revision of Anthurium',
        sourceAuthor: 'Croat, T.B.',
        updatedAt: new Date()
      },
      create: {
        genus: 'Anthurium',
        species: parsed.species,
        authority: parsed.authority,
        section: parsed.section,
        typeSpecimen: parsed.typeSpecimen,
        typeLocality: parsed.typeLocality,
        latinDiagnosis: parsed.latinDiagnosis,
        fullDescription: parsed.fullDescription,
        diagnosticTraits: parsed.diagnosticTraits,
        petioleLength: parsed.petioleLength,
        petioleDiameter: parsed.petioleDiameter,
        bladeLength: parsed.bladeLength,
        bladeWidth: parsed.bladeWidth,
        bladeShape: parsed.bladeShape,
        sinusShape: parsed.sinusShape,
        basalVeins: parsed.basalVeins,
        lateralVeins: parsed.lateralVeins,
        peduncleLength: parsed.peduncleLength,
        spatheLength: parsed.spatheLength,
        spatheWidth: parsed.spatheWidth,
        spatheColor: parsed.spatheColor,
        spadixLength: parsed.spadixLength,
        spadixDiameter: parsed.spadixDiameter,
        spadixColor: parsed.spadixColor,
        stipeLength: parsed.stipeLength,
        habit: parsed.habit,
        elevationRange: parsed.elevationRange,
        distribution: parsed.distribution,
        relatedSpecies: parsed.relatedSpecies,
        taxonomicNotes: parsed.taxonomicNotes,
        specimenCitations: parsed.specimenCitations,
        images: parsed.images,
        source: 'IAS',
        sourceUrl: parsed.sourceUrl,
        sourcePublication: 'A Revision of Anthurium',
        sourceAuthor: 'Croat, T.B.'
      }
    })
    console.log(`    ✓ Saved ${parsed.species}`)
    return true
  } catch (error: any) {
    console.error(`    ✗ Failed to save ${parsed.species}:`, error.message)
    return false
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('  IAS Taxon Reference Scraper')
  console.log('  Source: International Aroid Society')
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be saved')
    console.log('')
  }

  try {
    // Get all species from index
    let speciesList = await getSpeciesIndex()

    // Apply filters
    if (sectionFilter) {
      console.log(`Filtering to section: ${sectionFilter}`)
      speciesList = speciesList.filter(s => s.section.toLowerCase() === sectionFilter.toLowerCase())
    }

    if (speciesFilter) {
      console.log(`Filtering to species: ${speciesFilter}`)
      speciesList = speciesList.filter(s => s.path.toLowerCase().includes(speciesFilter.toLowerCase()))
    }

    console.log(`\nProcessing ${speciesList.length} species...\n`)

    // Group by section for organized output
    const bySection = new Map<string, typeof speciesList>()
    for (const sp of speciesList) {
      const list = bySection.get(sp.section) || []
      list.push(sp)
      bySection.set(sp.section, list)
    }

    let success = 0, failed = 0

    for (const [section, species] of bySection) {
      console.log(`\n[${section.toUpperCase()}] (${species.length} species)`)

      for (const sp of species) {
        const ok = await scrapeAndSaveSpecies(sp.path, section)
        if (ok) success++
        else failed++

        // Rate limiting to be nice to IAS server
        await new Promise(r => setTimeout(r, 500))
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════════')
    console.log(`  Complete! ${success} saved, ${failed} failed`)
    console.log('═══════════════════════════════════════════════════════════════════')

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

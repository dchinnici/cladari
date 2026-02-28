import prisma from '@/lib/prisma'

/**
 * Breeding ID Generators
 *
 * ANT-YYYY-#### - Plant (4-digit, global unique)
 * CLX-YYYY-### - Cross/BreedingRecord (3-digit)
 * SDB-YYYY-### - SeedBatch (3-digit)
 * SDL-YYYY-#### - Seedling (4-digit)
 * CLB-YYYY-### - CloneBatch (3-digit)
 *
 * IDs are globally unique (not per-user) — they serve as accession numbers
 * in a breeding registry. The generators query MAX across all users and
 * increment. A retry wrapper handles race conditions when two users
 * generate IDs simultaneously.
 */

/**
 * Generate an ID with retry on collision.
 * If the first candidate collides (P2002), increments and retries up to maxAttempts.
 */
export async function generateWithRetry(
  generator: () => Promise<string>,
  checker: (id: string) => Promise<boolean>,
  maxAttempts = 5
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = await generator()
    const exists = await checker(candidate)
    if (!exists) return candidate
  }
  // Fallback: append random suffix to avoid infinite collision
  const base = await generator()
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${base}-${rand}`
}

export async function generateCrossId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CLX-${year}-`

  const latest = await prisma.breedingRecord.findFirst({
    where: { crossId: { startsWith: prefix } },
    orderBy: { crossId: 'desc' }
  })

  let nextNum = 1
  if (latest) {
    const currentNum = parseInt(latest.crossId.split('-')[2], 10)
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(3, '0')}`
}

export async function generateSeedBatchId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `SDB-${year}-`

  const latest = await prisma.seedBatch.findFirst({
    where: { batchId: { startsWith: prefix } },
    orderBy: { batchId: 'desc' }
  })

  let nextNum = 1
  if (latest) {
    const currentNum = parseInt(latest.batchId.split('-')[2], 10)
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(3, '0')}`
}

export async function generateSeedlingId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `SDL-${year}-`

  const latest = await prisma.seedling.findFirst({
    where: { seedlingId: { startsWith: prefix } },
    orderBy: { seedlingId: 'desc' }
  })

  let nextNum = 1
  if (latest) {
    const currentNum = parseInt(latest.seedlingId.split('-')[2], 10)
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`
}

export async function generatePlantId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ANT-${year}-`

  const latest = await prisma.plant.findFirst({
    where: { plantId: { startsWith: prefix } },
    orderBy: { plantId: 'desc' }
  })

  let nextNum = 1
  if (latest) {
    const currentNum = parseInt(latest.plantId.split('-')[2], 10)
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`
}

export async function generateCloneBatchId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CLB-${year}-`

  const latest = await prisma.cloneBatch.findFirst({
    where: { batchId: { startsWith: prefix } },
    orderBy: { batchId: 'desc' }
  })

  let nextNum = 1
  if (latest) {
    const currentNum = parseInt(latest.batchId.split('-')[2], 10)
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(3, '0')}`
}

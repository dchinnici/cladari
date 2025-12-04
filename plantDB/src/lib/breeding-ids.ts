import prisma from '@/lib/prisma'

/**
 * Breeding ID Generators
 *
 * CLX-YYYY-### - Cross/BreedingRecord (3-digit, starts at 001)
 * SDB-YYYY-### - SeedBatch (3-digit, starts at 001)
 * SDL-YYYY-#### - Seedling (4-digit global increment, starts at 0001)
 */

export async function generateCrossId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CLX-${year}-`

  // Find the highest existing crossId for this year
  const latest = await prisma.breedingRecord.findFirst({
    where: {
      crossId: { startsWith: prefix }
    },
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

  // Find the highest existing batchId for this year
  const latest = await prisma.seedBatch.findFirst({
    where: {
      batchId: { startsWith: prefix }
    },
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

  // Find the highest existing seedlingId for this year
  const latest = await prisma.seedling.findFirst({
    where: {
      seedlingId: { startsWith: prefix }
    },
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

  // Find the highest existing plantId for this year
  const latest = await prisma.plant.findFirst({
    where: {
      plantId: { startsWith: prefix }
    },
    orderBy: { plantId: 'desc' }
  })

  let nextNum = 1
  if (latest) {
    const currentNum = parseInt(latest.plantId.split('-')[2], 10)
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`
}

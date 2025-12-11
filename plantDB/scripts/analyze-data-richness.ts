
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Volume Counts
    const plants = await prisma.plant.count()
    const careLogs = await prisma.careLog.count()
    const journals = await prisma.plantJournal.count()
    const photos = await prisma.photo.count()
    const breedings = await prisma.breedingRecord.count()

    // 2. Richness Analysis (Text Density)
    const plantsWithNotes = await prisma.plant.count({ where: { OR: [{ notes: { not: null } }, { notes: { not: '' } }] } })

    // Sample text length
    const plantNotes = await prisma.plant.findMany({
        select: { notes: true },
        where: { notes: { not: null } },
        take: 100
    })
    const avgPlantNoteLen = plantNotes.reduce((acc, p) => acc + (p.notes?.length || 0), 0) / (plantNotes.length || 1)

    const logsWithNotes = await prisma.careLog.count({ where: { OR: [{ details: { not: null } }, { details: { not: '' } }] } })

    // 3. Trait Density
    // (Assuming 'traits' are stored in a separate table or JSON, checking separate table based on schema knowledge)
    // Checking schema for Trait model availability
    let traits = 0
    try {
        // @ts-ignore
        traits = await prisma.trait.count()
    } catch (e) {
        console.log("Trait table access error (might not exist or different name)")
    }

    console.log(JSON.stringify({
        volume: {
            plants,
            careLogs,
            journals,
            photos,
            breedings
        },
        richness: {
            plantsWithNotes,
            avgPlantNoteLen: Math.round(avgPlantNoteLen),
            logsWithNotes,
            traits
        }
    }, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })

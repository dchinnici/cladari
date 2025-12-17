import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * POST /api/print/zebra
 *
 * Sends ZPL directly to the Zebra printer.
 * One-click printing - no dialogs, no configuration.
 *
 * Body: { zpl: string } or { type: 'plant' | 'location', id: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    let zpl: string

    if (body.zpl) {
      // Raw ZPL provided
      zpl = body.zpl
    } else if (body.type === 'plant' && body.id) {
      // Generate plant label ZPL
      const { generateCompactPlantTagZPL } = await import('@/lib/zpl')
      const prisma = (await import('@/lib/prisma')).default

      const plant = await prisma.plant.findUnique({
        where: { id: body.id },
        select: { id: true, plantId: true, hybridName: true, species: true }
      })

      if (!plant) {
        return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
      }

      zpl = generateCompactPlantTagZPL({
        databaseId: plant.id,
        plantId: plant.plantId,
        name: plant.hybridName || plant.species || 'Unknown'
      })
    } else if (body.type === 'location' && body.name) {
      // Generate location label ZPL
      const { generateCompactLocationTagZPL } = await import('@/lib/zpl')
      const prisma = (await import('@/lib/prisma')).default

      const plantCount = await prisma.plant.count({
        where: { currentLocation: { name: body.name } }
      })

      zpl = generateCompactLocationTagZPL({
        name: body.name,
        plantCount
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide { zpl } or { type, id/name }' },
        { status: 400 }
      )
    }

    // Send to Zebra printer via lp command
    // Using echo with pipe to handle ZPL content safely
    const { stdout, stderr } = await execAsync(
      `echo '${zpl.replace(/'/g, "'\\''")}' | lp -d Zebra -o raw -`,
      { timeout: 10000 }
    )

    // Extract job ID from stdout (e.g., "request id is Zebra-39 (0 file(s))")
    const jobMatch = stdout.match(/request id is ([\w-]+)/)
    const jobId = jobMatch ? jobMatch[1] : 'unknown'

    return NextResponse.json({
      success: true,
      jobId,
      message: `Label sent to printer (${jobId})`
    })

  } catch (error) {
    console.error('Zebra print error:', error)
    return NextResponse.json(
      { error: 'Print failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

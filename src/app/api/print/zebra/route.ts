import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

// Print proxy URL - Tailscale Funnel exposes local print-proxy.ts to internet
const PRINT_PROXY_URL = process.env.PRINT_PROXY_URL || 'https://f1.tail2ea078.ts.net/print'

// Detect if running on Vercel (production) vs locally
const IS_VERCEL = process.env.VERCEL === '1'

/**
 * POST /api/print/zebra
 *
 * Sends ZPL directly to the Zebra printer.
 * - On Vercel: forwards to local print proxy via Tailscale
 * - Locally: uses lp command directly
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
      // Generate pot sticker ZPL (optimized for caretaker workflow)
      const { generatePotStickerZPL } = await import('@/lib/zpl')
      const prisma = (await import('@/lib/prisma')).default

      const plant = await prisma.plant.findUnique({
        where: { id: body.id },
        select: {
          id: true,
          plantId: true,
          hybridName: true,
          species: true,
          accessionDate: true,
          careLogs: {
            where: { action: 'repot' },
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true }
          }
        }
      })

      if (!plant) {
        return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
      }

      // Get last repot date if available
      const lastRepotDate = plant.careLogs[0]?.date?.toISOString() || undefined

      // Build common name - prefer hybridName, fall back to species
      const commonName = plant.hybridName || plant.species || 'Unknown'

      // Build species/cross notation - show species if different from common name
      const speciesOrCross = plant.hybridName && plant.species
        ? `A. ${plant.species}`
        : undefined

      zpl = generatePotStickerZPL({
        databaseId: plant.id,
        plantId: plant.plantId,
        commonName,
        speciesOrCross,
        accessionDate: plant.accessionDate?.toISOString(),
        repotDate: lastRepotDate
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

    let jobId: string

    if (IS_VERCEL) {
      // Production: forward to local print proxy via Tailscale
      console.log('[Print API] Forwarding to print proxy:', PRINT_PROXY_URL)

      const proxyResponse = await fetch(PRINT_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zpl }),
      })

      if (!proxyResponse.ok) {
        const error = await proxyResponse.json().catch(() => ({ error: 'Proxy unreachable' }))
        throw new Error(error.error || `Proxy returned ${proxyResponse.status}`)
      }

      const result = await proxyResponse.json()
      if (!result.success) {
        throw new Error(result.error || 'Print proxy failed')
      }

      jobId = result.jobId || 'proxy'
    } else {
      // Local development: use lp command directly
      const { stdout } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        const lp = spawn('lp', ['-d', 'Zebra', '-o', 'raw', '-'])
        let stdout = ''
        let stderr = ''

        lp.stdout.on('data', (data) => { stdout += data.toString() })
        lp.stderr.on('data', (data) => { stderr += data.toString() })

        lp.on('error', (err) => reject(err))
        lp.on('close', (code) => {
          if (code === 0) {
            resolve({ stdout, stderr })
          } else {
            reject(new Error(`lp exited with code ${code}: ${stderr}`))
          }
        })

        lp.stdin.write(zpl)
        lp.stdin.end()

        setTimeout(() => {
          lp.kill()
          reject(new Error('Print timeout after 10 seconds'))
        }, 10000)
      })

      const jobMatch = stdout.match(/request id is ([\w-]+)/)
      jobId = jobMatch ? jobMatch[1] : 'unknown'
    }

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

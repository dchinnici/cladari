import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTodayString } from '@/lib/timezone'

export async function GET() {
  try {
    // Fetch all plants with related data
    const plants = await prisma.plant.findMany({
      include: {
        currentLocation: true,
        careLogs: {
          orderBy: { date: 'desc' },
          take: 1
        },
        measurements: {
          orderBy: { measurementDate: 'desc' },
          take: 1
        }
      },
      orderBy: { plantId: 'asc' }
    })

    // CSV headers
    const headers = [
      'Plant ID',
      'Hybrid Name',
      'Species',
      'Section',
      'Cross Notation',
      'Breeder Code',
      'Breeder',
      'Generation',
      'Health Status',
      'Location',
      'Acquisition Cost',
      'Accession Date',
      'Propagation Type',
      'Is Mother',
      'For Sale',
      'Elite Genetics',
      'Market Value',
      'Last Care Date',
      'Last Care Action',
      'Latest Measurement Date',
      'Created At',
      'Updated At',
      'Notes'
    ]

    // Generate CSV rows
    const rows = plants.map(plant => {
      const notes = plant.notes ?
        (plant.notes.startsWith('{') ?
          JSON.parse(plant.notes).generalNotes || '' :
          plant.notes
        ) : ''

      return [
        plant.plantId,
        plant.hybridName || '',
        plant.species || '',
        plant.section || '',
        plant.crossNotation || '',
        plant.breederCode || '',
        plant.breeder || '',
        plant.generation || '',
        plant.healthStatus,
        plant.currentLocation?.name || '',
        plant.acquisitionCost || '',
        plant.accessionDate ? new Date(plant.accessionDate).toLocaleDateString() : '',
        plant.propagationType || '',
        plant.isMother ? 'Yes' : 'No',
        plant.isForSale ? 'Yes' : 'No',
        plant.isEliteGenetics ? 'Yes' : 'No',
        plant.marketValue || '',
        plant.careLogs[0]?.date ? new Date(plant.careLogs[0].date).toLocaleDateString() : '',
        plant.careLogs[0]?.action || '',
        plant.measurements[0]?.measurementDate ? new Date(plant.measurements[0].measurementDate).toLocaleDateString() : '',
        new Date(plant.createdAt).toLocaleDateString(),
        new Date(plant.updatedAt).toLocaleDateString(),
        notes.replace(/"/g, '""') // Escape quotes in CSV
      ]
    })

    // Build CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Return CSV with proper headers for download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cladari-plants-${getTodayString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting plants:', error)
    return NextResponse.json(
      { error: 'Failed to export plants' },
      { status: 500 }
    )
  }
}

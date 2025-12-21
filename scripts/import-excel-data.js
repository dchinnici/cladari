const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

async function importData() {
  try {
    console.log('🌿 Starting Anthurium data import...')

    // Read the Excel file
    const workbook = XLSX.readFile(path.join(__dirname, '../Anthurium_Collection_Enhanced-2.xlsx'))

    // Import Vendors first
    console.log('📦 Importing vendors...')
    const vendorSheet = workbook.Sheets['Vendor_Sources']
    const vendorData = XLSX.utils.sheet_to_json(vendorSheet)

    const vendorMap = new Map()

    for (const vendor of vendorData) {
      if (vendor['Vendor_Name']) {
        const created = await prisma.vendor.upsert({
          where: { name: vendor['Vendor_Name'] },
          update: {},
          create: {
            name: vendor['Vendor_Name'],
            type: vendor['Vendor_Type'] || 'private',
            location: vendor['Location'],
            reputationScore: parseFloat(vendor['Reputation_Score']) || null,
            specialties: JSON.stringify(vendor['Specialties'] ? vendor['Specialties'].split(',').map(s => s.trim()) : []),
            contactInfo: vendor['Contact_Info'],
            notes: vendor['Notes']
          }
        })
        vendorMap.set(vendor['Vendor_Name'], created.id)
      }
    }

    // Import Locations
    console.log('📍 Creating default locations...')
    const locations = [
      { name: 'Greenhouse A', type: 'greenhouse', zone: 'A', humidity: 80 },
      { name: 'Greenhouse B', type: 'greenhouse', zone: 'B', humidity: 75 },
      { name: 'Growth Tent 1', type: 'tent', zone: 'T1', humidity: 85 },
      { name: 'Indoor Cabinet', type: 'indoor', zone: 'IC', humidity: 70 },
    ]

    const locationMap = new Map()
    for (const loc of locations) {
      const created = await prisma.location.create({
        data: loc
      })
      locationMap.set(loc.name, created.id)
    }

    // Import Species Reference
    console.log('🔬 Importing species reference...')
    const speciesSheet = workbook.Sheets['Species_Reference']
    const speciesData = XLSX.utils.sheet_to_json(speciesSheet)

    for (const species of speciesData) {
      if (species['Species']) {
        await prisma.species.upsert({
          where: {
            genus_species: {
              genus: 'Anthurium',
              species: species['Species']
            }
          },
          update: {},
          create: {
            genus: 'Anthurium',
            species: species['Species'],
            section: species['Section'],
            conservationStatus: species['Conservation_Status'],
            nativeRange: species['Native_Range'],
            keyTraits: JSON.stringify(species['Key_Traits'] ? species['Key_Traits'].split(',').map(s => s.trim()) : [])
          }
        })
      }
    }

    // Import Plants
    console.log('🌱 Importing plants...')
    const plantSheet = workbook.Sheets['Collection_Database']
    const plantData = XLSX.utils.sheet_to_json(plantSheet)

    const plantIdMap = new Map()

    // First pass - create all plants without parent relationships
    for (const plant of plantData) {
      if (plant.Plant_ID) {
        const vendorId = plant.Source_Vendor ? vendorMap.get(plant.Source_Vendor) : null
        const locationId = plant.Current_Location ? locationMap.get(plant.Current_Location) : locationMap.get('Greenhouse A')

        const created = await prisma.plant.create({
          data: {
            plantId: plant.Plant_ID,
            accessionDate: plant.Accession_Date ? new Date(plant.Accession_Date) : new Date(),
            genus: plant.Genus || 'Anthurium',
            speciesComplex: plant.Species_Complex,
            species: plant.Hybrid_Name,
            hybridName: plant.Hybrid_Name,
            crossNotation: plant.Cross_Notation,
            generation: plant.Generation,
            breeder: plant.Breeder,
            breederCode: plant.Breeder_Code,
            vendorId: vendorId,
            acquisitionCost: parseFloat(String(plant.Acquisition_Cost)) || null,
            propagationType: plant.Propagation_Type,
            locationId: locationId,
            conservationStatus: plant.Conservation_Status,
            notes: plant.Provenance_Notes || plant.Morphology_Notes,
            tags: JSON.stringify([])
          }
        })

        plantIdMap.set(plant.Plant_ID, created.id)
        console.log(`✓ Imported ${plant.Plant_ID}: ${plant.Hybrid_Name || plant.Species_Complex}`)
      }
    }

    // Second pass - update parent relationships
    console.log('🔗 Linking parent relationships...')
    for (const plant of plantData) {
      if (plant.Plant_ID && (plant.Female_Parent_ID || plant.Male_Parent_ID)) {
        const updateData = {}

        if (plant.Female_Parent_ID && plantIdMap.has(plant.Female_Parent_ID)) {
          updateData.femaleParentId = plantIdMap.get(plant.Female_Parent_ID)
        }

        if (plant.Male_Parent_ID && plantIdMap.has(plant.Male_Parent_ID)) {
          updateData.maleParentId = plantIdMap.get(plant.Male_Parent_ID)
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.plant.update({
            where: { id: plantIdMap.get(plant.Plant_ID) },
            data: updateData
          })
        }
      }
    }

    // Import Breeding Records
    console.log('🧬 Importing breeding records...')
    const breedingSheet = workbook.Sheets['Breeding_Records']
    const breedingData = XLSX.utils.sheet_to_json(breedingSheet)

    for (const breeding of breedingData) {
      if (breeding.Cross_ID && breeding.Female_Parent_ID && breeding.Male_Parent_ID) {
        const femaleId = plantIdMap.get(breeding.Female_Parent_ID)
        const maleId = plantIdMap.get(breeding.Male_Parent_ID)

        if (femaleId && maleId) {
          await prisma.breedingRecord.create({
            data: {
              crossId: breeding.Cross_ID,
              crossDate: breeding.Cross_Date ? new Date(breeding.Cross_Date) : new Date(),
              femalePlantId: femaleId,
              malePlantId: maleId,
              crossType: breeding.Cross_Type || 'controlled',
              seedsProduced: breeding.Seeds_Produced || null,
              germinationRate: breeding.Germination_Rate || null,
              f1PlantsRaised: breeding.F1_Plants_Raised || null,
              selectionCriteria: JSON.stringify([])
            }
          })
          console.log(`✓ Imported cross ${breeding.Cross_ID}`)
        }
      }
    }

    // Generate statistics
    const stats = await prisma.plant.aggregate({
      _count: true,
      _sum: {
        acquisitionCost: true
      },
      _avg: {
        acquisitionCost: true
      },
      _max: {
        acquisitionCost: true
      }
    })

    console.log('\n📊 Import Complete!')
    console.log('=====================================')
    console.log(`Total Plants: ${stats._count}`)
    console.log(`Total Investment: $${stats._sum.acquisitionCost}`)
    console.log(`Average Cost: $${Math.round(stats._avg.acquisitionCost || 0)}`)
    console.log(`Most Expensive: $${stats._max.acquisitionCost}`)
    console.log('=====================================')

  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importData()

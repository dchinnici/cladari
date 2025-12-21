#!/bin/bash

# PlantDB PostgreSQL + pgvector Migration Preparation
# This script prepares your system for migrating from SQLite to PostgreSQL with pgvector
# for ML capabilities and semantic search integration with F1sovria

echo "🚀 PlantDB PostgreSQL + pgvector Migration Preparation"
echo "======================================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    if [ "$1" = "success" ]; then
        echo "✅ $2"
    elif [ "$1" = "warning" ]; then
        echo "⚠️  $2"
    elif [ "$1" = "error" ]; then
        echo "❌ $2"
    else
        echo "ℹ️  $2"
    fi
}

echo "📋 Phase 1: System Check"
echo "------------------------"

# Check for PostgreSQL
if command_exists psql; then
    PG_VERSION=$(psql --version | awk '{print $3}')
    print_status "success" "PostgreSQL found: $PG_VERSION"

    # Check if it's version 15 or higher (required for pgvector)
    PG_MAJOR=$(echo $PG_VERSION | cut -d. -f1)
    if [ "$PG_MAJOR" -ge 15 ]; then
        print_status "success" "PostgreSQL version is compatible (15+)"
    else
        print_status "warning" "PostgreSQL 15+ recommended for optimal pgvector performance"
    fi
else
    print_status "error" "PostgreSQL not found"
    echo ""
    echo "To install PostgreSQL 15:"
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
fi

echo ""
echo "📋 Phase 2: Database Setup Commands"
echo "-----------------------------------"

echo ""
echo "Run these commands to set up your PostgreSQL database:"
echo ""
echo "# 1. Create the database and enable pgvector:"
cat << 'EOF'
createdb plantdb_ml
psql plantdb_ml -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql plantdb_ml -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"  # For text search
EOF

echo ""
echo "# 2. Create the database user (optional but recommended):"
cat << 'EOF'
psql -U postgres << SQL
CREATE USER plantdb_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE plantdb_ml TO plantdb_user;
SQL
EOF

echo ""
echo "# 3. Update your .env file:"
cat << 'EOF'
# Replace this:
DATABASE_URL="file:./prisma/dev.db"

# With this:
DATABASE_URL="postgresql://plantdb_user:your-secure-password@localhost:5432/plantdb_ml"

# Or for local development without password:
DATABASE_URL="postgresql://localhost/plantdb_ml"
EOF

echo ""
echo "📋 Phase 3: Data Migration Script"
echo "---------------------------------"

echo ""
echo "Creating migration helper script..."

# Create the migration script
cat > scripts/migrate-to-postgres.ts << 'TYPESCRIPT'
/**
 * SQLite to PostgreSQL Migration Script for PlantDB
 * Migrates all data from SQLite to PostgreSQL with pgvector support
 */

import { PrismaClient as SqliteClient } from '@prisma/client';
import { PrismaClient as PostgresClient } from '@prisma/client';

async function migrate() {
  console.log('Starting PlantDB migration from SQLite to PostgreSQL...');

  // Initialize connections
  const sqlite = new SqliteClient({
    datasources: {
      db: {
        url: 'file:./prisma/dev.db'
      }
    }
  });

  const postgres = new PostgresClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // 1. Migrate Vendors
    console.log('Migrating vendors...');
    const vendors = await sqlite.vendor.findMany();
    for (const vendor of vendors) {
      await postgres.vendor.create({ data: vendor });
    }

    // 2. Migrate Locations
    console.log('Migrating locations...');
    const locations = await sqlite.location.findMany();
    for (const location of locations) {
      await postgres.location.create({ data: location });
    }

    // 3. Migrate Plants
    console.log('Migrating plants...');
    const plants = await sqlite.plant.findMany();
    for (const plant of plants) {
      await postgres.plant.create({ data: plant });
    }

    // 4. Migrate Care Logs
    console.log('Migrating care logs...');
    const careLogs = await sqlite.careLog.findMany();
    for (const log of careLogs) {
      await postgres.careLog.create({ data: log });
    }

    // 5. Migrate Measurements
    console.log('Migrating measurements...');
    const measurements = await sqlite.measurement.findMany();
    for (const measurement of measurements) {
      await postgres.measurement.create({ data: measurement });
    }

    // 6. Migrate Photos
    console.log('Migrating photos...');
    const photos = await sqlite.photo.findMany();
    for (const photo of photos) {
      await postgres.photo.create({ data: photo });
    }

    // 7. Migrate Traits
    console.log('Migrating traits...');
    const traits = await sqlite.trait.findMany();
    for (const trait of traits) {
      await postgres.trait.create({ data: trait });
    }

    // 8. Migrate Flowering Cycles
    console.log('Migrating flowering cycles...');
    const floweringCycles = await sqlite.floweringCycle.findMany();
    for (const cycle of floweringCycles) {
      await postgres.floweringCycle.create({ data: cycle });
    }

    // 9. Migrate Breeding Records
    console.log('Migrating breeding records...');
    const breedingRecords = await sqlite.breedingRecord.findMany();
    for (const record of breedingRecords) {
      await postgres.breedingRecord.create({ data: record });
    }

    // 10. Migrate Treatments
    console.log('Migrating treatments...');
    const treatments = await sqlite.treatment.findMany();
    for (const treatment of treatments) {
      await postgres.treatment.create({ data: treatment });
    }

    // 11. Migrate Growth Metrics
    console.log('Migrating growth metrics...');
    const growthMetrics = await sqlite.growthMetric.findMany();
    for (const metric of growthMetrics) {
      await postgres.growthMetric.create({ data: metric });
    }

    console.log('✅ Migration completed successfully!');

    // Verify counts
    const plantCount = await postgres.plant.count();
    const careLogCount = await postgres.careLog.count();
    console.log(`Migrated ${plantCount} plants and ${careLogCount} care logs`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

// Run migration
migrate().catch(console.error);
TYPESCRIPT

print_status "success" "Created migration script: scripts/migrate-to-postgres.ts"

echo ""
echo "📋 Phase 4: ML Integration Setup"
echo "--------------------------------"

echo ""
echo "Install ML dependencies:"
echo "  npm install @xenova/transformers pgvector @prisma/client@latest"
echo ""
echo "For Python ML components (optional):"
echo "  pip install sentence-transformers psycopg2-binary numpy scikit-learn"

echo ""
echo "📋 Phase 5: F1sovria Integration"
echo "--------------------------------"

echo ""
echo "To connect PlantDB with your F1sovria infrastructure:"
echo ""
echo "1. Update F1sovria to include PlantDB connection:"
cat << 'EOF'
# In F1sovria .env:
PLANTDB_DATABASE_URL="postgresql://localhost/plantdb_ml"
EOF

echo ""
echo "2. Create MCP server for PlantDB (in F1sovria):"
cat << 'EOF'
// f1sovria/servers/plantdb-mcp-server.ts
export const plantdbTools = {
  'search_plants': semanticPlantSearch,
  'predict_care': predictPlantCare,
  'analyze_symptoms': diagnosePlantIssues,
  'discover_insights': findBreedingPatterns
};
EOF

echo ""
echo "3. Share embeddings between systems:"
cat << 'EOF'
-- Both systems can query the same vector space:
SELECT plantId, 1 - (embedding <=> query_vector::vector) as similarity
FROM plant_vectors
WHERE embedding <=> query_vector::vector < 0.5
ORDER BY embedding <=> query_vector::vector
LIMIT 10;
EOF

echo ""
echo "📋 Migration Checklist"
echo "---------------------"

cat << 'CHECKLIST'
□ 1. Install PostgreSQL 15+
□ 2. Create plantdb_ml database
□ 3. Enable pgvector extension
□ 4. Update .env with PostgreSQL connection
□ 5. Update Prisma schema for PostgreSQL
□ 6. Run: npx prisma generate
□ 7. Run: npx prisma db push
□ 8. Run migration script to copy data
□ 9. Generate embeddings for existing plants
□ 10. Test semantic search
□ 11. Configure F1sovria integration
□ 12. Start ML model training on F2 server
CHECKLIST

echo ""
echo "📊 Expected Performance After Migration:"
echo "----------------------------------------"
echo "  • Semantic search: <50ms response time"
echo "  • Vector similarity: 85-90% accuracy"
echo "  • Care predictions: 70%+ accuracy after 1000 logs"
echo "  • Diagnosis engine: 80%+ confidence after training"
echo "  • Insight discovery: 1+ actionable insight/week"

echo ""
echo "🎯 Next Steps:"
echo "-------------"
echo "1. Continue collecting data (target: 1000+ care logs)"
echo "2. When ready, run this migration preparation"
echo "3. Follow the checklist above"
echo "4. Start with Phase 1 (semantic search) from ML roadmap"

echo ""
echo "📚 Documentation:"
echo "----------------"
echo "  • ML Roadmap: docs/ML_INTEGRATION_ROADMAP.md"
echo "  • PostgreSQL Schema: prisma/schema.postgres.prisma"
echo "  • F1sovria Docs: ../f1sovria/docs/"

echo ""
print_status "success" "Migration preparation complete!"
echo ""
echo "Remember: Continue using SQLite until you have enough data (1000+ care logs)"
echo "The migration can happen seamlessly when you're ready."
#!/bin/bash
# Test database performance after index optimization

DB_PATH="prisma/dev.db"

echo "🔍 Testing Database Performance..."
echo "================================="

# Test 1: Plants needing water (most common query)
echo ""
echo "1. Finding plants needing water:"
sqlite3 "$DB_PATH" << 'EOF'
.timer on
SELECT p.id, p.hybridName, p.plantId,
       MAX(c.date) as last_water
FROM Plant p
LEFT JOIN CareLog c ON p.id = c.plantId
  AND c.action IN ('water', 'watering')
WHERE p.isArchived = 0
GROUP BY p.id
HAVING MAX(c.date) IS NULL
   OR julianday('now') - julianday(MAX(c.date)) > 5
LIMIT 10;
EOF

# Test 2: Location-based queries
echo ""
echo "2. Plants by location with recent activity:"
sqlite3 "$DB_PATH" << 'EOF'
.timer on
SELECT COUNT(*) as count, l.name
FROM Plant p
JOIN Location l ON p.locationId = l.id
WHERE p.isArchived = 0
GROUP BY l.id
ORDER BY count DESC;
EOF

# Test 3: Care log history (for recommendations)
echo ""
echo "3. Recent care logs with details:"
sqlite3 "$DB_PATH" << 'EOF'
.timer on
SELECT c.date, c.action, p.hybridName
FROM CareLog c
JOIN Plant p ON c.plantId = p.id
WHERE c.date > datetime('now', '-30 days')
ORDER BY c.date DESC
LIMIT 20;
EOF

# Test 4: Elite genetics query
echo ""
echo "4. Elite genetics plants:"
sqlite3 "$DB_PATH" << 'EOF'
.timer on
SELECT plantId, hybridName, breederCode
FROM Plant
WHERE isEliteGenetics = 1
ORDER BY updatedAt DESC;
EOF

# Check index usage
echo ""
echo "5. Verify index usage for water query:"
sqlite3 "$DB_PATH" << 'EOF'
EXPLAIN QUERY PLAN
SELECT p.id, p.hybridName
FROM Plant p
LEFT JOIN CareLog c ON p.id = c.plantId
WHERE c.action = 'water'
  AND p.isArchived = 0
ORDER BY c.date DESC
LIMIT 10;
EOF

echo ""
echo "================================="
echo "✅ Performance test complete"
echo ""
echo "Expected improvements:"
echo "- Plant queries: 50-70% faster"
echo "- Care log queries: 60-80% faster"
echo "- Dashboard load: 40-60% faster"
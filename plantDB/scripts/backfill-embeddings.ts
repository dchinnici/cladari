/**
 * Backfill Embeddings Script
 *
 * Processes existing ChatLogs to:
 * 1. Chunk content into semantic pieces
 * 2. Generate embeddings using e5-base-v2
 * 3. Insert ChatLogChunks with embeddings
 *
 * Run with: npx tsx scripts/backfill-embeddings.ts
 *
 * Options:
 *   --dry-run     Show what would be processed without making changes
 *   --limit=N     Process only N ChatLogs
 *   --skip-existing  Skip ChatLogs that already have chunks
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { chunkContent, getDisplayContent, summarizeChunk, ChatChunk } from '../src/lib/ml/chunker'
import { embedder, EmbeddingService, EMBEDDING_DIMENSION } from '../src/lib/ml/embeddings'

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const skipExisting = args.includes('--skip-existing')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

interface Message {
  role: string
  content: string
}

async function backfillEmbeddings() {
  console.log('='.repeat(60))
  console.log('ChatLog Embedding Backfill')
  console.log('='.repeat(60))
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Skip existing: ${skipExisting}`)
  console.log(`Limit: ${limit || 'none'}`)
  console.log('')

  // Initialize embedding service
  console.log('Initializing embedding service...')
  await embedder.initialize()

  if (!embedder.isAvailable()) {
    console.error('ERROR: Embedding service not available')
    console.error('Install: npm install @xenova/transformers')
    process.exit(1)
  }
  console.log('Embedding service ready (e5-base-v2, 768 dimensions)')
  console.log('')

  // Fetch ChatLogs that need processing
  const whereClause: Prisma.ChatLogWhereInput = {}

  if (skipExisting) {
    whereClause.chunks = { none: {} }
  }

  const chatLogs = await prisma.chatLog.findMany({
    where: whereClause,
    take: limit,
    include: {
      plant: {
        select: { plantId: true, hybridName: true }
      },
      chunks: {
        select: { id: true }
      }
    },
    orderBy: { conversationDate: 'desc' }
  })

  console.log(`Found ${chatLogs.length} ChatLogs to process`)
  console.log('')

  let totalChunks = 0
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < chatLogs.length; i++) {
    const chatLog = chatLogs[i]
    const progress = `[${i + 1}/${chatLogs.length}]`

    console.log(`${progress} Processing ChatLog ${chatLog.id}`)
    console.log(`  Plant: ${chatLog.plant.plantId} (${chatLog.plant.hybridName || 'unnamed'})`)
    console.log(`  Date: ${chatLog.conversationDate.toISOString().split('T')[0]}`)
    console.log(`  Existing chunks: ${chatLog.chunks.length}`)

    try {
      // Get the content to chunk
      const messages = chatLog.messages as unknown as Message[]
      const content = getDisplayContent(
        chatLog.displayContent,
        chatLog.originalContent,
        messages
      )

      if (!content || content.length < 50) {
        console.log(`  SKIP: Content too short (${content?.length || 0} chars)`)
        continue
      }

      // Chunk the content
      const chunks = chunkContent(content)
      console.log(`  Found ${chunks.length} chunks`)

      if (chunks.length === 0) {
        console.log(`  SKIP: No chunks generated`)
        continue
      }

      if (isDryRun) {
        for (const chunk of chunks) {
          console.log(`    - [${chunk.chunkType}] ${chunk.header || '(no header)'}: ${chunk.content.slice(0, 50)}...`)
        }
        totalChunks += chunks.length
        successCount++
        continue
      }

      // Delete existing chunks if any (for re-processing)
      if (chatLog.chunks.length > 0) {
        await prisma.chatLogChunk.deleteMany({
          where: { chatLogId: chatLog.id }
        })
        console.log(`  Deleted ${chatLog.chunks.length} existing chunks`)
      }

      // Generate embeddings and create chunks
      for (const chunk of chunks) {
        const embedding = await embedder.embedDocument(chunk.content)
        const summary = summarizeChunk(chunk)

        // Use raw query to insert with embedding vector
        await prisma.$executeRaw`
          INSERT INTO "ChatLogChunk" (
            id, "chatLogId", "chunkIndex", "chunkType", content, summary,
            embedding, "retrievalWeight", "createdAt"
          ) VALUES (
            ${`clc_${Date.now()}_${chunk.chunkIndex}`},
            ${chatLog.id},
            ${chunk.chunkIndex},
            ${chunk.chunkType},
            ${chunk.content},
            ${summary},
            ${Prisma.raw(`'${EmbeddingService.toPgVector(embedding)}'::vector`)},
            ${chatLog.retrievalWeight},
            NOW()
          )
        `

        console.log(`    + [${chunk.chunkType}] ${chunk.header || '(no header)'} (${embedding.length}d)`)
        totalChunks++
      }

      // Also embed the full ChatLog content
      const fullEmbedding = await embedder.embedDocument(content.slice(0, 8000)) // Truncate for embedding
      await prisma.$executeRaw`
        UPDATE "ChatLog"
        SET embedding = ${Prisma.raw(`'${EmbeddingService.toPgVector(fullEmbedding)}'::vector`)}
        WHERE id = ${chatLog.id}
      `
      console.log(`  Full ChatLog embedded`)

      successCount++

    } catch (error) {
      console.error(`  ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errorCount++
    }

    console.log('')
  }

  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  console.log(`ChatLogs processed: ${successCount}`)
  console.log(`Chunks created: ${totalChunks}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes made)' : 'LIVE'}`)

  if (isDryRun) {
    console.log('')
    console.log('Run without --dry-run to apply changes')
  }
}

async function main() {
  try {
    await backfillEmbeddings()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

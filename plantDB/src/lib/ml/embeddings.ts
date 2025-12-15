/**
 * Embedding Service for PlantDB
 * Generates 768-dimensional semantic embeddings for pgvector search
 *
 * Uses e5-base-v2 (intfloat/e5-base-v2) which requires:
 * - Query prefix: "query: " for search queries
 * - Passage prefix: "passage: " for documents being indexed
 *
 * Implements via @xenova/transformers for browser/edge compatibility
 * Install with: npm install @xenova/transformers
 */

type Pipeline = any;

export const EMBEDDING_DIMENSION = 768;

export class EmbeddingService {
  private encoder: Pipeline | null = null;
  // Xenova namespace has pre-converted ONNX models for JavaScript
  // bge-base-en-v1.5 is 768 dimensions - matches our schema
  private modelName = 'Xenova/bge-base-en-v1.5';
  private transformersAvailable = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Prevent multiple concurrent initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.encoder) {
      return;
    }

    this.initPromise = (async () => {
      try {
        // Dynamic import to avoid build errors when dependency not installed
        console.log('Loading @xenova/transformers...');
        const transformers = await import('@xenova/transformers');
        console.log('Transformers loaded, initializing e5-base-v2 model...');
        console.log('(First run downloads ~400MB model - this may take a few minutes)');
        this.encoder = await transformers.pipeline('feature-extraction', this.modelName);
        this.transformersAvailable = true;
        console.log('Embedding model initialized successfully');
      } catch (e: unknown) {
        const error = e as Error;
        console.warn('Embedding service unavailable:', error.message);
        if (error.message?.includes('Cannot find module')) {
          console.warn('Install with: npm install @xenova/transformers');
        } else {
          console.warn('Full error:', error);
        }
        this.transformersAvailable = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check if embedding service is available
   */
  isAvailable(): boolean {
    return this.transformersAvailable && this.encoder !== null;
  }

  /**
   * Generate embedding for a document/passage (for indexing)
   * BGE models don't require prefixes for general use
   */
  async embedDocument(text: string): Promise<number[]> {
    await this.initialize();
    if (!this.encoder) {
      throw new Error('Embedding service not available - install @xenova/transformers');
    }

    const output = await this.encoder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  /**
   * Generate embedding for a search query
   * BGE models work well without prefixes for semantic similarity
   */
  async embedQuery(query: string): Promise<number[]> {
    await this.initialize();
    if (!this.encoder) {
      throw new Error('Embedding service not available - install @xenova/transformers');
    }

    const output = await this.encoder(query, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  /**
   * Batch embed multiple documents (more efficient than one-by-one)
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    await this.initialize();
    if (!this.encoder) {
      throw new Error('Embedding service not available - install @xenova/transformers');
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
      const output = await this.encoder(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }
    return embeddings;
  }

  /**
   * Generate trait embeddings for semantic search
   * Combines multiple trait descriptors into a single embedding
   */
  async generateTraitEmbedding(traits: string[]): Promise<number[]> {
    const text = traits.join(' ');
    return this.embedDocument(text);
  }

  /**
   * Generate care pattern embeddings
   * Encodes care history and patterns for similarity matching
   */
  async generateCareEmbedding(careData: {
    frequency: number;
    lastEC?: number;
    lastPH?: number;
    fertilizer?: string;
    healthStatus?: string;
  }): Promise<number[]> {
    const careText = [
      `watering frequency ${careData.frequency} days`,
      careData.lastEC ? `EC ${careData.lastEC}` : '',
      careData.lastPH ? `pH ${careData.lastPH}` : '',
      careData.fertilizer || '',
      careData.healthStatus || ''
    ].filter(Boolean).join(' ');

    return this.embedDocument(careText);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Format embedding for Prisma raw query (pgvector format)
   * Returns string like "[0.1,0.2,0.3,...]"
   */
  static toPgVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Parse pgvector string back to number array
   */
  static fromPgVector(pgVector: string): number[] {
    return JSON.parse(pgVector.replace(/^\[/, '[').replace(/\]$/, ']'));
  }
}

export const embedder = new EmbeddingService();

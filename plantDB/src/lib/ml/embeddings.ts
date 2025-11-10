/**
 * Embedding Service for PlantDB
 * Generates semantic embeddings for plants, traits, and care patterns
 * Uses sentence-transformers compatible with F1sovria infrastructure
 */

import { pipeline, Pipeline } from '@xenova/transformers';

export class EmbeddingService {
  private encoder: Pipeline | null = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2'; // 384-dimensional, matches F1sovria

  async initialize() {
    if (!this.encoder) {
      console.log('Initializing embedding model...');
      this.encoder = await pipeline('feature-extraction', this.modelName);
    }
  }

  /**
   * Generate trait embeddings for semantic search
   * Combines multiple trait descriptors into a single embedding
   */
  async generateTraitEmbedding(traits: string[]): Promise<number[]> {
    await this.initialize();
    const text = traits.join(' ');
    const output = await this.encoder!(text);
    return Array.from(output.data);
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
    await this.initialize();

    const careText = [
      `watering frequency ${careData.frequency} days`,
      careData.lastEC ? `EC ${careData.lastEC}` : '',
      careData.lastPH ? `pH ${careData.lastPH}` : '',
      careData.fertilizer || '',
      careData.healthStatus || ''
    ].filter(Boolean).join(' ');

    const output = await this.encoder!(careText);
    return Array.from(output.data);
  }

  /**
   * Generate query embedding for semantic search
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    await this.initialize();
    const output = await this.encoder!(query);
    return Array.from(output.data);
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
}

export const embedder = new EmbeddingService();
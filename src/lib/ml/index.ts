/**
 * ML Module Index
 *
 * PlantDB Machine Learning System
 * Hybrid statistical analysis + LLM interpretation
 */

// Core statistical functions
export {
  calculateEWMA,
  calculateTimeWeightedEWMA,
  linearRegression,
  detectTrend,
  detectAnomaly,
  detectAnomalies,
  calculateSeasonality,
  predictValue,
  calculateConfidenceInterval,
  movingAverage,
  standardDeviation,
  percentile,
  calculateModelConfidence,
  type DataPoint,
  type TrendResult,
  type AnomalyResult,
  type SeasonalityResult,
  type RegressionStats
} from './statisticalAnalyzer'

// Watering prediction
export {
  predictWateringInterval,
  analyzeWateringHistory,
  type CareEvent,
  type EnvironmentalData,
  type WateringPrediction,
  type WateringFactor
} from './wateringPredictor'

// Health trajectory analysis
export {
  predictHealthTrajectory,
  calculateSubstrateHealthScore,
  detectReadingAnomalies,
  generateHealthSummary,
  type ECPHReading,
  type HealthTrajectoryResult,
  type RiskFactor,
  type HealthAlert
} from './healthTrajectory'

// Flowering prediction
export {
  predictFloweringCycle,
  findPollinationPartners,
  generateFloweringSummary,
  type FloweringCycle,
  type FloweringPrediction,
  type FloweringStatistics
} from './floweringPredictor'

// Embedding service (pgvector)
export {
  embedder,
  EmbeddingService,
  EMBEDDING_DIMENSION
} from './embeddings'

// ChatLog chunking
export {
  chunkContent,
  extractContentFromMessages,
  getDisplayContent,
  summarizeChunk,
  type ChatChunk,
  type ChunkType
} from './chunker'

/**
 * ChatLog Chunking Utility
 * Parses AI consultation content into semantic chunks for granular retrieval
 *
 * Chunks are split on markdown ## headers, with chunk types inferred from content.
 * This enables precise retrieval of specific analysis types (damage, care, etc.)
 */

export interface ChatChunk {
  chunkIndex: number;
  chunkType: ChunkType;
  content: string;
  header?: string;  // Original header text if present
}

export type ChunkType =
  | 'damage_analysis'      // Damage assessment, pest/disease identification
  | 'care_analysis'        // Care recommendations, watering/feeding advice
  | 'environmental'        // Environmental conditions, light/humidity/temp
  | 'recommendation'       // Specific action recommendations
  | 'observation'          // Visual observations, morphology notes
  | 'diagnosis'            // Health diagnosis, problem identification
  | 'breeding'             // Breeding-related discussion, crosses, genetics
  | 'history'              // Plant history, timeline, provenance
  | 'general';             // Default/uncategorized

// Keywords for chunk type inference
const CHUNK_TYPE_PATTERNS: Record<ChunkType, RegExp[]> = {
  damage_analysis: [
    /damage/i, /pest/i, /disease/i, /infection/i, /rot/i,
    /spider.?mite/i, /thrip/i, /aphid/i, /mealy/i, /scale/i,
    /necrosis/i, /lesion/i, /spotting/i, /yellowing/i, /browning/i
  ],
  care_analysis: [
    /water/i, /feed/i, /fertil/i, /nutrient/i, /ec/i, /ph/i,
    /care/i, /maintenance/i, /schedule/i, /routine/i
  ],
  environmental: [
    /environment/i, /humidity/i, /temperature/i, /light/i,
    /vpd/i, /dli/i, /airflow/i, /ventilation/i, /climate/i
  ],
  recommendation: [
    /recommend/i, /suggest/i, /should/i, /next.?step/i,
    /action/i, /plan/i, /treatment/i, /immediate/i
  ],
  observation: [
    /observ/i, /note/i, /appear/i, /looks?/i, /visual/i,
    /morpholog/i, /feature/i, /characteristic/i
  ],
  diagnosis: [
    /diagnos/i, /assess/i, /evaluat/i, /condition/i,
    /health/i, /status/i, /prognosis/i, /issue/i, /problem/i
  ],
  breeding: [
    /breed/i, /cross/i, /pollin/i, /genetic/i, /lineage/i,
    /hybrid/i, /offspring/i, /parent/i, /F1/i, /seedling/i
  ],
  history: [
    /history/i, /timeline/i, /provenance/i, /origin/i,
    /acquisition/i, /previous/i, /background/i
  ],
  general: []
};

/**
 * Infer chunk type from content and optional header
 */
function inferChunkType(content: string, header?: string): ChunkType {
  const textToAnalyze = header ? `${header} ${content}` : content;

  // Check each type's patterns
  for (const [type, patterns] of Object.entries(CHUNK_TYPE_PATTERNS)) {
    if (type === 'general') continue;

    for (const pattern of patterns) {
      if (pattern.test(textToAnalyze)) {
        return type as ChunkType;
      }
    }
  }

  return 'general';
}

/**
 * Parse AI response content into semantic chunks
 *
 * Splits on markdown ## headers. Each header starts a new chunk.
 * Content before first header becomes chunk 0.
 */
export function chunkContent(content: string): ChatChunk[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const chunks: ChatChunk[] = [];

  // Split on ## headers (keeping the header with the content)
  // Pattern: Match ## at start of line, capture everything until next ## or end
  const sections = content.split(/(?=^## )/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // Check if section starts with ## header
    const headerMatch = section.match(/^## (.+?)(?:\n|$)/);

    let header: string | undefined;
    let chunkContent: string;

    if (headerMatch) {
      header = headerMatch[1].trim();
      chunkContent = section.slice(headerMatch[0].length).trim();
    } else {
      chunkContent = section;
    }

    // Skip empty chunks
    if (!chunkContent) continue;

    const chunkType = inferChunkType(chunkContent, header);

    chunks.push({
      chunkIndex: chunks.length,
      chunkType,
      content: chunkContent,
      header
    });
  }

  return chunks;
}

/**
 * Extract content from ChatLog messages for chunking
 * Takes the last assistant message as the primary content
 */
export function extractContentFromMessages(messages: { role: string; content: string }[]): string {
  if (!Array.isArray(messages)) {
    return '';
  }

  // Find the last assistant message
  const lastAssistant = [...messages]
    .reverse()
    .find(m => m.role === 'assistant');

  return lastAssistant?.content || '';
}

/**
 * Get the display content for a ChatLog
 * Prefers displayContent (user-edited) over originalContent
 */
export function getDisplayContent(
  displayContent: string | null | undefined,
  originalContent: string | null | undefined,
  messages?: { role: string; content: string }[]
): string {
  if (displayContent) return displayContent;
  if (originalContent) return originalContent;
  if (messages) return extractContentFromMessages(messages);
  return '';
}

/**
 * Create a summary for a chunk (first ~200 chars with context)
 */
export function summarizeChunk(chunk: ChatChunk, maxLength = 200): string {
  const prefix = chunk.header ? `[${chunk.header}] ` : '';
  const content = chunk.content.replace(/\n+/g, ' ').trim();

  if (prefix.length + content.length <= maxLength) {
    return prefix + content;
  }

  return prefix + content.slice(0, maxLength - prefix.length - 3) + '...';
}

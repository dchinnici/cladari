import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';
import { readFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 30;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to load image as base64
async function loadImageAsBase64(imagePath: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    // Photos are stored in public/uploads/photos/
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    const buffer = await readFile(fullPath);
    const base64 = buffer.toString('base64');

    // Determine mime type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    return { base64, mimeType };
  } catch (error) {
    console.error(`Failed to load image: ${imagePath}`, error);
    return null;
  }
}

export async function POST(req: Request) {
  const { messages, plantContext, photoMode = 'recent' } = await req.json();

  // NOTE: We must load and attach images on EVERY request because Claude's API is stateless.
  // The conversation history sent to Claude is just text - images aren't cached server-side.
  // This means comprehensive mode (20 photos) costs ~30K tokens per message.
  // Future optimization: could cache base64 on client and skip re-reading from disk.

  // Debug logging
  console.log('[Chat API] photoMode:', photoMode);
  console.log('[Chat API] plantContext.photos count:', plantContext?.photos?.length || 0);

  // Build system prompt with plant context if available
  let systemPrompt = `You are Cladari, an advanced botanical AI assistant for a professional Anthurium breeding facility.

You have deep knowledge of Anthurium taxonomy, care, and breeding. You're speaking to a master breeder, so:
- Be professional, precise, and scientifically accurate
- Avoid basic beginner advice unless explicitly asked
- Focus on provenance, genetics, and data-driven insights
- Use proper botanical terminology

Key Anthurium sections:
- Cardiolonchium: Velvet-leaved species (crystallinum, magnificum, warocqueanum, papillilaminum, forgetii, regale)
- Porphyrochitonium: Small-leaved species
- Xialophyllum: Strap-leaved species (wendlingerii)
- Pachyneurium: Birdsnest types

Breeder codes:
- RA, OG = Regional lineage indicators
- TZ = Tezula Plants
- SC = Scott Cohen
- NSE = NSE Tropicals
- SKG = Silver Krome Gardens

Environmental parameters:
- EC: Electrical conductivity (target 1.0-1.2 mS/cm for input)
- pH: Target 5.8-6.2 for input
- VPD: Vapor pressure deficit (optimal 0.8-1.2 kPa for anthuriums)
- DLI: Daily Light Integral (target 10-16 mol/m²/day)`;

  // Load photos based on mode
  let photoDescriptions: string[] = [];
  const imageContents: Array<{ type: 'image'; image: string; mimeType: string }> = [];

  if (plantContext?.photos && plantContext.photos.length > 0) {
    let photosToProcess: typeof plantContext.photos = [];

    // Sort all photos by date descending (most recent first)
    const sortedPhotos = [...plantContext.photos].sort((a: any, b: any) =>
      new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()
    );

    if (photoMode === 'comprehensive') {
      // Comprehensive mode: all photos (up to 20 to avoid extreme token usage)
      photosToProcess = sortedPhotos.slice(0, 20);
    } else {
      // Recent mode: get the 3 most recent photos regardless of date
      // This gives context across recent sessions without excessive token cost
      photosToProcess = sortedPhotos.slice(0, 3);
    }

    console.log('[Chat API] Photos to process:', photosToProcess.length);

    for (const photo of photosToProcess) {
      console.log('[Chat API] Loading photo:', photo.url);
      const imageData = await loadImageAsBase64(photo.url);
      if (imageData) {
        imageContents.push({
          type: 'image',
          image: imageData.base64,
          mimeType: imageData.mimeType
        });
        const photoInfo = [
          photo.photoType && `Type: ${photo.photoType}`,
          photo.dateTaken && `Date: ${new Date(photo.dateTaken).toLocaleDateString()}`,
          photo.notes && `Notes: ${photo.notes}`
        ].filter(Boolean).join(', ');
        photoDescriptions.push(photoInfo || 'Photo');
        console.log('[Chat API] Successfully loaded photo', imageContents.length);
      } else {
        console.log('[Chat API] Failed to load photo:', photo.url);
      }
    }

    console.log('[Chat API] Total photos loaded:', imageContents.length);
  }

  if (plantContext) {
    // Format care logs for context
    let careLogSummary = '';
    if (plantContext.careLogs && plantContext.careLogs.length > 0) {
      const recentLogs = plantContext.careLogs.slice(0, 10);
      careLogSummary = recentLogs.map((log: any) => {
        const date = new Date(log.date).toLocaleDateString();
        const parts = [];
        if (log.action) parts.push(log.action);
        if (log.inputEC) parts.push(`EC in: ${log.inputEC}`);
        if (log.outputEC) parts.push(`EC out: ${log.outputEC}`);
        if (log.inputPH) parts.push(`pH in: ${log.inputPH}`);
        if (log.outputPH) parts.push(`pH out: ${log.outputPH}`);
        if (log.details) {
          // Handle both string and JSON object formats
          let notes = log.details;
          if (typeof log.details === 'string') {
            try {
              const parsed = JSON.parse(log.details);
              notes = parsed.notes || log.details;
            } catch { notes = log.details; }
          } else if (typeof log.details === 'object' && log.details.notes) {
            notes = log.details.notes;
          }
          if (notes) parts.push(`Notes: ${notes}`);
        }
        return `  ${date}: ${parts.join(', ')}`;
      }).join('\n');
    }

    systemPrompt += `

CURRENT PLANT CONTEXT:
- Plant ID: ${plantContext.plantId || plantContext.catalogId || 'Unknown'}
- Species: ${plantContext.genus || 'Anthurium'} ${plantContext.species || ''}
- Hybrid Name: ${plantContext.hybridName || 'N/A'}
- Health Status: ${plantContext.healthStatus || 'Unknown'}
- Section: ${plantContext.section || 'Unknown'}
- Location: ${plantContext.location || 'Unknown'}
- Substrate/Soil Type: ${plantContext.soilType || 'Unknown'}
- Watering Frequency: ${plantContext.wateringFrequency || 'Unknown'}
- Light Requirements: ${plantContext.lightRequirements || 'Unknown'}
${plantContext.breederCode ? `- Breeder Code: ${plantContext.breederCode}` : ''}
${plantContext.lastWatered ? `- Last Watered: ${new Date(plantContext.lastWatered).toLocaleDateString()}` : ''}
${plantContext.lastFertilized ? `- Last Fertilized: ${new Date(plantContext.lastFertilized).toLocaleDateString()}` : ''}
${plantContext.notes ? `- Notes: ${plantContext.notes}` : ''}

${careLogSummary ? `RECENT CARE LOGS (last 10):\n${careLogSummary}` : 'No care logs recorded yet.'}

${imageContents.length > 0 ? `PHOTOS PROVIDED FOR ANALYSIS (${photoMode} mode - ${imageContents.length} of ${plantContext.photos?.length || 0} total):
${photoDescriptions.map((desc, i) => `  Photo ${i + 1}: ${desc}`).join('\n')}

IMPORTANT: You have been given ${imageContents.length} actual photo(s) to analyze visually. When discussing the plant's appearance, ALWAYS explicitly reference which photos you are describing and what you observe in each.` : ''}

When the user asks questions, assume they're asking about this specific plant unless otherwise specified. Use the care log data to assess substrate health, watering patterns, and EC/pH trends.${imageContents.length > 0 ? ' Reference the photos when discussing visual aspects like leaf condition, growth patterns, or health assessment.' : ''}`;
  }

  // Convert UI messages to model messages format
  const modelMessages = convertToModelMessages(messages);

  // Attach images to the first user message (only if we loaded any)
  if (imageContents.length > 0 && modelMessages.length > 0) {
    const firstUserMsgIndex = modelMessages.findIndex(m => m.role === 'user');
    if (firstUserMsgIndex !== -1) {
      const firstUserMsg = modelMessages[firstUserMsgIndex];
      // Get original text content
      const originalText = typeof firstUserMsg.content === 'string'
        ? firstUserMsg.content
        : Array.isArray(firstUserMsg.content)
          ? firstUserMsg.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
          : String(firstUserMsg.content);

      // Build new content array with images first, then text
      // Using type assertion to handle AI SDK's strict typing for multimodal content
      (modelMessages[firstUserMsgIndex] as any).content = [
        ...imageContents.map(img => ({
          type: 'image' as const,
          image: img.image,
          mimeType: img.mimeType
        })),
        { type: 'text' as const, text: originalText }
      ];

      console.log('[Chat API] Attached', imageContents.length, 'images to first message');
    }
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}

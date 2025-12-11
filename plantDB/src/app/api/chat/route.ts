import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';
import { readFile } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { getSamples, getSensors } from '@/lib/sensorpush';
import { getWeather, formatCurrentWeather, windDirectionToCompass } from '@/lib/weather';

export const maxDuration = 120; // Opus 4 with extended thinking needs more time

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Balcony sensor ID (outdoor, has barometric pressure)
const OUTDOOR_SENSOR_ID = '16938503.1326776003983611910';

// Helper to fetch environmental history from SensorPush
async function getEnvironmentalHistory(locationId: string | undefined) {
  if (!locationId) return null;

  try {
    // Get the location's sensor mapping
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { name: true, sensorPushId: true }
    });

    if (!location?.sensorPushId) return null;

    // Fetch last 7 days of data (168 hours), limit 200 samples
    const stopTime = new Date();
    const startTime = new Date(stopTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    const samplesResponse = await getSamples([location.sensorPushId], 200, startTime, stopTime);
    const samples = samplesResponse.sensors[location.sensorPushId];

    if (!samples || samples.length === 0) return null;

    // Calculate stats
    const temps = samples.map(s => s.temperature);
    const humidities = samples.map(s => s.humidity);
    const vpds = samples.map(s => s.vpd);

    // Get daily averages for the last 7 days
    const dailyStats: Record<string, { temps: number[], humidities: number[], vpds: number[] }> = {};
    for (const sample of samples) {
      const day = new Date(sample.observed).toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { temps: [], humidities: [], vpds: [] };
      }
      dailyStats[day].temps.push(sample.temperature);
      dailyStats[day].humidities.push(sample.humidity);
      dailyStats[day].vpds.push(sample.vpd);
    }

    const dailySummary = Object.entries(dailyStats)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .map(([date, data]) => {
        const avgTemp = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
        const avgHum = data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length;
        const avgVpd = data.vpds.reduce((a, b) => a + b, 0) / data.vpds.length;
        return `  ${date}: Temp ${avgTemp.toFixed(1)}°F, RH ${avgHum.toFixed(1)}%, VPD ${avgVpd.toFixed(2)} kPa`;
      })
      .join('\n');

    return {
      locationName: location.name,
      sampleCount: samples.length,
      period: `${startTime.toLocaleDateString()} - ${stopTime.toLocaleDateString()}`,
      currentReading: samples[0], // Most recent
      stats: {
        tempMin: Math.min(...temps).toFixed(1),
        tempMax: Math.max(...temps).toFixed(1),
        tempAvg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
        humidityMin: Math.min(...humidities).toFixed(1),
        humidityMax: Math.max(...humidities).toFixed(1),
        humidityAvg: (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1),
        vpdMin: Math.min(...vpds).toFixed(2),
        vpdMax: Math.max(...vpds).toFixed(2),
        vpdAvg: (vpds.reduce((a, b) => a + b, 0) / vpds.length).toFixed(2)
      },
      dailySummary
    };
  } catch (error) {
    console.error('[Chat API] Error fetching environmental history:', error);
    return null;
  }
}

// Helper to get outdoor conditions (barometric pressure from balcony sensor + weather)
async function getOutdoorConditions() {
  try {
    // Get barometric pressure from outdoor sensor
    const samplesResponse = await getSamples([OUTDOOR_SENSOR_ID], 1);
    const samples = samplesResponse.sensors[OUTDOOR_SENSOR_ID];
    const outdoorSensor = samples?.[0];

    // Get weather data
    const weather = await getWeather();

    return {
      barometricPressure: outdoorSensor?.barometric_pressure,
      sensorTemp: outdoorSensor?.temperature,
      sensorHumidity: outdoorSensor?.humidity,
      weather: weather.current,
      forecast: weather.daily.slice(0, 3), // Next 3 days
    };
  } catch (error) {
    console.error('[Chat API] Error fetching outdoor conditions:', error);
    return null;
  }
}

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

## EPISTEMIC RIGOR - CRITICAL

You must maintain strict intellectual honesty:

1. **OBSERVATIONS vs HYPOTHESES**: Always clearly separate what you directly observe in photos from interpretations. Use language like:
   - "I observe [X] in Photo 3" (observation)
   - "This could indicate [Y], though [Z] is also possible" (hypothesis with alternatives)

2. **CONFIDENCE LEVELS**: State your confidence explicitly:
   - HIGH: Multiple corroborating data points, clear visual evidence
   - MEDIUM: Some evidence supports this, but incomplete data
   - LOW: Speculative based on limited information

3. **VERIFY BEFORE ASSUMING**:
   - Never assume cultivar ID, parentage, or section - verify from the provided plant data
   - If hybridName is "Unknown" or absent, say so rather than guessing
   - Don't invent breeder codes or lineage not present in the data

4. **ASK BEFORE PRESCRIBING**:
   - Don't give specific dosage recommendations without knowing current regime
   - Ask clarifying questions when data is insufficient
   - Prefer "consider adjusting X" over "use exactly Y mL/L"

5. **NO CONFABULATION**:
   - If you don't know, say "I don't have enough information to determine..."
   - Don't fill gaps with plausible-sounding but unverified details
   - Distinguish what the data shows from what you're inferring

## EC/pH ANALYSIS - NUANCED INTERPRETATION

EC and pH readings must be analyzed in context of the fertigation mix:

**Key insight: Input composition drives output readings**
- Silicon (Si) products raise pH significantly - high pH out after Si application is EXPECTED, not a substrate problem
- CalMag additions affect both EC and pH
- Organic acids (humic/fulvic) lower pH
- Different products create different baseline readings

**What matters: DELTA (Δ) analysis**
- ΔEC = Output EC - Input EC (substrate salt load indicator)
- ΔpH = Output pH - Input pH (substrate buffering indicator)
- Compare deltas WITHIN same feed type, not across different feeds
- A consistent Δ across multiple waterings is more meaningful than absolute values

**Red flags (genuine concerns):**
- ΔEC consistently >0.5 across multiple readings = salt accumulation
- ΔpH consistently >0.5 in same direction = buffering capacity issue
- Sudden delta shift when feed unchanged = substrate chemistry change

**Not red flags (expected variation):**
- pH 7.2 out after Si application (Si is alkaline)
- Higher EC out after flush (mobilizing accumulated salts - actually good)
- Single anomalous reading among consistent trend

When analyzing care logs, look for:
1. What was in the feed? (baseline, Si, CalMag, etc.)
2. What's the delta, not just absolute values?
3. Is this a trend or isolated reading?
4. Does the delta pattern change over time?

## DOMAIN EXPERTISE

Key Anthurium sections:
- Cardiolonchium: Velvet-leaved species (crystallinum, magnificum, warocqueanum, papillilaminum, forgetii, regale)
- Porphyrochitonium: Generally smaller-leaved species (dressleri, etc.)
- Xialophyllum: Strap-leaved species (wendlingerii)
- Pachyneurium: Birdsnest types

Breeder codes (only reference if present in plant data):
- RA, OG = Regional lineage indicators
- TZ = Tezula Plants
- SC = Scott Cohen
- NSE = NSE Tropicals
- SKG = Silver Krome Gardens

Environmental parameters (reference ranges, not prescriptions):
- EC: 1.0-1.2 mS/cm typical for input (varies by growth stage)
- pH: 5.8-6.2 typical for input (varies by product mix)
- VPD: 0.8-1.2 kPa optimal range
- DLI: 10-16 mol/m²/day typical range

You're speaking to a master breeder - be professional, precise, and acknowledge complexity rather than oversimplifying.`;

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
    // Fetch environmental history from SensorPush (if location has sensor)
    const envHistory = await getEnvironmentalHistory(plantContext.locationId);

    // Fetch outdoor conditions (barometric pressure + weather)
    const outdoor = await getOutdoorConditions();

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

${envHistory ? `ENVIRONMENTAL DATA (SensorPush - ${envHistory.locationName}):
Current Reading (${new Date(envHistory.currentReading.observed).toLocaleString()}):
  Temperature: ${envHistory.currentReading.temperature.toFixed(1)}°F
  Humidity: ${envHistory.currentReading.humidity.toFixed(1)}%
  VPD: ${envHistory.currentReading.vpd.toFixed(2)} kPa

7-Day Summary (${envHistory.sampleCount} readings):
  Temp Range: ${envHistory.stats.tempMin}°F - ${envHistory.stats.tempMax}°F (avg ${envHistory.stats.tempAvg}°F)
  RH Range: ${envHistory.stats.humidityMin}% - ${envHistory.stats.humidityMax}% (avg ${envHistory.stats.humidityAvg}%)
  VPD Range: ${envHistory.stats.vpdMin} - ${envHistory.stats.vpdMax} kPa (avg ${envHistory.stats.vpdAvg} kPa)

Daily Averages:
${envHistory.dailySummary}

Use this environmental data to contextualize growth patterns in photos and correlate with care log timestamps.` : ''}

${outdoor ? `OUTDOOR CONDITIONS & WEATHER (Fort Lauderdale):
Current Weather: ${outdoor.weather.weatherDescription}, ${outdoor.weather.temperature.toFixed(0)}°F (feels ${outdoor.weather.apparentTemperature.toFixed(0)}°F)
Wind: ${outdoor.weather.windSpeed.toFixed(0)} mph ${windDirectionToCompass(outdoor.weather.windDirection)}${outdoor.weather.windGusts > outdoor.weather.windSpeed + 5 ? `, gusts ${outdoor.weather.windGusts.toFixed(0)} mph` : ''}
Cloud Cover: ${outdoor.weather.cloudCover}% | UV Index: ${outdoor.weather.uvIndex.toFixed(1)}
${outdoor.weather.rain > 0 ? `Rain: ${outdoor.weather.rain.toFixed(1)}mm\n` : ''}${outdoor.barometricPressure ? `Barometric Pressure: ${outdoor.barometricPressure.toFixed(2)} inHg (from balcony sensor)\n` : ''}
Balcony Sensor: ${outdoor.sensorTemp?.toFixed(1)}°F, ${outdoor.sensorHumidity?.toFixed(1)}% RH

3-Day Forecast:
${outdoor.forecast.map(d => `  ${d.date}: ${d.weatherDescription}, ${d.tempMin.toFixed(0)}-${d.tempMax.toFixed(0)}°F${d.precipitationProbability > 20 ? `, ${d.precipitationProbability}% chance rain` : ''}`).join('\n')}

Use weather data to interpret outdoor sensor readings (e.g., 100% humidity during rain vs fog vs dew).` : ''}

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
    model: anthropic('claude-opus-4-20250514'),
    system: systemPrompt,
    messages: modelMessages,
    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 16000
        }
      }
    }
  });

  return result.toUIMessageStreamResponse();
}

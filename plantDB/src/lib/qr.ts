import QRCode from 'qrcode';

/**
 * QR Code Generation Utilities
 *
 * Generates QR codes for plants and locations that redirect to quick care pages.
 */

// Base URL for QR codes
// Uses Tailscale IP for local network access, can override with env var
const QR_BASE_URL = process.env.NEXT_PUBLIC_QR_BASE_URL || 'http://100.88.172.122:3000';

export type QRType = 'plant' | 'location';

/**
 * Generate the URL that a QR code should encode
 */
export function getQRUrl(type: QRType, id: string): string {
  const typeCode = type === 'plant' ? 'p' : 'l';
  // For locations, convert spaces to underscores for URL safety
  const safeId = type === 'location' ? id.replace(/\s+/g, '_') : id;
  return `${QR_BASE_URL}/q/${typeCode}/${safeId}`;
}

/**
 * Generate QR code as data URL (for display in browser)
 */
export async function generateQRDataUrl(
  type: QRType,
  id: string,
  options?: {
    width?: number;
    margin?: number;
    dark?: string;
    light?: string;
  }
): Promise<string> {
  const url = getQRUrl(type, id);

  return QRCode.toDataURL(url, {
    width: options?.width || 200,
    margin: options?.margin || 2,
    color: {
      dark: options?.dark || '#000000',
      light: options?.light || '#ffffff',
    },
    errorCorrectionLevel: 'M', // Medium error correction - good balance
  });
}

/**
 * Generate QR code as SVG string (for printing/scaling)
 */
export async function generateQRSvg(
  type: QRType,
  id: string,
  options?: {
    width?: number;
    margin?: number;
  }
): Promise<string> {
  const url = getQRUrl(type, id);

  return QRCode.toString(url, {
    type: 'svg',
    width: options?.width || 200,
    margin: options?.margin || 2,
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate raw QR matrix for custom rendering (e.g., ZPL)
 */
export async function generateQRMatrix(
  type: QRType,
  id: string
): Promise<{ modules: boolean[][]; size: number }> {
  const url = getQRUrl(type, id);

  // Create QR code and get the modules
  const qr = await QRCode.create(url, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const modules: boolean[][] = [];

  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(qr.modules.get(x, y) === 1);
    }
    modules.push(row);
  }

  return { modules, size };
}

/**
 * Plant tag data structure for printing
 */
export interface PlantTagData {
  plantId: string;        // ANT-2025-0036
  hybridName?: string;    // "King of Spades"
  species?: string;       // "dressleri"
  section?: string;       // "Cardiolonchium"
  qrUrl: string;          // Full URL for QR
  qrDataUrl?: string;     // Base64 data URL for QR image
}

/**
 * Generate complete plant tag data
 */
export async function generatePlantTagData(plant: {
  plantId: string;
  hybridName?: string | null;
  species?: string | null;
  section?: string | null;
}): Promise<PlantTagData> {
  const qrUrl = getQRUrl('plant', plant.plantId);
  const qrDataUrl = await generateQRDataUrl('plant', plant.plantId, {
    width: 150,
    margin: 1,
  });

  return {
    plantId: plant.plantId,
    hybridName: plant.hybridName || undefined,
    species: plant.species || undefined,
    section: plant.section || undefined,
    qrUrl,
    qrDataUrl,
  };
}

/**
 * ZPL (Zebra Programming Language) Template Generator
 *
 * Generates ZPL II code for Zebra ZD421 thermal printer.
 * Label size: 2" x 1" (standard plant tag size)
 *
 * ZPL coordinates are in dots. ZD421 at 300 DPI:
 * - 2" width = 600 dots
 * - 1" height = 300 dots
 */

import { generateQRMatrix } from './qr';

export interface PlantLabelData {
  plantId: string;        // ANT-2025-0036
  line1?: string;         // Hybrid name or species
  line2?: string;         // Section or additional info
}

/**
 * Generate ZPL code for a plant tag
 *
 * Layout (2" x 1" label at 300 DPI):
 * +---------------------------+
 * | [QR]  ANT-2025-0036       |
 * | [QR]  Hybrid Name         |
 * | [QR]  Section             |
 * +---------------------------+
 */
export async function generatePlantTagZPL(data: PlantLabelData): Promise<string> {
  const { plantId, line1, line2 } = data;

  // Generate QR matrix for embedding in ZPL
  const { modules, size } = await generateQRMatrix('plant', plantId);

  // Convert QR matrix to ZPL graphic field
  // ZPL uses ^GF for graphic field with hex data
  const qrZpl = generateQRGraphicField(modules, size, 4); // 4x magnification

  // Build ZPL command string
  const zpl = `
^XA
^CI28
^PW600
^LL300
^LH0,0

${qrZpl}

^FO200,30
^A0N,40,40
^FD${escapeZPL(plantId)}^FS

${line1 ? `
^FO200,90
^A0N,32,32
^FD${escapeZPL(truncate(line1, 20))}^FS
` : ''}

${line2 ? `
^FO200,140
^A0N,24,24
^FD${escapeZPL(truncate(line2, 25))}^FS
` : ''}

^FO200,200
^A0N,18,18
^FDcladari.app^FS

^XZ
`.trim();

  return zpl;
}

/**
 * Generate ZPL graphic field from QR matrix
 */
function generateQRGraphicField(
  modules: boolean[][],
  size: number,
  magnification: number
): string {
  const dotSize = magnification;
  const totalWidth = size * dotSize;
  const totalHeight = size * dotSize;

  // ZPL graphic field uses bytes (8 pixels per byte)
  const bytesPerRow = Math.ceil(totalWidth / 8);
  const totalBytes = bytesPerRow * totalHeight;

  // Build hex string row by row
  let hexData = '';

  for (let qrY = 0; qrY < size; qrY++) {
    // Each QR module row is repeated `dotSize` times
    for (let repeat = 0; repeat < dotSize; repeat++) {
      let rowBits = '';

      for (let qrX = 0; qrX < size; qrX++) {
        const isDark = modules[qrY][qrX];
        // Each QR module is `dotSize` pixels wide
        for (let i = 0; i < dotSize; i++) {
          rowBits += isDark ? '1' : '0';
        }
      }

      // Pad to byte boundary
      while (rowBits.length < bytesPerRow * 8) {
        rowBits += '0';
      }

      // Convert bits to hex
      for (let i = 0; i < rowBits.length; i += 8) {
        const byte = parseInt(rowBits.substring(i, i + 8), 2);
        hexData += byte.toString(16).toUpperCase().padStart(2, '0');
      }
    }
  }

  // Position QR at top-left with margin
  const xPos = 20;
  const yPos = 30;

  return `^FO${xPos},${yPos}^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}^FS`;
}

/**
 * Escape special ZPL characters
 */
function escapeZPL(text: string): string {
  return text
    .replace(/\^/g, '')  // Remove carets (ZPL command prefix)
    .replace(/~/g, '')   // Remove tildes (ZPL control prefix)
    .replace(/\\/g, ''); // Remove backslashes
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

/**
 * Generate ZPL for multiple labels (batch print)
 */
export async function generateBatchTagsZPL(
  plants: PlantLabelData[]
): Promise<string> {
  const labels = await Promise.all(plants.map(generatePlantTagZPL));
  return labels.join('\n');
}

/**
 * Generate ZPL for a location tag
 */
export async function generateLocationTagZPL(
  locationName: string,
  plantCount?: number
): Promise<string> {
  const { modules, size } = await generateQRMatrix('location', locationName);
  const qrZpl = generateQRGraphicField(modules, size, 5); // Larger QR for location

  const zpl = `
^XA
^CI28
^PW600
^LL300
^LH0,0

${qrZpl}

^FO220,50
^A0N,48,48
^FD${escapeZPL(locationName)}^FS

${plantCount !== undefined ? `
^FO220,120
^A0N,28,28
^FD${plantCount} plants^FS
` : ''}

^FO220,200
^A0N,18,18
^FDScan for batch care^FS

^XZ
`.trim();

  return zpl;
}

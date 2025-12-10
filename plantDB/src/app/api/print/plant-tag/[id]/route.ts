import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePlantTagZPL } from '@/lib/zpl';
import { generateQRDataUrl } from '@/lib/qr';

/**
 * Plant Tag Print API
 *
 * GET /api/print/plant-tag/{id}?format=zpl|html|png
 *
 * Returns printable plant tag in requested format:
 * - zpl: Raw ZPL code for Zebra printer
 * - html: HTML preview (default)
 * - png: QR code as PNG image
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get('format') || 'html';

  try {
    // Look up plant
    const plant = await prisma.plant.findFirst({
      where: {
        OR: [
          { id },
          { plantId: id },
        ],
      },
      select: {
        id: true,
        plantId: true,
        hybridName: true,
        species: true,
        section: true,
        genus: true,
      },
    });

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    // Build label data
    const labelData = {
      plantId: plant.plantId || plant.id,
      line1: plant.hybridName || (plant.species ? `${plant.genus || 'A.'} ${plant.species}` : undefined),
      line2: plant.section || undefined,
    };

    switch (format) {
      case 'zpl': {
        const zpl = await generatePlantTagZPL(labelData);
        return new NextResponse(zpl, {
          headers: {
            'Content-Type': 'application/x-zpl',
            'Content-Disposition': `attachment; filename="${labelData.plantId}.zpl"`,
          },
        });
      }

      case 'png': {
        const qrDataUrl = await generateQRDataUrl('plant', labelData.plantId, {
          width: 300,
          margin: 2,
        });
        // Extract base64 data from data URL
        const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${labelData.plantId}-qr.png"`,
          },
        });
      }

      case 'html':
      default: {
        const qrDataUrl = await generateQRDataUrl('plant', labelData.plantId, {
          width: 150,
          margin: 1,
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Plant Tag: ${labelData.plantId}</title>
  <style>
    @page { size: 2in 1in; margin: 0; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #1a1a1a;
      color: white;
    }
    .tag {
      width: 2in;
      height: 1in;
      background: white;
      color: black;
      display: flex;
      padding: 4px;
      box-sizing: border-box;
      border-radius: 4px;
    }
    .qr {
      width: 0.85in;
      height: 0.85in;
      flex-shrink: 0;
    }
    .qr img {
      width: 100%;
      height: 100%;
    }
    .info {
      flex: 1;
      padding-left: 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
    }
    .plant-id {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .hybrid-name {
      font-size: 9px;
      margin-bottom: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .section {
      font-size: 8px;
      color: #666;
    }
    .brand {
      font-size: 6px;
      color: #999;
      margin-top: auto;
    }
    .controls {
      margin-top: 20px;
    }
    .btn {
      background: #22c55e;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
    }
    .btn:hover { background: #16a34a; }
    .btn-secondary {
      background: #374151;
    }
    .btn-secondary:hover { background: #4b5563; }
  </style>
</head>
<body>
  <div class="tag">
    <div class="qr">
      <img src="${qrDataUrl}" alt="QR Code">
    </div>
    <div class="info">
      <div class="plant-id">${labelData.plantId}</div>
      ${labelData.line1 ? `<div class="hybrid-name">${labelData.line1}</div>` : ''}
      ${labelData.line2 ? `<div class="section">${labelData.line2}</div>` : ''}
      <div class="brand">cladari.app</div>
    </div>
  </div>

  <div class="controls no-print">
    <button class="btn" onclick="window.print()">Print Tag</button>
    <a href="/api/print/plant-tag/${plant.id}?format=zpl" class="btn btn-secondary" download>Download ZPL</a>
    <a href="/api/print/plant-tag/${plant.id}?format=png" class="btn btn-secondary" download>Download QR PNG</a>
  </div>
</body>
</html>
        `.trim();

        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
    }
  } catch (error) {
    console.error('Print tag error:', error);
    return NextResponse.json({ error: 'Failed to generate tag' }, { status: 500 });
  }
}

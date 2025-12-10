import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateLocationTagZPL } from '@/lib/zpl';
import { generateQRDataUrl } from '@/lib/qr';

/**
 * Location Tag Print API
 *
 * GET /api/print/location-tag/{name}?format=zpl|html|png
 *
 * Returns printable location tag in requested format.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const locationName = decodeURIComponent(name);
  const format = req.nextUrl.searchParams.get('format') || 'html';

  try {
    // Look up location to get plant count
    const location = await prisma.location.findFirst({
      where: { name: locationName },
      include: {
        _count: {
          select: { plants: true }
        }
      }
    });

    const plantCount = location?._count?.plants || 0;

    switch (format) {
      case 'zpl': {
        const zpl = await generateLocationTagZPL(locationName, plantCount);
        return new NextResponse(zpl, {
          headers: {
            'Content-Type': 'application/x-zpl',
            'Content-Disposition': `attachment; filename="${locationName.replace(/\s+/g, '_')}.zpl"`,
          },
        });
      }

      case 'png': {
        const qrDataUrl = await generateQRDataUrl('location', locationName, {
          width: 300,
          margin: 2,
        });
        const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${locationName.replace(/\s+/g, '_')}-qr.png"`,
          },
        });
      }

      case 'html':
      default: {
        const qrDataUrl = await generateQRDataUrl('location', locationName, {
          width: 180,
          margin: 1,
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Location Tag: ${locationName}</title>
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
      width: 0.9in;
      height: 0.9in;
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
    .location-name {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .plant-count {
      font-size: 10px;
      color: #666;
      margin-bottom: 2px;
    }
    .action {
      font-size: 8px;
      color: #999;
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
      <div class="location-name">${locationName}</div>
      <div class="plant-count">${plantCount} plant${plantCount !== 1 ? 's' : ''}</div>
      <div class="action">Scan for batch care</div>
      <div class="brand">cladari.app</div>
    </div>
  </div>

  <div class="controls no-print">
    <button class="btn" onclick="window.print()">Print Tag</button>
    <a href="/api/print/location-tag/${encodeURIComponent(locationName)}?format=zpl" class="btn btn-secondary" download>Download ZPL</a>
    <a href="/api/print/location-tag/${encodeURIComponent(locationName)}?format=png" class="btn btn-secondary" download>Download QR PNG</a>
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
    console.error('Print location tag error:', error);
    return NextResponse.json({ error: 'Failed to generate tag' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('=== CHECKING RECEIPT API HEALTH ===');

    // Check if default logo exists
    const logoPath = path.join(
      process.cwd(),
      'public',
      'assets',
      'images',
      'invoice-header.png'
    );
    const logoExists = fs.existsSync(logoPath);

    // Try to read the logo file
    let logoSize = 0;
    let logoBase64 = '';

    if (logoExists) {
      try {
        const imageBuffer = fs.readFileSync(logoPath);
        logoSize = imageBuffer.length;
        logoBase64 = `data:image/png;base64,${imageBuffer.toString('base64').substring(0, 50)}...`;
      } catch (readError) {
        console.error('Error reading logo file:', readError);
      }
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Receipt API is working',
      timestamp: new Date().toISOString(),
      logo: {
        exists: logoExists,
        path: logoPath,
        size: logoSize,
        base64Preview: logoBase64
      },
      features: [
        'Arabic receipt generation',
        'Puppeteer integration',
        'Logo support (default + custom)',
        'HTML fallback support',
        'Bilingual support (Arabic/English)'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

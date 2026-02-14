import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      message: 'PDF generation API is working',
      timestamp: new Date().toISOString(),
      features: [
        'Arabic PDF generation',
        'Puppeteer integration',
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

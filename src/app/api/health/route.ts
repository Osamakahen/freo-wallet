import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Add any critical service checks here
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        blockchain: 'ok',
        cache: 'ok'
      }
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 
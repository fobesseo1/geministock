import { NextRequest, NextResponse } from 'next/server';
import { combineStockData } from '@/lib/data-combiner/stock-data-combiner';

/**
 * GET /api/analysis/[ticker]
 * Returns combined Yahoo Finance real-time + local JSON historical data
 *
 * Returns:
 *   - 200: CombinedStockData
 *   - 400: Invalid ticker
 *   - 404: Ticker data not found
 *   - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;

    // Validate ticker symbol
    if (!ticker || ticker.length < 1) {
      return NextResponse.json(
        { error: 'Invalid ticker symbol' },
        { status: 400 }
      );
    }

    // Combine data from Yahoo API and local JSON
    const combinedData = await combineStockData(ticker);

    return NextResponse.json(combinedData, { status: 200 });
  } catch (error) {
    console.error('Error in analysis API:', error);

    if (error instanceof Error) {
      // Check if it's a "file not found" error
      if (error.message.includes('No local data file found')) {
        return NextResponse.json(
          { error: `No historical data available for ${(await params).ticker}` },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

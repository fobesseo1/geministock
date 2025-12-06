import { NextRequest, NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/investment-engine/analyzer';

/**
 * GET /api/invest/[ticker]
 * Returns investment analysis from 6 legendary investor algorithms
 *
 * Response includes:
 * - Warren Buffett (Quality & Value)
 * - Peter Lynch (Growth at Reasonable Price)
 * - Benjamin Graham (Deep Value)
 * - Ken Fisher (Sales-Based)
 * - Stanley Druckenmiller (Trend Following)
 * - Howard Marks (Cycle/Contrarian)
 *
 * Returns:
 *   - 200: InvestmentAnalysisResult with all 6 verdicts
 *   - 400: Invalid ticker
 *   - 404: No data found for ticker
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

    // Run investment analysis
    const analysis = await analyzeStock(ticker);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Error in investment analysis API:', error);

    if (error instanceof Error) {
      // Check if it's a "file not found" error (no local JSON data)
      if (error.message.includes('No local data file found')) {
        return NextResponse.json(
          {
            error: `No historical financial data available for ${(await params).ticker}`,
          },
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

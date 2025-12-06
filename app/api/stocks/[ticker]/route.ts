import { NextRequest, NextResponse } from 'next/server';
import { fetchStockFinancialData } from '@/lib/yahoo-finance/fetcher';
import { StockDataError, StockDataErrorType } from '@/lib/types/stock-data';

/**
 * GET /api/stocks/[ticker]
 * Fetches comprehensive financial data for a stock
 *
 * Query params:
 *   - years: number of historical years (default: 4, max: 10)
 *
 * Returns:
 *   - 200: StockFinancialData
 *   - 400: Invalid ticker or parameters
 *   - 404: Ticker not found
 *   - 422: Insufficient data
 *   - 429: Rate limit exceeded
 *   - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const searchParams = request.nextUrl.searchParams;
    const years = parseInt(searchParams.get('years') || '4', 10);

    // Validate ticker symbol
    if (!ticker || ticker.length < 1) {
      return NextResponse.json(
        { error: 'Invalid ticker symbol' },
        { status: 400 }
      );
    }

    // Validate years parameter
    if (years < 1 || years > 10) {
      return NextResponse.json(
        { error: 'Years must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Fetch stock data
    const data = await fetchStockFinancialData(ticker, years);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Handle StockDataError instances
    if (error instanceof StockDataError) {
      const statusCode = {
        [StockDataErrorType.TICKER_NOT_FOUND]: 404,
        [StockDataErrorType.INSUFFICIENT_DATA]: 422,
        [StockDataErrorType.RATE_LIMIT]: 429,
        [StockDataErrorType.API_ERROR]: 500,
        [StockDataErrorType.CALCULATION_ERROR]: 500,
      }[error.type] || 500;

      return NextResponse.json(
        {
          error: error.message,
          type: error.type,
        },
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in stock API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

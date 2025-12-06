import YahooFinanceAPI from 'yahoo-finance2';
import type { StockFinancialData } from '@/lib/types/stock-data';
import { StockDataError, StockDataErrorType } from '@/lib/types/stock-data';
import { processCurrentMetrics } from './processors/current-metrics';
import { processTechnicals } from './processors/technicals';
import { handleYahooFinanceError } from './utils/error-handler';
import { normalizeTickerForYahoo } from './utils/validators';

// Create YahooFinance instance
const yahooFinance = new YahooFinanceAPI();

/**
 * Main orchestration function to fetch comprehensive stock data from Yahoo Finance
 *
 * @param ticker - Stock ticker symbol (e.g., "TSLA", "AAPL")
 * @param yearsOfHistory - Number of historical years to fetch (default: 4)
 * @returns Promise<StockFinancialData> - Comprehensive stock financial data
 * @throws StockDataError - On API errors, missing data, or calculation failures
 */
export async function fetchStockFinancialData(
  ticker: string,
  yearsOfHistory: number = 4
): Promise<StockFinancialData> {
  try {
    console.log(`Fetching data for ${ticker}...`);

    // Normalize ticker for Yahoo Finance API (BRK.B → BRK-B)
    const yahooTicker = normalizeTickerForYahoo(ticker);

    // Step 1: Fetch real-time data from Yahoo Finance
    const quoteSummary = await yahooFinance.quoteSummary(yahooTicker, {
      modules: [
        'price',
        'summaryDetail',
        'defaultKeyStatistics',
        'financialData',
      ],
    });

    console.log(`Successfully fetched real-time data for ${ticker}`);

    // Step 2: Validate required data is present
    if (!quoteSummary.price || !quoteSummary.financialData) {
      throw new StockDataError(
        StockDataErrorType.TICKER_NOT_FOUND,
        `No data found for ticker: ${ticker}`
      );
    }

    // Step 3: Process data into structured format
    const current_price = quoteSummary.financialData.currentPrice ?? 0;
    const market_cap = quoteSummary.price.marketCap ?? 0;

    console.log(`Processing real-time metrics for ${ticker}...`);

    const ttm_metrics = processCurrentMetrics(quoteSummary);
    const technicals = processTechnicals(quoteSummary);

    console.log(`Successfully processed ${ticker}`);

    // Step 4: Return unified data structure (use original ticker, not normalized)
    return {
      ticker: ticker.toUpperCase(),
      current_price,
      market_cap,
      ttm_metrics,
      technicals,
    };
  } catch (error) {
    throw handleYahooFinanceError(error, ticker, 'fetchStockFinancialData');
  }
}

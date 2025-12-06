import { fetchStockFinancialData } from '@/lib/yahoo-finance/fetcher';
import {
  readLocalFinancialData,
  extractRecentYears,
} from '@/lib/local-data/json-reader';
import type {
  CombinedStockData,
  MarketStatus,
  FinancialHistoryItem,
} from '@/lib/types/combined-stock-data';

/**
 * Combine Yahoo Finance real-time data with local JSON historical data
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL")
 * @returns Promise<CombinedStockData> - Combined data from both sources
 * @throws Error if data fetching fails
 */
export async function combineStockData(
  ticker: string
): Promise<CombinedStockData> {
  // Fetch Yahoo real-time data
  const yahooData = await fetchStockFinancialData(ticker);

  // Read local JSON historical data
  const localData = await readLocalFinancialData(ticker);
  const recentYears = extractRecentYears(localData, 3);

  // Format market status from Yahoo data
  const market_status: MarketStatus = {
    current_price: yahooData.current_price,
    market_cap: yahooData.market_cap,
    '52w_high': yahooData.technicals.fifty_two_week_high,
    '52w_low': yahooData.technicals.fifty_two_week_low,
    '200d_ma': yahooData.technicals.two_hundred_day_avg,
    ttm_per: yahooData.ttm_metrics.per,
    debt_to_equity: yahooData.ttm_metrics.debt_to_equity,
  };

  // Format financial history from local JSON
  const financial_history: FinancialHistoryItem[] = recentYears.map(
    (yearData) => {
      // Extract year from period (e.g., "2023.09.30" -> 2023)
      const year = parseInt(yearData.period.split('.')[0]);

      return {
        year,
        eps: yearData.EPS ?? 0,
        // Use ROE if available, otherwise fall back to 순이익마진율
        roe: yearData.ROE ?? yearData.순이익마진율 ?? 0,
        per: yearData.PER ?? 0,
        pbr: yearData.PBR ?? 0,
        psr: yearData.PSR ?? 0,
        sps: yearData.SPS ?? 0,
        fcf: yearData.calculated_FCF ?? 0,
      };
    }
  );

  return {
    ticker: ticker.toUpperCase(),
    data_source: 'Yahoo_Realtime + Local_JSON_History',
    market_status,
    financial_history,
  };
}

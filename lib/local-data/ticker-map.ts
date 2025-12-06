import type { LocalFinancialYear } from '@/lib/types/combined-stock-data';

/**
 * Static ticker data mapping
 *
 * Uses static imports instead of dynamic fs.readFile() to:
 * 1. Eliminate Turbopack bundling warnings
 * 2. Improve build performance
 * 3. Reduce bundle size (only includes used files)
 * 4. Enable build-time type checking
 */

// Static imports for all JSON files
// Turbopack can analyze these at build time
const tickerData: Record<string, () => Promise<{ default: LocalFinancialYear[] }>> = {
  // NASDAQ (9 stocks)
  'AMZN': () => import('@/data/stocks/finance/nasdaq/AMZN_아마존닷컴.json'),
  'AVGO': () => import('@/data/stocks/finance/nasdaq/AVGO_브로드컴.json'),
  'GOOG': () => import('@/data/stocks/finance/nasdaq/GOOG_알파벳.json'),
  'GOOGL': () => import('@/data/stocks/finance/nasdaq/GOOGL_알파벳.json'),
  'META': () => import('@/data/stocks/finance/nasdaq/META_메타.json'),
  'MSFT': () => import('@/data/stocks/finance/nasdaq/MSFT_마이크로소프트.json'),
  'NFLX': () => import('@/data/stocks/finance/nasdaq/NFLX_넷플릭스.json'),
  'NVDA': () => import('@/data/stocks/finance/nasdaq/NVDA_엔비디아.json'),
  'TSLA': () => import('@/data/stocks/finance/nasdaq/TSLA_테슬라.json'),

  // NYSE (10 stocks)
  'BRK-B': () => import('@/data/stocks/finance/nyse/BRK.B_버크셔.json'),
  'JNJ': () => import('@/data/stocks/finance/nyse/JNJ_존슨앤드존슨.json'),
  'JPM': () => import('@/data/stocks/finance/nyse/JPM_제이피모간체이스.json'),
  'LLY': () => import('@/data/stocks/finance/nyse/LLY_일라이.json'),
  'MA': () => import('@/data/stocks/finance/nyse/MA_마스터카드.json'),
  'ORCL': () => import('@/data/stocks/finance/nyse/ORCL_오라클.json'),
  'TSM': () => import('@/data/stocks/finance/nyse/TSM_TSMC(타이완반도체제조).json'),
  'V': () => import('@/data/stocks/finance/nyse/V_비자.json'),
  'WMT': () => import('@/data/stocks/finance/nyse/WMT_월마트.json'),
  'XOM': () => import('@/data/stocks/finance/nyse/XOM_엑슨.json'),
};

/**
 * Get ticker data using static imports
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL", "TSLA")
 * @returns Promise<LocalFinancialYear[] | null> - Financial data or null if not found
 */
export async function getTickerData(ticker: string): Promise<LocalFinancialYear[] | null> {
  const upperTicker = ticker.toUpperCase();
  const loader = tickerData[upperTicker];

  if (!loader) {
    return null;
  }

  try {
    const module = await loader();
    return module.default;
  } catch (error) {
    console.error(`Error loading ticker data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Check if ticker data exists
 *
 * @param ticker - Stock ticker symbol
 * @returns boolean - True if data exists
 */
export function hasTickerData(ticker: string): boolean {
  return ticker.toUpperCase() in tickerData;
}

/**
 * Get list of all available tickers
 *
 * @returns string[] - Array of ticker symbols
 */
export function getAvailableTickers(): string[] {
  return Object.keys(tickerData);
}

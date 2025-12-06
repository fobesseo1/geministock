import type { LocalFinancialYear } from '@/lib/types/combined-stock-data';
import { getTickerData } from './ticker-map';

/**
 * Read local financial data JSON file
 * Uses static imports to avoid Turbopack bundling warnings
 *
 * Benefits:
 * - No runtime file system operations
 * - Better build-time optimization
 * - Smaller bundle size (only includes used files)
 * - Type-safe imports
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL", "TSLA")
 * @returns Promise<LocalFinancialYear[]> - Array of financial data by year
 * @throws Error if file not found
 */
export async function readLocalFinancialData(
  ticker: string
): Promise<LocalFinancialYear[]> {
  try {
    const data = await getTickerData(ticker);

    if (!data) {
      throw new Error(`No local data file found for ${ticker}`);
    }

    return data;
  } catch (error) {
    console.error(`Error reading local data for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Extract recent years (t-2, t-1, t-0)
 *
 * @param data - Full array of financial years
 * @param count - Number of recent years to extract (default: 3)
 * @returns LocalFinancialYear[] - Sorted array (oldest to newest: t-2, t-1, t-0)
 */
export function extractRecentYears(
  data: LocalFinancialYear[],
  count: number = 3
): LocalFinancialYear[] {
  // Define recent indices based on count
  const recentIndices = Array.from(
    { length: count },
    (_, i) => `t-${count - 1 - i}`
  );

  return data
    .filter((item) => recentIndices.includes(item.t_index))
    .sort((a, b) => {
      // Extract numeric part from t_index (e.g., "t-2" -> 2)
      const indexA = parseInt(a.t_index.replace('t-', '')) || 0;
      const indexB = parseInt(b.t_index.replace('t-', '')) || 0;
      // Sort descending (t-2 -> t-1 -> t-0)
      return indexB - indexA;
    });
}

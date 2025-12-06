import fs from 'fs/promises';
import path from 'path';
import type { LocalFinancialYear } from '@/lib/types/combined-stock-data';

const DATA_DIR = path.join(process.cwd(), 'data', 'stocks', 'finance');

/**
 * Read local financial data JSON file
 * Searches in:
 * - data/stocks/finance/{TICKER}_{회사명}.json
 * - data/stocks/finance/nasdaq/{TICKER}_{회사명}.json
 * - data/stocks/finance/nyse/{TICKER}_{회사명}.json
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL", "TSLA")
 * @returns Promise<LocalFinancialYear[]> - Array of financial data by year
 * @throws Error if file not found
 */
export async function readLocalFinancialData(
  ticker: string
): Promise<LocalFinancialYear[]> {
  try {
    const upperTicker = ticker.toUpperCase();

    // Search locations: root, nasdaq, nyse
    const searchPaths = [
      DATA_DIR,
      path.join(DATA_DIR, 'nasdaq'),
      path.join(DATA_DIR, 'nyse'),
    ];

    // Search each directory
    for (const dirPath of searchPaths) {
      try {
        const files = await fs.readdir(dirPath);
        const matchingFile = files.find(
          (file) =>
            file.startsWith(`${upperTicker}_`) && file.endsWith('.json')
        );

        if (matchingFile) {
          const filePath = path.join(dirPath, matchingFile);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          return data;
        }
      } catch (err) {
        // Directory doesn't exist, continue to next
        continue;
      }
    }

    // No file found in any directory
    throw new Error(`No local data file found for ${ticker}`);
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

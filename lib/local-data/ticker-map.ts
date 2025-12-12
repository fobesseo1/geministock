import type { LocalFinancialYear } from '@/lib/types/combined-stock-data';
import fs from 'fs';
import path from 'path';

/**
 * Dynamic ticker data loader
 *
 * Automatically loads ALL ticker JSON files from NASDAQ and NYSE directories.
 * No manual registration needed - supports 6,500+ stocks!
 *
 * Benefits:
 * 1. Automatic discovery of all ticker files
 * 2. No need to manually add each ticker
 * 3. Runtime dynamic imports (only load what's needed)
 * 4. Supports both NASDAQ and NYSE exchanges
 */

/**
 * Extract ticker symbol from filename
 * Examples:
 *   "AAPL_애플.json" -> "AAPL"
 *   "BRK.B_버크셔.json" -> "BRK-B"
 *   "TSM_TSMC(타이완반도체제조).json" -> "TSM"
 *
 * @param filename - JSON filename
 * @returns Ticker symbol or null
 */
function extractTickerFromFilename(filename: string): string | null {
  if (!filename.endsWith('.json')) return null;

  // Remove .json extension and split by underscore
  const parts = filename.replace('.json', '').split('_');
  if (parts.length < 2) return null;

  // First part is the ticker symbol
  // Handle special case: BRK.B -> BRK-B (Yahoo Finance format)
  return parts[0].replace(/\./g, '-').toUpperCase();
}

/**
 * Get all available ticker symbols by scanning directory
 * This runs on the server side only
 *
 * @returns string[] - Array of all ticker symbols
 */
export function getAvailableTickers(): string[] {
  // This function only works on server side
  if (typeof window !== 'undefined') {
    console.warn('getAvailableTickers() should only be called on server side');
    return [];
  }

  const tickers: Set<string> = new Set();
  const baseDir = path.join(process.cwd(), 'data', 'stocks', 'finance');

  try {
    // Scan NASDAQ directory
    const nasdaqDir = path.join(baseDir, 'nasdaq');
    if (fs.existsSync(nasdaqDir)) {
      const nasdaqFiles = fs.readdirSync(nasdaqDir);
      nasdaqFiles.forEach((file) => {
        const ticker = extractTickerFromFilename(file);
        if (ticker) tickers.add(ticker);
      });
    }

    // Scan NYSE directory
    const nyseDir = path.join(baseDir, 'nyse');
    if (fs.existsSync(nyseDir)) {
      const nyseFiles = fs.readdirSync(nyseDir);
      nyseFiles.forEach((file) => {
        const ticker = extractTickerFromFilename(file);
        if (ticker) tickers.add(ticker);
      });
    }

    return Array.from(tickers).sort();
  } catch (error) {
    console.error('Error scanning ticker directories:', error);
    return [];
  }
}

/**
 * Find the actual filename for a ticker symbol
 * Searches both NASDAQ and NYSE directories
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL", "TSLA")
 * @returns Object with exchange and filename, or null if not found
 */
function findTickerFile(ticker: string): { exchange: 'nasdaq' | 'nyse'; filename: string } | null {
  // This function only works on server side
  if (typeof window !== 'undefined') {
    return null;
  }

  const upperTicker = ticker.toUpperCase();
  const baseDir = path.join(process.cwd(), 'data', 'stocks', 'finance');

  // Search in NASDAQ
  try {
    const nasdaqDir = path.join(baseDir, 'nasdaq');
    if (fs.existsSync(nasdaqDir)) {
      const files = fs.readdirSync(nasdaqDir);
      for (const file of files) {
        const fileTicker = extractTickerFromFilename(file);
        if (fileTicker === upperTicker) {
          return { exchange: 'nasdaq', filename: file };
        }
      }
    }
  } catch (error) {
    console.error(`Error searching NASDAQ for ${ticker}:`, error);
  }

  // Search in NYSE
  try {
    const nyseDir = path.join(baseDir, 'nyse');
    if (fs.existsSync(nyseDir)) {
      const files = fs.readdirSync(nyseDir);
      for (const file of files) {
        const fileTicker = extractTickerFromFilename(file);
        if (fileTicker === upperTicker) {
          return { exchange: 'nyse', filename: file };
        }
      }
    }
  } catch (error) {
    console.error(`Error searching NYSE for ${ticker}:`, error);
  }

  return null;
}

/**
 * Get ticker data using dynamic imports
 * Automatically finds and loads the correct file from NASDAQ or NYSE
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL", "TSLA", "UNH", "EA")
 * @returns Promise<LocalFinancialYear[] | null> - Financial data or null if not found
 */
export async function getTickerData(ticker: string): Promise<LocalFinancialYear[] | null> {
  const upperTicker = ticker.toUpperCase();

  // Find the file
  const fileInfo = findTickerFile(upperTicker);
  if (!fileInfo) {
    console.warn(`No data file found for ticker: ${ticker}`);
    return null;
  }

  try {
    // Dynamic import based on exchange and filename
    const filePath = `@/data/stocks/finance/${fileInfo.exchange}/${fileInfo.filename}`;
    const module = await import(/* @vite-ignore */ filePath);
    return module.default as LocalFinancialYear[];
  } catch (error) {
    console.error(`Error loading data for ${ticker} from ${fileInfo.exchange}/${fileInfo.filename}:`, error);
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
  return findTickerFile(ticker) !== null;
}

/**
 * Extract company name from filename
 * Examples:
 *   "AAPL_애플.json" -> "애플"
 *   "BRK.B_버크셔.json" -> "버크셔"
 *   "TSM_TSMC(타이완반도체제조).json" -> "TSMC(타이완반도체제조)"
 *
 * @param filename - JSON filename
 * @returns Company name or null
 */
function extractCompanyNameFromFilename(filename: string): string | null {
  if (!filename.endsWith('.json')) return null;

  // Remove .json extension and split by underscore
  const parts = filename.replace('.json', '').split('_');
  if (parts.length < 2) return null;

  // Everything after the first underscore is the company name
  return parts.slice(1).join('_');
}

/**
 * Get company name for a ticker symbol
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL", "TSLA")
 * @returns Company name or ticker if not found
 */
export function getCompanyName(ticker: string): string {
  const fileInfo = findTickerFile(ticker);
  if (!fileInfo) {
    return ticker.toUpperCase(); // Fallback to ticker if not found
  }

  const companyName = extractCompanyNameFromFilename(fileInfo.filename);
  return companyName || ticker.toUpperCase();
}

/**
 * Type definitions for combined stock data
 * Combines Yahoo Finance real-time data with local JSON historical data
 */

/**
 * Main combined stock data structure
 */
export interface CombinedStockData {
  ticker: string;
  company_name: string; // Company name extracted from filename
  data_source: 'Yahoo_Realtime + Local_JSON_History';
  market_status: MarketStatus;
  financial_history: FinancialHistoryItem[];
}

/**
 * Real-time market status from Yahoo Finance
 */
export interface MarketStatus {
  current_price: number;
  market_cap: number;
  '52w_high': number;
  '52w_low': number;
  '200d_ma': number;
  ttm_per: number | null;
  debt_to_equity: number;
}

/**
 * Historical financial data item (from local JSON)
 */
export interface FinancialHistoryItem {
  year: number;
  eps: number;
  roe: number;
  per: number;
  pbr: number;
  psr: number;
  sps: number;
  fcf: number;
}

/**
 * Raw structure from local JSON files
 */
export interface LocalFinancialYear {
  t_index: string; // "t-5", "t-4", "t-3", "t-2", "t-1", "t-0"
  period: string; // "2023.09.30"
  EPS?: number;
  ROE?: number;
  PER?: number;
  PBR?: number;
  PSR?: number;
  SPS?: number;
  calculated_FCF?: number;
  순이익마진율?: number; // Korean field: Net profit margin (%)
  [key: string]: any; // Allow other fields
}

// Main output structure for real-time stock data (historical data from local JSON files)
export interface StockFinancialData {
  ticker: string;
  current_price: number;
  market_cap: number;
  ttm_metrics: TTMMetrics;
  technicals: TechnicalIndicators;
}

// Trailing Twelve Months real-time metrics
export interface TTMMetrics {
  per: number | null; // TTM P/E ratio (null for negative earnings)
  debt_to_equity: number; // Debt-to-equity ratio
}

// Technical indicators and price ranges
export interface TechnicalIndicators {
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  two_hundred_day_avg: number;
}

// Error types for comprehensive error handling
export enum StockDataErrorType {
  TICKER_NOT_FOUND = 'TICKER_NOT_FOUND',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  API_ERROR = 'API_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

export class StockDataError extends Error {
  constructor(
    public type: StockDataErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'StockDataError';
  }
}

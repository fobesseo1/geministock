/**
 * Type definitions for investment analysis results
 * Output from 6 legendary investor algorithms
 *
 * [Standardized] All algorithms return consistent field structure for frontend
 */

// Verdict types - 5 levels (언더스코어 통일)
export type Verdict = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';

/**
 * Standardized result from a single investment algorithm
 * All 6 personas must return this exact structure
 */
export interface AlgorithmResult {
  verdict: Verdict;              // Investment recommendation (5 levels)
  target_price: number | null;   // Buy target price (가치투자자용)
  sell_price: number | null;     // Sell/stop-loss price (트레이더용)
  logic: string;                 // One-line explanation of verdict

  // Optional: Additional metric for UI display
  metric_name?: string;          // e.g., "PEG", "Graham Number", "200D MA"
  metric_value?: number | null;  // Numeric value of the metric
}

/**
 * Complete investment analysis result for a stock
 */
export interface InvestmentAnalysisResult {
  ticker: string;
  meta: {
    current_price: number;
    data_period_used: string; // "3 years (2023-2025)"
  };
  results: {
    buffett: AlgorithmResult;
    lynch: AlgorithmResult;
    graham: AlgorithmResult;
    fisher: AlgorithmResult;
    druckenmiller: AlgorithmResult;
    marks: AlgorithmResult;
  };
}

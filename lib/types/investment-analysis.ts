/**
 * Type definitions for investment analysis results
 * Output from 6 legendary investor algorithms
 *
 * [Standardized] All algorithms return consistent field structure for frontend
 */

// Verdict types - 5 levels (언더스코어 통일)
export type Verdict = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';

/**
 * Analysis summary with trigger code and key factors
 * Allows frontend to display dynamic messages based on situation
 */
export interface AnalysisSummary {
  trigger_code: string; // Situation code for frontend mapping (e.g., 'BUY_MOAT_BARGAIN')
  key_factors: Record<string, number | boolean | string>; // Key metrics used in decision
}

/**
 * Price guide for user actions
 * Provides clear buy/sell/stop-loss levels
 */
export interface PriceGuide {
  buy_zone_max: number | null;    // Buy if price drops below this
  profit_zone_min: number | null; // Sell if price rises above this
  stop_loss: number | null;       // Exit if price falls below this
}

/**
 * Standardized result from a single investment algorithm
 * All 6 personas must return this exact structure
 */
export interface AlgorithmResult {
  verdict: Verdict;              // Investment recommendation (5 levels)
  target_price: number | null;   // Buy target price (가치투자자용) - DEPRECATED, use price_guide
  sell_price: number | null;     // Sell/stop-loss price (트레이더용) - DEPRECATED, use price_guide
  logic: string;                 // One-line explanation of verdict - DEPRECATED, use analysis_summary

  // [NEW] Structured analysis summary
  analysis_summary: AnalysisSummary;

  // [NEW] Clear price guide
  price_guide: PriceGuide;

  // Optional: Additional metric for UI display
  metric_name?: string;          // e.g., "PEG", "Graham Number", "200D MA"
  metric_value?: number | null;  // Numeric value of the metric

  // Optional: Trend status for Druckenmiller (추세 추종 전략용)
  trend_status?: string;         // e.g., "↗ Strong Uptrend", "→ Consolidating", "↘ Trend Broken"
  trend_label?: string;          // e.g., "Momentum Buy", "Wait & Watch", "Exit Position"
  trend_signal?: 'BUY' | 'HOLD' | 'SELL';  // Simplified signal

  // Fair price for frontend display (각 guru의 적정가)
  fair_price?: number | null;    // Lynch: sell_price, Marks: buy_zone_max, Others: target_price
}

/**
 * Summary of all 6 personas' opinions
 * Provides consensus view for top-level display
 */
export interface InvestmentSummary {
  total_score: number; // 0-100 score based on verdicts
  consensus_verdict: Verdict; // Most common verdict
  opinion_breakdown: {
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
  };
}

/**
 * Complete investment analysis result for a stock
 */
export interface InvestmentAnalysisResult {
  ticker: string;
  company_name: string; // Company name for UI display
  meta: {
    current_price: number;
    data_period_used: string; // "3 years (2023-2025)"
    currency: string; // "USD"
    timestamp: string; // ISO 8601 timestamp
  };
  // [NEW] Summary of all 6 opinions
  summary: InvestmentSummary;
  results: {
    buffett: AlgorithmResult;
    lynch: AlgorithmResult;
    graham: AlgorithmResult;
    fisher: AlgorithmResult;
    druckenmiller: AlgorithmResult;
    marks: AlgorithmResult;
  };
}

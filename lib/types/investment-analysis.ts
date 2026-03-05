/**
 * Type definitions for investment analysis results
 * Output from 7 legendary investor algorithms
 */

export type Verdict = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';
export type PriceStatus = 'NORMAL' | 'SOFT_CAP' | 'SOFT_FLOOR';

export interface AnalysisSummary {
  trigger_code: string;
  key_factors: Record<string, number | boolean | string>;
}

export interface PriceGuide {
  buy_zone_max: number | null;
  profit_zone_min: number | null;
  stop_loss: number | null;
}

export interface AlgorithmResult {
  verdict: Verdict;
  target_price: number | null;
  sell_price: number | null;
  logic: string;
  analysis_summary: AnalysisSummary;
  price_guide: PriceGuide;
  display_price: number | null;
  price_status: PriceStatus;
  win_rate: number;
  metric_name?: string;
  metric_value?: number | null;
  trend_status?: string;
  trend_label?: string;
  trend_signal?: 'BUY' | 'HOLD' | 'SELL';
  fair_price?: number | null;
}

/**
 * Strategy Group Definition
 * 5 Distinct Styles
 */
export interface StrategyGroup {
  name: string;
  score: number;
  verdict: Verdict;
  description: string;
}

export interface InvestmentSummary {
  total_score: number;
  consensus_verdict: Verdict;
  opinion_breakdown: {
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
  };
  // [NEW] 5 Strategic Groups
  strategies: {
    value: StrategyGroup; // 1. Buffett + Graham
    trend: StrategyGroup; // 2. Druckenmiller + O'Neil
    growth: StrategyGroup; // 3. Lynch (Standalone)
    turnaround: StrategyGroup; // 4. Fisher (Price-to-Sales)
    cycle: StrategyGroup; // 5. Marks (Market Cycle)
  };
}

export interface InvestmentAnalysisResult {
  ticker: string;
  company_name: string;
  meta: {
    current_price: number;
    data_period_used: string;
    currency: string;
    timestamp: string;
  };
  summary: InvestmentSummary;
  results: {
    buffett: AlgorithmResult;
    graham: AlgorithmResult;
    druckenmiller: AlgorithmResult;
    oneil: AlgorithmResult; // Added
    lynch: AlgorithmResult;
    fisher: AlgorithmResult;
    marks: AlgorithmResult; // Restored
  };
}

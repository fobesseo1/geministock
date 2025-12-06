import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';

/**
 * Stanley Druckenmiller Strategy: Trend Following
 *
 * Approach:
 * 1. Trend Check: Price > 200-day MA
 * 2. Momentum Check: Price > 90% of 52-week high
 *
 * Verdict:
 * - STRONG BUY: Trend alive + Strong momentum
 * - HOLD: Trend alive + Weak momentum (pullback)
 * - SELL: Trend broken (price below 200-day MA)
 *
 * Note: No target price - pure trend following with exit condition
 *
 * @param data - Combined stock data
 * @returns Algorithm result with verdict and exit condition
 */
export function calculateDruckenmillerAnalysis(
  data: CombinedStockData
): AlgorithmResult {
  const { market_status } = data;
  const current_price = market_status.current_price;
  const ma_200d = market_status['200d_ma'];
  const week_52_high = market_status['52w_high'];

  // Validate data
  if (current_price <= 0 || ma_200d <= 0 || week_52_high <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Missing technical indicator data',
    };
  }

  // Step 1: Check if trend is alive
  const trendAlive = current_price > ma_200d;

  // Step 2: Check for strong momentum
  const strongMomentum = current_price > week_52_high * 0.9;

  // Step 3: Determine verdict
  let verdict: AlgorithmResult['verdict'];
  let logic: string;

  if (trendAlive && strongMomentum) {
    verdict = 'STRONG_BUY';
    logic = `Price $${current_price.toFixed(2)} above 200-day MA ($${ma_200d.toFixed(2)}) and near 52-week high ($${week_52_high.toFixed(2)}) - strong uptrend`;
  } else if (trendAlive && !strongMomentum) {
    verdict = 'HOLD';
    logic = `Price above 200-day MA but pulled back from 52-week high - trend intact but momentum weak`;
  } else {
    verdict = 'SELL';
    logic = `Price $${current_price.toFixed(2)} below 200-day MA ($${ma_200d.toFixed(2)}) - trend broken`;
  }

  return {
    verdict,
    target_price: null, // Trend followers don't have price targets
    sell_price: ma_200d, // Stop loss at 200-day MA
    logic,
    metric_name: '200D MA',
    metric_value: ma_200d,
  };
}

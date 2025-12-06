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
      analysis_summary: {
        trigger_code: 'DATA_INSUFFICIENT',
        key_factors: {},
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
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

  // Determine trigger code
  let trigger_code: string;
  if (verdict === 'STRONG_BUY') trigger_code = 'BUY_TREND_BREAKOUT';
  else if (verdict === 'HOLD') trigger_code = 'HOLD_DIP_OPPORTUNITY';
  else trigger_code = 'SELL_TREND_BROKEN';

  return {
    verdict,
    target_price: null, // Trend followers don't have price targets
    sell_price: ma_200d, // Stop loss at 200-day MA
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        price_vs_ma200: parseFloat((current_price / ma_200d).toFixed(2)),
        near_52w_high: current_price > week_52_high * 0.9,
      },
    },
    price_guide: {
      buy_zone_max: trendAlive ? week_52_high * 1.05 : null, // 전고점 돌파(Breakout) 초기까지 매수 유효
      profit_zone_min: null, // 추세 추종이라 목표가 없음
      stop_loss: ma_200d, // 200일선 깨지면 손절
    },
    metric_name: '200D MA',
    metric_value: ma_200d,
  };
}

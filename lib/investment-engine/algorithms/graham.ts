import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { calculateCAGR } from '../utils/flexible-average';

/**
 * Helper: Calculate Adjusted Graham Valuation
 *
 * Uses modified Graham formula: V = EPS * (8.5 + multiplier * g)
 * where multiplier adjusts based on growth rate:
 * - g <= 10%: multiplier = 2
 * - g >= 100%: multiplier = 1
 * - 10% < g < 100%: linear interpolation
 */
function calculateAdjustedGrahamValuation(eps: number, g: number): number {
  let multiplier: number;

  if (g <= 10) {
    multiplier = 2;
  } else if (g >= 100) {
    multiplier = 1;
  } else {
    // Linear interpolation between 10% and 100%
    multiplier = 2 - (g - 10) / 90;
  }

  const intrinsicValue = eps * (8.5 + multiplier * g);
  return intrinsicValue;
}

/**
 * Benjamin Graham Strategy: Growth-Adjusted Value with HOLD Zone
 *
 * Approach:
 * 1. Calculate 3-year average EPS growth rate (g)
 * 2. Adjust multiplier based on growth (10% or less: 2x, 100% or more: 1x, linear in between)
 * 3. Graham Formula: V = EPS * (8.5 + multiplier * g)
 * 4. Apply 33% safety margin (0.67x multiplier) for target price
 *
 * Verdict (4 Stages):
 * - STRONG_BUY: Price < Graham Value * 0.67 (33% discount - deep value)
 * - BUY: Price < Graham Value (below fair value)
 * - HOLD: Graham Value <= Price < Graham Value * 1.2 (slight overvalue - hold for gains)
 * - SELL: Price >= Graham Value * 1.2 (20%+ premium - overvalued)
 *
 * Key Improvement: HOLD zone prevents frequent trading from minor price fluctuations
 *
 * @param data - Combined stock data
 * @returns Algorithm result with verdict and adjusted Graham value
 */
export function calculateGrahamAnalysis(
  data: CombinedStockData
): AlgorithmResult {
  const { market_status, financial_history } = data;
  const hist = financial_history;

  if (hist.length === 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'No historical data available',
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

  // Get latest year data
  const latestYear = hist[hist.length - 1];
  const eps = latestYear.eps;

  // Check for negative earnings
  if (eps <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Negative earnings - Graham formula requires positive EPS',
      analysis_summary: {
        trigger_code: 'AVOID_NO_EARNINGS',
        key_factors: { current_eps: eps },
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
    };
  }

  // Calculate 3-year average EPS growth rate
  const eps_t0 = hist[hist.length - 1].eps; // Latest
  const eps_t2 = hist[0].eps; // Oldest
  const yearsSpan = hist.length - 1;

  let epsGrowthRate = 0;

  // Calculate growth rate if we have valid data
  if (eps_t2 > 0 && yearsSpan > 0) {
    const rawGrowth = calculateCAGR(eps_t2, eps_t0, yearsSpan) * 100;
    // Use minimum 3% growth to avoid zero valuation
    epsGrowthRate = Math.max(rawGrowth, 3.0);
  } else {
    // Default to 3% if historical data is invalid
    epsGrowthRate = 3.0;
  }

  // Calculate Adjusted Graham Number using growth-adjusted formula
  const grahamNumber = calculateAdjustedGrahamValuation(eps, epsGrowthRate);

  // Get current price
  const current_price = market_status.current_price;

  // Verdict with 4-stage logic (STRONG_BUY - BUY - HOLD - SELL)
  let verdict: AlgorithmResult['verdict'];
  const marginPrice = grahamNumber * 0.67;        // 안전마진 가격 (33% 할인)
  const overvalueThreshold = grahamNumber * 1.2;  // 과대평가 기준 (20% 프리미엄)

  if (current_price < marginPrice) {
    verdict = 'STRONG_BUY';  // 33% 이상 저렴 (대바겐세일)
  } else if (current_price < grahamNumber) {
    verdict = 'BUY';         // 적정가보다 저렴 (매수 유효)
  } else if (current_price < overvalueThreshold) {
    verdict = 'HOLD';        // 적정가 ~ 20% 오버슈팅 (보유)
  } else {
    verdict = 'SELL';        // 20% 이상 비쌈 (매도)
  }

  // Build logic explanation based on verdict
  let logic: string;
  if (verdict === 'STRONG_BUY') {
    const discount = ((1 - current_price / grahamNumber) * 100).toFixed(0);
    logic = `Deep value: ${discount}% discount to fair value $${grahamNumber.toFixed(2)}`;
  } else if (verdict === 'BUY') {
    logic = `Fair value buy: Price below Graham Number $${grahamNumber.toFixed(2)}`;
  } else if (verdict === 'HOLD') {
    logic = `Hold zone: Price slightly above fair value but within 20% tolerance ($${grahamNumber.toFixed(2)} - $${overvalueThreshold.toFixed(2)})`;
  } else {
    const premium = ((current_price / grahamNumber - 1) * 100).toFixed(0);
    logic = `Overvalued: Price ${premium}% above fair value $${grahamNumber.toFixed(2)}`;
  }

  // Determine trigger code
  let trigger_code: string;
  if (verdict === 'STRONG_BUY') trigger_code = 'BUY_DEEP_VALUE';
  else if (verdict === 'BUY') trigger_code = 'BUY_FAIR_VALUE';
  else if (verdict === 'HOLD') trigger_code = 'HOLD_MODERATE_PREMIUM';
  else trigger_code = 'SELL_OVERPRICED';

  return {
    verdict,
    target_price: grahamNumber * 0.67, // 안전마진 가격을 목표가로
    sell_price: grahamNumber * 1.2, // 과대평가 기준을 매도가로 (20% 프리미엄)
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        eps: parseFloat(eps.toFixed(2)),
        eps_growth_rate: parseFloat(epsGrowthRate.toFixed(1)),
        graham_number: parseFloat(grahamNumber.toFixed(2)),
      },
    },
    price_guide: {
      buy_zone_max: grahamNumber, // 적정가까지 매수 유효
      profit_zone_min: grahamNumber * 1.2, // 20% 오버슈팅 시 매도 고려
      stop_loss: null,
    },
    metric_name: 'Graham Number',
    metric_value: grahamNumber,
    fair_price: grahamNumber * 0.67, // Graham의 Fair Price는 target_price (안전마진 가격)
  };
}

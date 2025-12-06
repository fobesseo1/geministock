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
 * Benjamin Graham Strategy: Growth-Adjusted Value
 *
 * Approach:
 * 1. Calculate 3-year average EPS growth rate (g)
 * 2. Adjust multiplier based on growth (10% or less: 2x, 100% or more: 1x, linear in between)
 * 3. Graham Formula: V = EPS * (8.5 + multiplier * g)
 * 4. Apply 33% safety margin (0.67x multiplier) for target price
 *
 * Verdict:
 * - STRONG BUY: Price < Graham Value * 0.67
 * - BUY: Price < Graham Value
 * - SELL: Price >= Graham Value
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

  // Verdict Standardization (언더스코어 통일)
  let verdict: AlgorithmResult['verdict'];

  if (current_price < grahamNumber * 0.67) {
    verdict = 'STRONG_BUY';
  } else if (current_price < grahamNumber) {
    verdict = 'BUY';
  } else {
    verdict = 'SELL';
  }

  // Build logic explanation
  const logic = `EPS $${eps.toFixed(2)}, 성장률 ${epsGrowthRate.toFixed(1)}% 반영 → 적정가 $${grahamNumber.toFixed(2)}`;

  // Determine trigger code
  let trigger_code: string;
  if (verdict === 'STRONG_BUY') trigger_code = 'BUY_DEEP_VALUE';
  else if (verdict === 'BUY') trigger_code = 'BUY_FAIR_VALUE';
  else trigger_code = 'SELL_OVERPRICED';

  return {
    verdict,
    target_price: grahamNumber * 0.67, // 안전마진 가격을 목표가로
    sell_price: grahamNumber, // 적정가를 매도가로
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
      buy_zone_max: grahamNumber * 0.67, // 안전마진 가격
      profit_zone_min: grahamNumber, // 적정가
      stop_loss: null,
    },
    metric_name: 'Graham Number',
    metric_value: grahamNumber,
  };
}

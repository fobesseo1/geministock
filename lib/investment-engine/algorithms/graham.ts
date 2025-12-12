import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { calculateCAGR } from '../utils/flexible-average';

/**
 * Helper: Calculate Adjusted Graham Valuation
 * Formula: V = EPS * (8.5 + multiplier * g)
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
 * [Modified] Applies 'Market Cap Based Growth Cap' to prevent huge valuation for mega-caps
 */
export function calculateGrahamAnalysis(data: CombinedStockData): AlgorithmResult {
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

  let rawGrowth = 0;
  let isAdjusted = false;

  // Calculate raw growth rate
  if (eps_t2 > 0 && yearsSpan > 0) {
    rawGrowth = calculateCAGR(eps_t2, eps_t0, yearsSpan) * 100;
    // Use minimum 3% growth
    if (rawGrowth < 3.0) {
      rawGrowth = 3.0;
      isAdjusted = true;
    }
  } else {
    rawGrowth = 3.0;
    isAdjusted = true;
  }

  // Step 2: Apply Market Cap Based Growth Cap (체급별 상한선)
  // 그레이엄 공식은 성장률에 매우 민감하므로(2*g) 상한선이 더욱 중요함
  const marketCap = market_status.market_cap || 0;
  let maxGrowthCap = 50.0;

  const BILLION = 1000000000;

  if (marketCap > 100 * BILLION) {
    // 1. 초대형주 ($100B 이상): 최대 25% 제한
    maxGrowthCap = 25.0;
  } else if (marketCap > 10 * BILLION) {
    // 2. 대형주 ($10B ~ $100B): 최대 35% 제한
    maxGrowthCap = 35.0;
  } else {
    // 3. 중소형주 ($10B 미만): 최대 50% 제한
    maxGrowthCap = 50.0;
  }

  // 최종 성장률 결정 (Cap 적용)
  const epsGrowthRate = Math.min(rawGrowth, maxGrowthCap);
  const isCapped = rawGrowth > maxGrowthCap;

  // Calculate Adjusted Graham Number
  // [Safety Cap] 계산된 가치가 PER 50배를 넘지 않도록 2차 방어선 구축 (선택 사항)
  let grahamNumber = calculateAdjustedGrahamValuation(eps, epsGrowthRate);
  const maxValuation = eps * 50;
  if (grahamNumber > maxValuation) {
    grahamNumber = maxValuation;
  }

  // Get current price
  const current_price = market_status.current_price;

  // Verdict with 4-stage logic (STRONG_BUY - BUY - HOLD - SELL)
  let verdict: AlgorithmResult['verdict'];
  const marginPrice = grahamNumber * 0.67; // 안전마진 가격 (33% 할인)
  const overvalueThreshold = grahamNumber * 1.2; // 과대평가 기준 (20% 프리미엄)

  if (current_price < marginPrice) {
    verdict = 'STRONG_BUY'; // 33% 이상 저렴
  } else if (current_price < grahamNumber) {
    verdict = 'BUY'; // 적정가보다 저렴
  } else if (current_price < overvalueThreshold) {
    verdict = 'HOLD'; // 적정가 ~ 20% 오버슈팅
  } else {
    verdict = 'SELL'; // 20% 이상 비쌈
  }

  // Build logic explanation
  let growthText = `${epsGrowthRate.toFixed(1)}%`;
  if (isCapped) {
    growthText += ` (capped)`;
  }

  let logic: string;
  if (verdict === 'STRONG_BUY') {
    const discount = ((1 - current_price / grahamNumber) * 100).toFixed(0);
    logic = `Deep value (Growth ${growthText}): ${discount}% discount to fair value $${grahamNumber.toFixed(
      2
    )}`;
  } else if (verdict === 'BUY') {
    logic = `Fair value buy (Growth ${growthText}): Price below Graham Number $${grahamNumber.toFixed(
      2
    )}`;
  } else if (verdict === 'HOLD') {
    logic = `Hold zone: Price within tolerance ($${grahamNumber.toFixed(
      2
    )} - $${overvalueThreshold.toFixed(2)})`;
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
    sell_price: grahamNumber * 1.2, // 과대평가 기준을 매도가로
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
    fair_price: grahamNumber,
  };
}

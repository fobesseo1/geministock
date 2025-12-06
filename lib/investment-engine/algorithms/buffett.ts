import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { getFlexibleAverage, calculateCAGR } from '../utils/flexible-average';

/**
 * Warren Buffett Strategy: Quality & Value
 * [Modified] Applies Min 3% Growth Rule to prevent zero valuation
 */
export function calculateBuffettAnalysis(data: CombinedStockData): AlgorithmResult {
  const { market_status, financial_history } = data;
  const hist = financial_history;

  if (hist.length === 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Insufficient historical data',
    };
  }

  // Step 1: Calculate average ROE
  const avgROE = getFlexibleAverage([hist[0]?.roe, hist[1]?.roe, hist[2]?.roe]);

  // ROE가 아예 없거나 음수면 가치 산정 불가 (단, 성장률 보정과는 별개)
  if (avgROE === null || avgROE <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Negative ROE - cannot project earnings',
    };
  }

  // Step 2: Calculate historical EPS growth rate with Safety Net
  const eps_t0 = hist[hist.length - 1].eps; // Latest
  const eps_t2 = hist[0].eps; // Oldest
  const yearsSpan = hist.length - 1;

  // 현재 EPS가 적자면 미래 가치 산출 불가 (이건 N/A가 맞음)
  if (eps_t0 <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Current EPS is negative',
    };
  }

  let epsGrowthRate = 0;
  let isGrowthAdjusted = false;

  // 과거 EPS가 적자였거나 데이터가 이상하면 -> 기본 성장률 3% 적용
  if (eps_t2 <= 0 || yearsSpan <= 0) {
    epsGrowthRate = 3.0;
    isGrowthAdjusted = true;
  } else {
    // 정상 계산 후 3% 미만이면 3%로 보정
    const rawGrowth = calculateCAGR(eps_t2, eps_t0, yearsSpan) * 100;
    if (rawGrowth < 3.0) {
      epsGrowthRate = 3.0;
      isGrowthAdjusted = true;
    } else {
      epsGrowthRate = rawGrowth;
    }
  }

  // Step 3: Compounding rate (Min of ROE vs Growth*1.5)
  // 3% 보정된 성장률을 사용하여 목표가가 0원이 되는 것을 방지
  const compoundingRate = Math.min(avgROE, epsGrowthRate * 1.5);
  const cappedRate = Math.min(compoundingRate, 40); // Max cap 40%

  // Step 4: Average PER (Capped)
  const avgPER = getFlexibleAverage([hist[0]?.per, hist[1]?.per, hist[2]?.per]);
  if (avgPER === null || avgPER <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Invalid historical PER',
    };
  }
  const cappedPER = Math.min(avgPER, 50);

  // Step 5: Project Value
  const futureEPS = eps_t0 * Math.pow(1 + cappedRate / 100, 10);
  const futurePrice = futureEPS * cappedPER;
  const buyPrice = futurePrice / Math.pow(1.15, 10); // Discount 15%

  // Step 6: Verdict Standardization (5 levels)
  const current_price = market_status.current_price;
  let verdict: AlgorithmResult['verdict'];

  // 목표가보다 20% 더 싸면 강력 매수
  if (current_price < buyPrice * 0.8) verdict = 'STRONG_BUY';
  else if (current_price < buyPrice) verdict = 'BUY';
  else if (current_price < buyPrice * 1.2) verdict = 'HOLD';
  else verdict = 'SELL';

  // Logic description update
  const growthLabel = isGrowthAdjusted
    ? `Growth ${epsGrowthRate.toFixed(1)}% (adj min)`
    : `Growth ${epsGrowthRate.toFixed(1)}%`;

  const logic = `ROE ${avgROE.toFixed(1)}%, ${growthLabel} → compounding ${cappedRate.toFixed(
    1
  )}%, PER ${avgPER.toFixed(1)}x → target $${buyPrice.toFixed(2)}`;

  return {
    verdict,
    target_price: buyPrice,
    sell_price: buyPrice * 1.2, // 이 가격 넘으면 비싸다고 판단
    logic,
    metric_name: 'Compounding Rate',
    metric_value: cappedRate,
  };
}

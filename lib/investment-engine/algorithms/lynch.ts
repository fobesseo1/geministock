import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { calculateCAGR } from '../utils/flexible-average';

/**
 * Peter Lynch Strategy: GARP
 * [Modified] Applies Min 3% Growth Rule to enable PEG calculation for low/neg growth
 */
export function calculateLynchAnalysis(data: CombinedStockData): AlgorithmResult {
  const { market_status, financial_history } = data;
  const hist = financial_history;

  if (hist.length < 2) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Insufficient data for growth calc',
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

  const eps_t0 = hist[hist.length - 1].eps;
  const eps_t2 = hist[0].eps;

  // 현재 EPS가 적자면 PER 계산 불가 -> N/A
  if (eps_t0 <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Current EPS is negative',
      analysis_summary: {
        trigger_code: 'DATA_INVALID',
        key_factors: { current_eps: eps_t0 },
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
    };
  }

  // Step 1: Calculate Growth Rate with Floor
  let growthRate = 0;
  let isAdjusted = false;

  // 과거 EPS가 음수라 계산 불가하거나, 계산된 값이 3% 미만이면 -> 3% 고정
  if (eps_t2 <= 0) {
    growthRate = 3.0;
    isAdjusted = true;
  } else {
    const rawGrowth = calculateCAGR(eps_t2, eps_t0, 2) * 100;
    if (rawGrowth < 3.0) {
      growthRate = 3.0; // Floor at 3% (Inflation rate)
      isAdjusted = true;
    } else {
      growthRate = rawGrowth;
    }
  }

  // Step 2: PEG Ratio
  const ttm_per = market_status.ttm_per;
  if (ttm_per === null || ttm_per <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Invalid PER',
      analysis_summary: {
        trigger_code: 'DATA_INVALID',
        key_factors: { ttm_per: ttm_per || 0 },
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
    };
  }

  // 성장률 3%로 나눴을 때 PER가 높으면 자연스럽게 PEG가 높아져서 SELL이 나옴
  // 예: PER 30 / Growth 3 = PEG 10 (Strong Sell) -> 합리적 결과
  const peg = ttm_per / growthRate;
  const fairValue = eps_t0 * growthRate; // Lynch Fair Value = EPS * Growth

  // Step 3: Verdict Standardization (언더스코어 통일)
  let verdict: AlgorithmResult['verdict'];
  if (peg < 0.5) verdict = 'STRONG_BUY';
  else if (peg < 1.0) verdict = 'BUY';
  else if (peg < 1.5) verdict = 'HOLD';
  else verdict = 'SELL';

  // Step 4: Debt Filter
  const debt_to_equity = market_status.debt_to_equity ?? 0;
  let debtNote = '';

  if (debt_to_equity > 150) {
    debtNote = ' (debt penalty)';
    if (verdict === 'STRONG_BUY') verdict = 'BUY';
    else if (verdict === 'BUY') verdict = 'HOLD';
    else if (verdict === 'HOLD') verdict = 'SELL';
  }

  const growthText = isAdjusted
    ? `${growthRate.toFixed(1)}% (min adj)`
    : `${growthRate.toFixed(1)}%`;

  const logic = `Growth ${growthText}, PER ${ttm_per.toFixed(1)} → PEG ${peg.toFixed(
    2
  )}${debtNote}`;

  // Determine trigger code (debt warning takes priority)
  let trigger_code: string;
  if (debt_to_equity > 200) {
    trigger_code = 'SELL_DEBT_RISK'; // 부채비율 200% 이상: 위험
  } else if (debt_to_equity > 150) {
    // verdict가 SELL이면 강력 경고, 아니면 일반 경고
    trigger_code = verdict === 'SELL' ? 'SELL_DEBT_RISK' : 'HOLD_DEBT_WARNING';
  } else if (peg < 0.5) {
    trigger_code = 'BUY_FAST_GROWER';
  } else if (peg < 1.0) {
    trigger_code = 'BUY_STALWART';
  } else if (peg < 1.5) {
    trigger_code = 'HOLD_FAIR_VALUE';
  } else {
    trigger_code = 'SELL_PEG_EXPENSIVE';
  }

  // 매도 기준가: PEG 1.5가 되는 지점 (EPS * Growth * 1.5)
  const sellPriceCalc = eps_t0 * growthRate * 1.5;

  return {
    verdict,
    target_price: fairValue, // PEG 1.0 기준
    sell_price: sellPriceCalc, // PEG 1.5 기준
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        growth_rate: parseFloat(growthRate.toFixed(1)),
        peg: parseFloat(peg.toFixed(2)),
        debt_to_equity: debt_to_equity,
      },
    },
    price_guide: {
      buy_zone_max: fairValue, // PEG 1.0 기준가
      profit_zone_min: sellPriceCalc, // PEG 1.5 기준가
      stop_loss: null,
    },
    metric_name: 'PEG Ratio',
    metric_value: peg,
    fair_price: fairValue,
  };
}

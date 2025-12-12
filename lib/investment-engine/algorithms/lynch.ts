import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { calculateCAGR } from '../utils/flexible-average';

/**
 * Peter Lynch Strategy: GARP
 * [Modified] Applies Min 3% Growth Rule to enable PEG calculation for low/neg growth
 * [Updated] Uses calculated PER (Price / EPS) for consistency
 * [New] Applies 'Market Cap Based Growth Cap' to prevent unrealistic targets for mega-caps
 */
export function calculateLynchAnalysis(data: CombinedStockData): AlgorithmResult {
  const { market_status, financial_history } = data;
  const hist = financial_history;

  // 데이터 부족 체크
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

  const eps_t0 = hist[hist.length - 1].eps; // 최신 연간 EPS
  const eps_t2 = hist[0].eps; // 2년 전 EPS
  const current_price = market_status.current_price;

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

  // Step 1: Calculate Raw Growth Rate with Floor
  let rawGrowth = 0;
  let isAdjusted = false;

  if (eps_t2 <= 0) {
    rawGrowth = 3.0;
    isAdjusted = true;
  } else {
    const calculated = calculateCAGR(eps_t2, eps_t0, 2) * 100;
    if (calculated < 3.0) {
      rawGrowth = 3.0; // Floor at 3% (Inflation rate)
      isAdjusted = true;
    } else {
      rawGrowth = calculated;
    }
  }

  // Step 2: Apply Market Cap Based Growth Cap (체급별 상한선)
  // 대형주일수록 기저효과로 인한 일시적 고성장을 필터링하기 위함
  const marketCap = market_status.market_cap || 0;
  let maxGrowthCap = 50.0; // 기본값: 중소형주는 최대 50%까지 인정

  // 시가총액 단위가 달러(USD) 기준이라고 가정
  const BILLION = 1000000000;

  if (marketCap > 100 * BILLION) {
    // 1. 초대형주 ($100B 이상): 메타, 구글 등 -> 최대 25% (보수적)
    // 덩치가 너무 커서 25% 넘기도 힘듦. 기저효과 착시 차단.
    maxGrowthCap = 25.0;
  } else if (marketCap > 10 * BILLION) {
    // 2. 대형주 ($10B ~ $100B): S&P500 중상위권 -> 최대 35%
    maxGrowthCap = 35.0;
  } else {
    // 3. 중소형주 ($10B 미만): -> 최대 50% (Fast Grower 인정)
    maxGrowthCap = 50.0;
  }

  // 최종 성장률 결정 (Cap 적용)
  const growthRate = Math.min(rawGrowth, maxGrowthCap);

  // 캡이 적용되었는지 표시 (UI 로직 설명용)
  const isCapped = rawGrowth > maxGrowthCap;

  // Step 3: Calculate PER & PEG Ratio (Direct Calculation)
  // 외부 ttm_per 대신 현재가/EPS로 직접 계산하여 가격 정합성 확보
  let calculated_per = 0;

  if (current_price > 0 && eps_t0 > 0) {
    calculated_per = current_price / eps_t0;
  } else {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Invalid Price or EPS for PER calculation',
      analysis_summary: {
        trigger_code: 'DATA_INVALID',
        key_factors: { current_price, current_eps: eps_t0 },
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
    };
  }

  // PEG 계산
  const peg = calculated_per / growthRate;

  // Lynch Fair Value = EPS * Growth (PEG 1.0 기준)
  const fairValue = eps_t0 * growthRate;

  // Step 4: Verdict Standardization
  let verdict: AlgorithmResult['verdict'];

  // 우량주 프리미엄을 고려하여 BUY 기준을 1.2까지 완화
  if (peg < 0.5) verdict = 'STRONG_BUY';
  else if (peg < 1.2) verdict = 'BUY';
  else if (peg < 1.5) verdict = 'HOLD';
  else verdict = 'SELL';

  // Step 5: Debt Filter
  const debt_to_equity = market_status.debt_to_equity ?? 0;
  let debtNote = '';

  if (debt_to_equity > 150) {
    debtNote = ' (debt penalty)';
    // 부채비율이 높으면 등급 강등
    if (verdict === 'STRONG_BUY') verdict = 'BUY';
    else if (verdict === 'BUY') verdict = 'HOLD';
    else if (verdict === 'HOLD') verdict = 'SELL';
  }

  // 로직 설명 텍스트 구성
  let growthText = `${growthRate.toFixed(1)}%`;
  if (isCapped) {
    growthText += ` (capped from ${rawGrowth.toFixed(0)}%)`;
  } else if (isAdjusted) {
    growthText += ` (min adj)`;
  }

  const logic = `Growth ${growthText}, PER ${calculated_per.toFixed(1)} → PEG ${peg.toFixed(
    2
  )}${debtNote}`;

  // Determine trigger code
  let trigger_code: string;
  if (debt_to_equity > 200) {
    trigger_code = 'SELL_DEBT_RISK';
  } else if (debt_to_equity > 150) {
    trigger_code = verdict === 'SELL' ? 'SELL_DEBT_RISK' : 'HOLD_DEBT_WARNING';
  } else if (peg < 0.5) {
    trigger_code = 'BUY_FAST_GROWER';
  } else if (peg < 1.2) {
    trigger_code = 'BUY_STALWART';
  } else if (peg < 1.5) {
    trigger_code = 'HOLD_FAIR_VALUE';
  } else {
    trigger_code = 'SELL_PEG_EXPENSIVE';
  }

  // 가격 가이드 계산
  const buyZoneMax = eps_t0 * growthRate * 1.2; // PEG 1.2
  const sellPriceCalc = eps_t0 * growthRate * 1.5; // PEG 1.5

  return {
    verdict,
    target_price: fairValue, // 기준점: PEG 1.0 가격 (적정가)
    sell_price: sellPriceCalc, // 매도 고려 가격 (PEG 1.5)
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        growth_rate: parseFloat(growthRate.toFixed(1)),
        peg: parseFloat(peg.toFixed(2)),
        debt_to_equity: debt_to_equity,
        calculated_per: parseFloat(calculated_per.toFixed(1)),
      },
    },
    price_guide: {
      buy_zone_max: buyZoneMax,
      profit_zone_min: sellPriceCalc,
      stop_loss: null,
    },
    metric_name: 'PEG Ratio',
    metric_value: peg,
    fair_price: fairValue, // 항상 PEG 1.0 기준
  };
}

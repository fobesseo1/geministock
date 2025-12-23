import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { getFlexibleAverage, safeDivide } from '../utils/flexible-average';
import { calculateDisplayPrice } from '@/lib/utils/price-adjuster';

/**
 * Howard Marks Strategy: Cycle / Contrarian
 *
 * Approach:
 * 1. Price Position: Where is price in 52-week range?
 * 2. Value Position: Is PBR below historical average?
 *
 * Verdict:
 * - STRONG BUY: Bottom 20% of range + Undervalued
 * - BUY: Bottom 20% of range only
 * - WARNING (SELL): Top 20% of range (overheated)
 * - HOLD: Middle range
 *
 * Note: No target price - focus on risk warnings
 *
 * @param data - Combined stock data
 * @returns Algorithm result with verdict and risk warnings
 */
export function calculateMarksAnalysis(
  data: CombinedStockData
): AlgorithmResult {
  const { market_status, financial_history } = data;
  const hist = financial_history;

  const current_price = market_status.current_price;
  const week_52_low = market_status['52w_low'];
  const week_52_high = market_status['52w_high'];

  // Validate price data
  if (current_price <= 0 || week_52_low <= 0 || week_52_high <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Missing 52-week price range data',
      analysis_summary: {
        trigger_code: 'DATA_INSUFFICIENT',
        key_factors: {},
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
      display_price: null,
      price_status: 'NORMAL',
      win_rate: 50,
    };
  }

  if (week_52_high <= week_52_low) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Invalid 52-week price range',
      analysis_summary: {
        trigger_code: 'DATA_INVALID',
        key_factors: { week_52_low, week_52_high },
      },
      price_guide: {
        buy_zone_max: null,
        profit_zone_min: null,
        stop_loss: null,
      },
      display_price: null,
      price_status: 'NORMAL',
      win_rate: 50,
    };
  }

  // Step 1: Calculate price position in 52-week range
  const priceRange = week_52_high - week_52_low;
  const priceRank = safeDivide(current_price - week_52_low, priceRange);

  // Step 2: Calculate value position (PBR comparison)
  let isUndervalued = false;

  if (hist.length > 0) {
    const pbrValues = hist.map((h) => h.pbr);
    const avgPBR = getFlexibleAverage(pbrValues);
    const currentPBR = hist[hist.length - 1].pbr;

    if (avgPBR !== null && avgPBR > 0) {
      // Undervalued if current PBR < 80% of average
      isUndervalued = currentPBR < avgPBR * 0.8;
    }
  }

  // Step 3: Determine verdict (Standardized)
  let verdict: AlgorithmResult['verdict'];
  let logic: string;

  if (priceRank < 0.2 && isUndervalued) {
    verdict = 'STRONG_BUY';
    logic = `Price at ${(priceRank * 100).toFixed(1)}% of 52-week range (bottom) + undervalued - cycle bottom opportunity`;
  } else if (priceRank < 0.2) {
    verdict = 'BUY';
    logic = `Price at ${(priceRank * 100).toFixed(1)}% of 52-week range (bottom) - potential cycle bottom`;
  } else if (priceRank > 0.8) {
    verdict = 'SELL'; // Changed from WARNING
    logic = `Price at ${(priceRank * 100).toFixed(1)}% of 52-week range (top) - cycle top risk, consider taking profits`;
  } else {
    verdict = 'HOLD';
    logic = `Price at ${(priceRank * 100).toFixed(1)}% of 52-week range (mid-cycle) - neutral positioning`;
  }

  // Determine trigger code
  let trigger_code: string;
  if (verdict === 'STRONG_BUY') trigger_code = 'BUY_PANIC_BOTTOM';
  else if (verdict === 'BUY') trigger_code = 'BUY_CYCLE_BOTTOM';
  else if (verdict === 'SELL') trigger_code = 'SELL_EUPHORIA_TOP';
  else trigger_code = 'HOLD_MID_CYCLE';

  const fairPrice = week_52_low + priceRange * 0.2; // buy_zone_max

  // [V2] Win Rate Calculation - Marks Strategy
  // Base: 50, adjusts based on 52-week price position and undervaluation
  let winRate = 50;

  // Price Rank Score (52주 가격 위치)
  if (priceRank < 0.1) winRate += 40; // 공포 (바닥권 10% 이내)
  else if (priceRank < 0.3) winRate += 20; // 무릎 (하위 30%)
  else if (priceRank > 0.8) winRate -= 30; // 어깨 (상위 20%)
  else if (priceRank > 0.9) winRate -= 45; // 환희 (상투권 10% 이내)

  // Undervaluation Bonus
  if (isUndervalued) winRate += 10; // 저평가 보너스

  // Clamp to 1-99%
  winRate = Math.min(99, Math.max(1, Math.round(winRate)));

  // ---------------------------------------------------------
  // [UX 개선]
  // 기존: target_price가 week_52_low(바닥)로 되어 있음
  // 변경: BUY 시 목표가는 '박스권 상단(Profit Zone)' 또는 '중간값'이어야 함
  // ---------------------------------------------------------
  const profitTarget = week_52_high; // 박스권 매매의 목표는 상단
  const midValue = week_52_low + priceRange * 0.5; // 중간값

  let finalDisplayPrice: number;

  if (verdict === 'STRONG_BUY' || verdict === 'BUY') {
    finalDisplayPrice = profitTarget; // "바닥 잡았으니 천장까지 가보자"
  } else {
    finalDisplayPrice = week_52_low; // "떨어질 때까지 기다려라" (매수 대기가)
  }

  // [V2] Display Price Calculation (Soft Cap/Floor)
  const { display_price, price_status } = calculateDisplayPrice(current_price, finalDisplayPrice);

  return {
    verdict,
    target_price: finalDisplayPrice, // UX 개선된 목표가 사용
    sell_price: week_52_high, // Top of 52-week range (sell opportunity)
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        cycle_position: parseFloat(priceRank.toFixed(2)),
        is_undervalued: isUndervalued,
      },
    },
    price_guide: {
      buy_zone_max: fairPrice, // 하위 20% 구간
      profit_zone_min: week_52_low + priceRange * 0.8, // 상위 20% 구간
      stop_loss: null,
    },
    display_price,
    price_status,
    win_rate: winRate,
    metric_name: 'Price Position',
    metric_value: priceRank * 100, // Position in range as percentage
    fair_price: fairPrice, // Marks의 Fair Price는 buy_zone_max (하위 20% 상한선)
  };
}

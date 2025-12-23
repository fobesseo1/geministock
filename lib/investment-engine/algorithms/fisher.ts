import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { getFlexibleAverage } from '../utils/flexible-average';
import { calculateDisplayPrice } from '@/lib/utils/price-adjuster';

/**
 * Ken Fisher Strategy: Sales-Based Valuation
 *
 * Approach:
 * 1. Calculate 3-year average PSR and max PSR
 * 2. Buy target = SPS * Avg PSR
 * 3. Sell target = SPS * Max PSR (historical band top)
 *
 * Verdict (4 Stages):
 * - STRONG_BUY: Current PSR < Avg PSR * 0.85 (15% discount - rare bargain)
 * - BUY: Current PSR < Avg PSR (below average valuation)
 * - HOLD: Avg PSR < Current PSR < Max PSR (within historical range)
 * - SELL: Current PSR > Max PSR (overheated)
 *
 * Advantage: Works with loss-making companies (revenue-based)
 * Key Improvement: 15% discount threshold prevents false STRONG_BUY signals
 *
 * @param data - Combined stock data
 * @returns Algorithm result with verdict and price targets
 */
export function calculateFisherAnalysis(
  data: CombinedStockData
): AlgorithmResult {
  const { financial_history } = data;
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
      display_price: null,
      price_status: 'NORMAL',
      win_rate: 50,
    };
  }

  // Extract PSR values (allow 0 for revenue-based metric)
  const psrValues = hist.map((h) => h.psr).filter((v) => v != null);

  if (psrValues.length === 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'No PSR data available',
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

  // Calculate average PSR (allow zero values)
  const avgPSR = getFlexibleAverage(psrValues, { allowZero: true });
  const maxPSR = Math.max(...psrValues);
  const sps = hist[hist.length - 1].sps;

  // [NEW] 실시간 주가 기준 PSR 재계산 (데이터 불일치 방지)
  const current_price = data.market_status.current_price;
  const realTimePSR = current_price / sps;

  if (avgPSR === null || maxPSR <= 0 || sps <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Invalid PSR or SPS data',
      analysis_summary: {
        trigger_code: 'DATA_INVALID',
        key_factors: { avg_psr: avgPSR || 0, max_psr: maxPSR, sps },
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

  // Calculate target prices
  const buyTarget = sps * avgPSR; // 적정가 (평균 PSR)
  const sellTarget = sps * maxPSR; // 상단 밴드 (최대 PSR)

  // Verdict 로직 수정 (realTimePSR 사용)
  let verdict: AlgorithmResult['verdict'];

  if (realTimePSR < avgPSR * 0.85) {
    verdict = 'STRONG_BUY'; // 평균보다 15% 이상 쌀 때 (신뢰도 높은 바겐세일)
  } else if (realTimePSR < avgPSR) {
    verdict = 'BUY';
  } else if (realTimePSR < maxPSR) {
    verdict = 'HOLD';
  } else {
    verdict = 'SELL';
  }

  // ---------------------------------------------------------
  // [UX 개선] 사용자 직관성을 위한 Display Price 조정
  // Fisher 전략은 "평균으로의 회귀"를 노리므로, BUY일 때는
  // 최소한 '평균 가격(buyTarget)'을 보여주면 되지만,
  // 현재가가 이미 평균에 근접했다면 상단 밴드(Max)를 보여주는 게 나음
  // ---------------------------------------------------------
  let finalDisplayPrice = buyTarget;

  // 만약 BUY 상태인데 현재가가 목표가(평균)보다 높거나 비슷하다면?
  // (데이터 오차로 인해 발생 가능) -> 상단 밴드(Sell Target)를 목표로 보여줌
  if ((verdict === 'BUY' || verdict === 'STRONG_BUY') && current_price >= buyTarget * 0.95) {
    finalDisplayPrice = sellTarget; // 다음 목표인 상단 밴드로 시선 유도
  }

  // Build logic explanation (realTimePSR 사용)
  const logic = `PSR ${realTimePSR.toFixed(2)} vs avg ${avgPSR.toFixed(2)} → buy target $${buyTarget.toFixed(2)}, max PSR ${maxPSR.toFixed(2)} → sell at $${sellTarget.toFixed(2)}`;

  // Determine trigger code
  let trigger_code: string;
  if (verdict === 'STRONG_BUY') trigger_code = 'BUY_PSR_BARGAIN';
  else if (verdict === 'BUY') trigger_code = 'BUY_PSR_FAIR';
  else if (verdict === 'HOLD') trigger_code = 'HOLD_PSR_BAND';
  else trigger_code = 'SELL_PSR_EXPENSIVE';

  // [V2] Win Rate Calculation - Fisher Strategy
  // Base: 50, adjusts based on historical PSR position (realTimePSR 사용)
  let winRate = 50;
  const psrRatio = realTimePSR / avgPSR;

  // PSR Ratio Score (역사적 평균 대비 현재 위치)
  if (psrRatio < 0.75) winRate += 35; // 역사적 저점 (25% 이상 저렴)
  else if (psrRatio < 1.0) winRate += 15; // 평균보다 저렴
  else if (psrRatio > 1.3) winRate -= 20; // 평균보다 30% 이상 비쌈
  else if (psrRatio > 1.5) winRate -= 40; // 평균보다 50% 이상 비쌈 (고점)

  // Clamp to 1-99%
  winRate = Math.min(99, Math.max(1, Math.round(winRate)));

  // [V2] Display Price Calculation (Soft Cap/Floor) - finalDisplayPrice 사용
  const { display_price, price_status } = calculateDisplayPrice(
    current_price,
    finalDisplayPrice
  );

  return {
    verdict,
    target_price: finalDisplayPrice, // UX 개선된 목표가 사용
    sell_price: sellTarget,
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        current_psr: parseFloat(realTimePSR.toFixed(2)),
        avg_psr: parseFloat(avgPSR.toFixed(2)),
        max_psr: parseFloat(maxPSR.toFixed(2)),
      },
    },
    price_guide: {
      buy_zone_max: buyTarget,
      profit_zone_min: sellTarget,
      stop_loss: null,
    },
    display_price,
    price_status,
    win_rate: winRate,
    metric_name: 'PSR',
    metric_value: realTimePSR,
    fair_price: buyTarget, // Fisher의 Fair Price는 buyTarget (평균 PSR 기준)
  };
}

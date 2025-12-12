import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { getFlexibleAverage } from '../utils/flexible-average';

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
    };
  }

  // Calculate average PSR (allow zero values)
  const avgPSR = getFlexibleAverage(psrValues, { allowZero: true });
  const maxPSR = Math.max(...psrValues);
  const currentPSR = hist[hist.length - 1].psr;
  const sps = hist[hist.length - 1].sps;

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
    };
  }

  // Calculate target prices
  const buyTarget = sps * avgPSR;
  const sellTarget = sps * maxPSR;

  // Verdict Standardization: Add STRONG_BUY condition
  let verdict: AlgorithmResult['verdict'];

  if (currentPSR < avgPSR * 0.85) {
    verdict = 'STRONG_BUY'; // 평균보다 15% 이상 쌀 때 (신뢰도 높은 바겐세일)
  } else if (currentPSR < avgPSR) {
    verdict = 'BUY';
  } else if (currentPSR < maxPSR) {
    verdict = 'HOLD';
  } else {
    verdict = 'SELL';
  }

  // Build logic explanation
  const logic = `PSR ${currentPSR.toFixed(2)} vs avg ${avgPSR.toFixed(2)} → buy target $${buyTarget.toFixed(2)}, max PSR ${maxPSR.toFixed(2)} → sell at $${sellTarget.toFixed(2)}`;

  // Determine trigger code
  let trigger_code: string;
  if (verdict === 'STRONG_BUY') trigger_code = 'BUY_PSR_BARGAIN';
  else if (verdict === 'BUY') trigger_code = 'BUY_PSR_FAIR';
  else if (verdict === 'HOLD') trigger_code = 'HOLD_PSR_BAND';
  else trigger_code = 'SELL_PSR_EXPENSIVE';

  return {
    verdict,
    target_price: buyTarget,
    sell_price: sellTarget,
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        current_psr: parseFloat(currentPSR.toFixed(2)),
        avg_psr: parseFloat(avgPSR.toFixed(2)),
        max_psr: parseFloat(maxPSR.toFixed(2)),
      },
    },
    price_guide: {
      buy_zone_max: buyTarget,
      profit_zone_min: sellTarget,
      stop_loss: null,
    },
    metric_name: 'PSR',
    metric_value: currentPSR,
    fair_price: buyTarget, // Fisher의 Fair Price는 target_price
  };
}

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
 * Verdict:
 * - BUY: Current PSR < Avg PSR
 * - HOLD: Avg PSR < Current PSR < Max PSR
 * - SELL: Current PSR > Max PSR (overheated)
 *
 * Advantage: Works with loss-making companies (revenue-based)
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
    };
  }

  // Calculate target prices
  const buyTarget = sps * avgPSR;
  const sellTarget = sps * maxPSR;

  // Verdict Standardization: Add STRONG_BUY condition
  let verdict: AlgorithmResult['verdict'];

  if (currentPSR < avgPSR * 0.9) {
    verdict = 'STRONG_BUY'; // 평균보다 10% 이상 쌀 때
  } else if (currentPSR < avgPSR) {
    verdict = 'BUY';
  } else if (currentPSR < maxPSR) {
    verdict = 'HOLD';
  } else {
    verdict = 'SELL';
  }

  // Build logic explanation
  const logic = `PSR ${currentPSR.toFixed(2)} vs avg ${avgPSR.toFixed(2)} → buy target $${buyTarget.toFixed(2)}, max PSR ${maxPSR.toFixed(2)} → sell at $${sellTarget.toFixed(2)}`;

  return {
    verdict,
    target_price: buyTarget,
    sell_price: sellTarget,
    logic,
    metric_name: 'PSR',
    metric_value: currentPSR,
  };
}

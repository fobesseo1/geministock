import type { TTMMetrics } from '@/lib/types/stock-data';

/**
 * Extracts real-time TTM metrics from quoteSummary
 * Only extracts metrics actually used by combineStockData
 *
 * @param quoteSummary - Raw quoteSummary data from Yahoo Finance
 * @returns TTMMetrics - Real-time TTM metrics (per, debt_to_equity)
 */
export function processCurrentMetrics(
  quoteSummary: any
): TTMMetrics {
  return {
    per: quoteSummary.summaryDetail?.trailingPE ?? null,
    debt_to_equity: quoteSummary.financialData?.debtToEquity ?? 0,
  };
}

import type { QuoteSummaryResult } from 'yahoo-finance2';
import type { TechnicalIndicators } from '@/lib/types/stock-data';

/**
 * Extracts technical indicators from quoteSummary
 *
 * @param quoteSummary - Raw quoteSummary data from Yahoo Finance
 * @returns TechnicalIndicators - Technical price indicators
 */
export function processTechnicals(
  quoteSummary: QuoteSummaryResult
): TechnicalIndicators {
  return {
    fifty_two_week_high: quoteSummary.summaryDetail?.fiftyTwoWeekHigh ?? 0,
    fifty_two_week_low: quoteSummary.summaryDetail?.fiftyTwoWeekLow ?? 0,
    two_hundred_day_avg: quoteSummary.summaryDetail?.twoHundredDayAverage ?? 0,
  };
}

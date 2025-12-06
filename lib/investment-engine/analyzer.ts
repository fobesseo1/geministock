import { combineStockData } from '@/lib/data-combiner/stock-data-combiner';
import type { InvestmentAnalysisResult } from '@/lib/types/investment-analysis';
import { calculateBuffettAnalysis } from './algorithms/buffett';
import { calculateLynchAnalysis } from './algorithms/lynch';
import { calculateGrahamAnalysis } from './algorithms/graham';
import { calculateFisherAnalysis } from './algorithms/fisher';
import { calculateDruckenmillerAnalysis } from './algorithms/druckenmiller';
import { calculateMarksAnalysis } from './algorithms/marks';

/**
 * Main orchestrator for investment analysis
 *
 * Runs all 6 legendary investor algorithms in parallel and returns unified results
 *
 * @param ticker - Stock ticker symbol (e.g., "AAPL")
 * @returns Complete investment analysis with all 6 verdicts
 */
export async function analyzeStock(
  ticker: string
): Promise<InvestmentAnalysisResult> {
  // Step 1: Get combined data (Yahoo real-time + local JSON historical)
  const data = await combineStockData(ticker);

  // Step 2: Run all 6 algorithms
  const results = {
    buffett: calculateBuffettAnalysis(data),
    lynch: calculateLynchAnalysis(data),
    graham: calculateGrahamAnalysis(data),
    fisher: calculateFisherAnalysis(data),
    druckenmiller: calculateDruckenmillerAnalysis(data),
    marks: calculateMarksAnalysis(data),
  };

  // Step 3: Format metadata
  const yearsAvailable = data.financial_history.length;
  const yearRange =
    yearsAvailable > 0
      ? `${data.financial_history[0].year}-${data.financial_history[yearsAvailable - 1].year}`
      : 'N/A';

  // Step 4: Return unified result
  return {
    ticker: data.ticker,
    meta: {
      current_price: data.market_status.current_price,
      data_period_used: `${yearsAvailable} years (${yearRange})`,
    },
    results,
  };
}

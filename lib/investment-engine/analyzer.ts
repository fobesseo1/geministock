import { combineStockData } from '@/lib/data-combiner/stock-data-combiner';
import type { InvestmentAnalysisResult, Verdict } from '@/lib/types/investment-analysis';
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

  // Step 4: Generate summary from all verdicts
  const verdicts: Verdict[] = [
    results.buffett.verdict,
    results.lynch.verdict,
    results.graham.verdict,
    results.fisher.verdict,
    results.druckenmiller.verdict,
    results.marks.verdict,
  ];

  // Count verdicts for opinion breakdown
  const verdictCounts = {
    strong_buy: verdicts.filter((v) => v === 'STRONG_BUY').length,
    buy: verdicts.filter((v) => v === 'BUY').length,
    hold: verdicts.filter((v) => v === 'HOLD').length,
    sell: verdicts.filter((v) => v === 'SELL').length,
  };

  // Calculate total score (0-100) based on verdict weights
  // STRONG_BUY=100, BUY=75, HOLD=50, SELL=25, N/A=excluded
  const validVerdicts = verdicts.filter((v) => v !== 'N/A');
  const scores = validVerdicts.map((v) => {
    if (v === 'STRONG_BUY') return 100;
    if (v === 'BUY') return 75;
    if (v === 'HOLD') return 50;
    return 25; // SELL
  });
  const total_score =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 50; // Default to neutral if all N/A

  // Determine consensus verdict based on score ranges (NOT vote count)
  let consensus_verdict: Verdict = 'HOLD'; // Default
  if (total_score >= 80) {
    consensus_verdict = 'STRONG_BUY';
  } else if (total_score >= 60) {
    consensus_verdict = 'BUY';
  } else if (total_score >= 40) {
    consensus_verdict = 'HOLD';
  } else {
    consensus_verdict = 'SELL';
  }

  // Step 5: Return unified result
  return {
    ticker: data.ticker,
    company_name: data.company_name,
    meta: {
      current_price: data.market_status.current_price,
      data_period_used: `${yearsAvailable} years (${yearRange})`,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    },
    summary: {
      total_score,
      consensus_verdict,
      opinion_breakdown: verdictCounts,
    },
    results,
  };
}

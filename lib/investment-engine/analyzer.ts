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
export async function analyzeStock(ticker: string): Promise<InvestmentAnalysisResult> {
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

// Step 4: Normalize Scores & Generate Summary
  
  // Helper: Verdict와 Score의 불일치를 강제로 보정하는 함수
  const normalizeScore = (verdict: Verdict, rawScore?: number) => {
    let score = rawScore ?? 50; 

    // Verdict 등급에 맞춰 점수 범위 강제 (Clamping)
    switch (verdict) {
      case 'STRONG_BUY':
        // 강력 매수는 최소 85점 보장
        if (score < 80) score = 85; 
        break;
      case 'BUY':
        // 매수는 최소 65점 ~ 최대 79점
        if (score < 60) score = 65;
        if (score >= 80) score = 79;
        break;
      case 'HOLD':
        // 중립은 40~55점 (59에서 55로 조금 더 좁힘 - 애매하면 HOLD로)
        if (score < 40) score = 45;
        if (score >= 60) score = 55;
        break;
      case 'SELL':
        // 매도는 최대 35점 제한
        if (score >= 40) score = 35;
        break;
    }
    return Math.round(score);
  };

  // [핵심 변경사항] 계산된 보정 점수를 results 객체에 '직접' 업데이트합니다.
  results.buffett.win_rate = normalizeScore(results.buffett.verdict, results.buffett.win_rate);
  results.lynch.win_rate = normalizeScore(results.lynch.verdict, results.lynch.win_rate);
  results.graham.win_rate = normalizeScore(results.graham.verdict, results.graham.win_rate);
  results.fisher.win_rate = normalizeScore(results.fisher.verdict, results.fisher.win_rate);
  results.druckenmiller.win_rate = normalizeScore(results.druckenmiller.verdict, results.druckenmiller.win_rate);
  results.marks.win_rate = normalizeScore(results.marks.verdict, results.marks.win_rate);

  // 업데이트된 점수들로 리스트 생성
  const finalScores = [
    results.buffett.win_rate,
    results.lynch.win_rate,
    results.graham.win_rate,
    results.fisher.win_rate,
    results.druckenmiller.win_rate,
    results.marks.win_rate,
  ];

  // 전체 평균 계산 (업데이트된 점수 기준)
  const totalSum = finalScores.reduce((acc, curr) => acc + curr, 0);
  const total_score = Math.round(totalSum / finalScores.length);

  // Verdict Breakdown (카운팅 - 기존 로직 유지)
  const verdicts: Verdict[] = [
    results.buffett.verdict,
    results.lynch.verdict,
    results.graham.verdict,
    results.fisher.verdict,
    results.druckenmiller.verdict,
    results.marks.verdict,
  ];

  const verdictCounts = {
    strong_buy: verdicts.filter((v) => v === 'STRONG_BUY').length,
    buy: verdicts.filter((v) => v === 'BUY').length,
    hold: verdicts.filter((v) => v === 'HOLD').length,
    sell: verdicts.filter((v) => v === 'SELL').length,
  };

  // Consensus Verdict 결정
  let consensus_verdict: Verdict = 'HOLD';
  
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
    results, // 이제 여기에 보정된 win_rate가 들어있습니다!
  };
}
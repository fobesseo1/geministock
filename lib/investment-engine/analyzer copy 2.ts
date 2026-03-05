import { combineStockData } from '@/lib/data-combiner/stock-data-combiner';
import type { InvestmentAnalysisResult, Verdict } from '@/lib/types/investment-analysis';

// Algorithms
import { calculateBuffettAnalysis } from './algorithms/buffett';
import { calculateGrahamAnalysis } from './algorithms/graham';
import { calculateLynchAnalysis } from './algorithms/lynch';
import { calculateFisherAnalysis } from './algorithms/fisher';
import { calculateDruckenmillerAnalysis } from './algorithms/druckenmiller';
import { calculateOneilAnalysis } from './algorithms/oneil'; // [NEW] Marks 대체

/**
 * Main orchestrator for investment analysis
 * Categorizes 6 legends into 3 investment styles
 */
export async function analyzeStock(ticker: string): Promise<InvestmentAnalysisResult> {
  // 1. Data Fetching
  const data = await combineStockData(ticker);

  // 2. Run All Algorithms
  const buffett = calculateBuffettAnalysis(data);
  const graham = calculateGrahamAnalysis(data);
  const lynch = calculateLynchAnalysis(data);
  const fisher = calculateFisherAnalysis(data);
  const druckenmiller = calculateDruckenmillerAnalysis(data);
  const oneil = calculateOneilAnalysis(data); // Marks 대신 O'Neil 실행

  // 3. Helper: Score Normalization
  // Verdict 등급에 맞춰 점수 범위 강제 (Clamping)
  const normalizeScore = (verdict: Verdict, rawScore?: number) => {
    let score = rawScore ?? 50;
    switch (verdict) {
      case 'STRONG_BUY':
        if (score < 80) score = 85;
        break;
      case 'BUY':
        if (score < 60) score = 65;
        if (score >= 80) score = 79;
        break;
      case 'HOLD':
        if (score < 40) score = 45;
        if (score >= 60) score = 55;
        break;
      case 'SELL':
        if (score >= 40) score = 35;
        break;
    }
    return Math.round(score);
  };

  // 점수 정규화 적용
  buffett.win_rate = normalizeScore(buffett.verdict, buffett.win_rate);
  graham.win_rate = normalizeScore(graham.verdict, graham.win_rate);
  lynch.win_rate = normalizeScore(lynch.verdict, lynch.win_rate);
  fisher.win_rate = normalizeScore(fisher.verdict, fisher.win_rate);
  druckenmiller.win_rate = normalizeScore(druckenmiller.verdict, druckenmiller.win_rate);
  oneil.win_rate = normalizeScore(oneil.verdict, oneil.win_rate);

  // 4. Grouping Strategies (The 3 Pillars)

  // Group 1: 🛡️ Value Hunter (Buffett + Graham)
  const valueScore = Math.round((buffett.win_rate + graham.win_rate) / 2);
  let valueVerdict: Verdict = 'HOLD';
  if (valueScore >= 80) valueVerdict = 'STRONG_BUY';
  else if (valueScore >= 60) valueVerdict = 'BUY';
  else if (valueScore <= 40) valueVerdict = 'SELL';

  // Group 2: 🚀 Growth Seeker (Lynch + Fisher)
  const growthScore = Math.round((lynch.win_rate + fisher.win_rate) / 2);
  let growthVerdict: Verdict = 'HOLD';
  if (growthScore >= 80) growthVerdict = 'STRONG_BUY';
  else if (growthScore >= 60) growthVerdict = 'BUY';
  else if (growthScore <= 40) growthVerdict = 'SELL';

  // Group 3: 📈 Market Timer (Druckenmiller + O'Neil)
  // *둘 다 추세추종이라 점수가 비슷하게 나올 확률이 높음 (시너지)*
  const trendScore = Math.round((druckenmiller.win_rate + oneil.win_rate) / 2);
  let trendVerdict: Verdict = 'HOLD';
  if (trendScore >= 80) trendVerdict = 'STRONG_BUY';
  else if (trendScore >= 60) trendVerdict = 'BUY';
  else if (trendScore <= 40) trendVerdict = 'SELL';

  // 5. Final Consensus (Weighted or Simple Average)
  // 사용자가 혼란스럽지 않게 전체 평균도 제공하되, UI에서는 3개 그룹을 강조하는 것을 권장
  const total_score = Math.round((valueScore + growthScore + trendScore) / 3);

  let consensus_verdict: Verdict = 'HOLD';
  if (total_score >= 80) consensus_verdict = 'STRONG_BUY';
  else if (total_score >= 60) consensus_verdict = 'BUY';
  else if (total_score <= 40) consensus_verdict = 'SELL';

  // Verdict Counting
  const allVerdicts = [
    buffett.verdict,
    graham.verdict,
    lynch.verdict,
    fisher.verdict,
    druckenmiller.verdict,
    oneil.verdict,
  ];

  const verdictCounts = {
    strong_buy: allVerdicts.filter((v) => v === 'STRONG_BUY').length,
    buy: allVerdicts.filter((v) => v === 'BUY').length,
    hold: allVerdicts.filter((v) => v === 'HOLD').length,
    sell: allVerdicts.filter((v) => v === 'SELL').length,
  };

  // 6. Return Result
  return {
    ticker: data.ticker,
    company_name: data.company_name,
    meta: {
      current_price: data.market_status.current_price,
      data_period_used: `${data.financial_history.length} years`,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    },
    summary: {
      total_score,
      consensus_verdict,
      opinion_breakdown: verdictCounts,
      // [NEW] 3가지 스타일별 요약 점수 추가
      strategies: {
        value: {
          name: 'Value Hunter',
          score: valueScore,
          verdict: valueVerdict,
          description: 'Undervalued with safety margin',
        },
        growth: {
          name: 'Growth Seeker',
          score: growthScore,
          verdict: growthVerdict,
          description: 'High growth at reasonable price',
        },
        trend: {
          name: 'Market Timer',
          score: trendScore,
          verdict: trendVerdict,
          description: 'Strong momentum and trend',
        },
      },
    },
    results: {
      buffett,
      graham,
      lynch,
      fisher,
      druckenmiller,
      oneil, // marks 대체
    },
  };
}

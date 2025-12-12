import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';

/**
 * Stanley Druckenmiller Strategy: Trend Following + Growth
 *
 * Improved 4-Stage Approach:
 * 1. Trend Check: Price > 200-day MA
 * 2. Momentum Check: Price > 90% of 52-week high
 * 3. Growth Check: Earnings growing (EPS year-over-year)
 *
 * Verdict (4 Stages):
 * - STRONG_BUY: Trend + Momentum + Growth (Perfect setup - breakout)
 * - BUY: Trend + Growth (No momentum yet - buy the dip opportunity)
 * - HOLD: Trend only OR risky momentum without growth (wait for signals)
 * - SELL: Trend broken (price below 200-day MA)
 *
 * Key Improvement: Prevents fake breakouts by requiring earnings growth
 *
 * @param data - Combined stock data
 * @returns Algorithm result with verdict and exit condition
 */
export function calculateDruckenmillerAnalysis(data: CombinedStockData): AlgorithmResult {
  const { market_status, financial_history } = data;
  const current_price = market_status.current_price;
  const ma_200d = market_status['200d_ma'];
  const week_52_high = market_status['52w_high'];

  // Validate data
  if (current_price <= 0 || ma_200d <= 0 || week_52_high <= 0) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Missing technical indicator data',
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

  // Step 1: Check if trend is alive
  const trendAlive = current_price > ma_200d;

  // Step 2: Check for strong momentum (near 52-week high)
  const strongMomentum = current_price > week_52_high * 0.9;

  // Step 3: Check for earnings growth (NEW!)
  let isGrowing = false;
  let growthLabel = 'No Growth Data';
  let epsGrowthRate = 0;

  if (financial_history.length >= 2) {
    const latestEPS = financial_history[financial_history.length - 1].eps;
    const prevEPS = financial_history[financial_history.length - 2].eps;

    // 흑자 전환하거나 이익이 전년보다 늘었으면 성장으로 인정
    if (latestEPS > prevEPS && latestEPS > 0) {
      isGrowing = true;
      epsGrowthRate = ((latestEPS - prevEPS) / Math.abs(prevEPS)) * 100;
      growthLabel = `Earnings Growing +${epsGrowthRate.toFixed(1)}%`;
    } else if (latestEPS <= prevEPS) {
      epsGrowthRate = ((latestEPS - prevEPS) / Math.abs(prevEPS)) * 100;
      growthLabel = `Earnings Declined ${epsGrowthRate.toFixed(1)}%`;
    } else {
      growthLabel = 'Earnings Stagnant';
    }
  }

  // Step 4: Determine verdict with 4-stage logic
  let verdict: AlgorithmResult['verdict'];
  let logic: string;
  let trend_status: string;
  let trend_label: string;
  let trend_signal: 'BUY' | 'HOLD' | 'SELL';
  let trigger_code: string;

  if (!trendAlive) {
    // [SELL] 추세 붕괴
    verdict = 'SELL';
    trend_status = 'Broken'; // ↘Broken -> Broken
    trend_label = 'Exit Position';
    trend_signal = 'SELL';
    trigger_code = 'SELL_TREND_BROKEN';
    logic = `Price $${current_price.toFixed(2)} below 200-day MA. Trend broken. Exit.`;
  } else if (strongMomentum) {
    // [모멘텀 구간]
    if (isGrowing) {
      // STRONG_BUY
      verdict = 'STRONG_BUY';
      trend_status = 'Breakout'; // 🚀Breakout -> Breakout
      trend_label = 'Momentum Buy';
      trend_signal = 'BUY';
      trigger_code = 'BUY_PERFECT_BREAKOUT';
      logic = `Perfect setup: Breakout near 52w high + ${growthLabel}. Strong buy.`;
    } else {
      // HOLD (Risky)
      verdict = 'HOLD';
      trend_status = 'Risky'; // ⚠️Risky -> Risky
      trend_label = 'Wait & Watch';
      trend_signal = 'HOLD';
      trigger_code = 'HOLD_FAKE_BREAKOUT_RISK';
      logic = `Near highs but ${growthLabel}. Risk of fake breakout.`;
    }
  } else {
    // [조정 구간]
    if (isGrowing) {
      // BUY (Dip)
      verdict = 'BUY';
      trend_status = 'Uptrend'; // ↗Uptrend -> Uptrend
      trend_label = 'Buy the Dip';
      trend_signal = 'BUY';
      trigger_code = 'BUY_DIP_OPPORTUNITY';
      logic = `Solid uptrend with ${growthLabel}. Buy the dip.`;
    } else {
      // HOLD (Neutral)
      verdict = 'HOLD';
      trend_status = 'Neutral'; // →Consolidating -> Neutral (더 짧고 직관적)
      trend_label = 'Wait & Watch';
      trend_signal = 'HOLD';
      trigger_code = 'HOLD_NO_CATALYST';
      logic = `Trend intact but no momentum/growth. Neutral.`;
    }
  }

  return {
    verdict,
    target_price: null, // Trend followers don't have price targets
    sell_price: ma_200d, // Stop loss at 200-day MA
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        price_vs_ma200: parseFloat((current_price / ma_200d).toFixed(2)),
        near_52w_high: strongMomentum,
        earnings_growing: isGrowing,
        eps_growth_rate: parseFloat(epsGrowthRate.toFixed(1)),
      },
    },
    price_guide: {
      buy_zone_max: trendAlive ? week_52_high * 1.05 : null, // 전고점 돌파(Breakout) 초기까지 매수 유효
      profit_zone_min: null, // 추세 추종이라 목표가 없음
      stop_loss: ma_200d, // 200일선 깨지면 손절
    },
    metric_name: '200D MA',
    metric_value: ma_200d,
    // Trend status for frontend display
    trend_status,
    trend_label,
    trend_signal,
    fair_price: null, // Druckenmiller는 추세 추종자라 fair_price 없음
  };
}

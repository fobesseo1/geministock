import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { calculateDisplayPrice } from '@/lib/utils/price-adjuster';

export function calculateOneilAnalysis(data: CombinedStockData): AlgorithmResult {
  const { market_status, financial_history } = data;
  const current_price = market_status.current_price;
  const ma_200d = market_status['200d_ma'];
  const week_52_high = market_status['52w_high'];

  if (!current_price || !ma_200d || !week_52_high) {
    return {
      verdict: 'N/A',
      target_price: null,
      sell_price: null,
      logic: 'Insufficient market data',
      analysis_summary: { trigger_code: 'DATA_INSUFFICIENT', key_factors: {} },
      price_guide: { buy_zone_max: null, profit_zone_min: null, stop_loss: null },
      display_price: null,
      price_status: 'NORMAL',
      win_rate: 50,
    };
  }

  const isUptrend = current_price > ma_200d;
  const isNearHigh = current_price >= week_52_high * 0.9;

  let isGrowing = false;
  let growthRate = 0;
  if (financial_history.length >= 2) {
    const latestEPS = financial_history[financial_history.length - 1].eps;
    const prevEPS = financial_history[financial_history.length - 2].eps;
    if (latestEPS > prevEPS) {
      isGrowing = true;
      if (prevEPS !== 0) growthRate = ((latestEPS - prevEPS) / Math.abs(prevEPS)) * 100;
    }
  }

  // Common Logic & Status Generation
  let verdict: AlgorithmResult['verdict'];
  let trend_status: string; // [Unified Status]
  let trigger_code: string;
  let logic: string;

  if (!isUptrend) {
    verdict = 'SELL';
    trend_status = 'Broken'; // [Unified]
    trigger_code = 'TREND_CRASH_BROKEN';
    logic = `Trend Broken: Price below 200-day MA. The uptrend is over.`;
  } else if (isNearHigh && isGrowing) {
    verdict = 'STRONG_BUY';
    trend_status = 'Breakout'; // [Unified]
    trigger_code = 'TREND_BREAKOUT_GROWTH';
    logic = `Perfect Setup: Price near highs + Earnings Growing (+${growthRate.toFixed(
      1
    )}%). Breakout!`;
  } else if (isUptrend && isGrowing) {
    verdict = 'BUY';
    trend_status = 'Uptrend'; // [Unified] was Base Build (Aligned with Druckenmiller)
    trigger_code = 'TREND_PULLBACK_OPPORTUNITY';
    logic = `Base Building: Solid uptrend with earnings growth. Good entry point.`;
  } else if (isNearHigh && !isGrowing) {
    verdict = 'HOLD';
    trend_status = 'No Growth'; // [Unified] was No Earnings
    trigger_code = 'TREND_WARNING_NO_EARNINGS';
    logic = `Caution: High momentum but no earnings support. Risk of fake breakout.`;
  } else {
    verdict = 'HOLD';
    trend_status = 'Neutral'; // [Unified] was Weak
    trigger_code = 'TREND_NEUTRAL_SIDEWAYS';
    logic = `Neutral: Uptrend intact but momentum is weak.`;
  }

  let winRate = 50;
  if (isUptrend) winRate += 10;
  else winRate -= 30;
  if (isNearHigh) winRate += 20;
  if (isGrowing) winRate += 20;
  if (isGrowing && growthRate > 20) winRate += 10;
  winRate = Math.min(99, Math.max(1, Math.round(winRate)));

  const buyZoneMax = week_52_high * 1.05;
  const stopLoss = current_price * 0.93;
  const { display_price, price_status } = calculateDisplayPrice(current_price, null);

  return {
    verdict,
    target_price: null,
    sell_price: stopLoss,
    logic,
    analysis_summary: {
      trigger_code,
      key_factors: {
        is_uptrend: isUptrend,
        near_52w_high: isNearHigh,
        eps_growth: parseFloat(growthRate.toFixed(1)),
      },
    },
    price_guide: {
      buy_zone_max: buyZoneMax,
      profit_zone_min: null,
      stop_loss: stopLoss,
    },
    display_price,
    price_status,
    win_rate: winRate,
    metric_name: 'RS Rating',
    metric_value: winRate,
    fair_price: null,
    trend_status, // "Breakout", "Uptrend", "No Growth", "Neutral", "Broken"
  };
}

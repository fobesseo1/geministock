import type { CombinedStockData } from '@/lib/types/combined-stock-data';
import type { AlgorithmResult } from '@/lib/types/investment-analysis';
import { calculateDisplayPrice } from '@/lib/utils/price-adjuster';

export function calculateDruckenmillerAnalysis(data: CombinedStockData): AlgorithmResult {
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

  const trendAlive = current_price > ma_200d;
  const strongMomentum = current_price > week_52_high * 0.9;

  let isGrowing = false;
  let epsGrowthRate = 0;

  if (financial_history.length >= 2) {
    const latestEPS = financial_history[financial_history.length - 1].eps;
    const prevEPS = financial_history[financial_history.length - 2].eps;
    if (latestEPS > prevEPS && latestEPS > 0) {
      isGrowing = true;
      epsGrowthRate = ((latestEPS - prevEPS) / Math.abs(prevEPS)) * 100;
    } else if (latestEPS <= prevEPS) {
      epsGrowthRate = ((latestEPS - prevEPS) / Math.abs(prevEPS)) * 100;
    }
  }

  // Common Logic & Status Generation
  let verdict: AlgorithmResult['verdict'];
  let trend_status: string; // [Unified Status]
  let trigger_code: string;
  let logic: string;

  if (!trendAlive) {
    verdict = 'SELL';
    trend_status = 'Broken'; // [Unified]
    trigger_code = 'TREND_CRASH_BROKEN';
    logic = `Trend Broken: Price below 200-day MA. The uptrend is over.`;
  } else if (strongMomentum) {
    if (isGrowing) {
      verdict = 'STRONG_BUY';
      trend_status = 'Breakout'; // [Unified]
      trigger_code = 'TREND_BREAKOUT_GROWTH';
      logic = `Perfect Setup: Price near highs + Earnings Growing (+${epsGrowthRate.toFixed(
        1
      )}%). Breakout!`;
    } else {
      verdict = 'HOLD';
      trend_status = 'No Growth'; // [Unified] was Risky
      trigger_code = 'TREND_WARNING_NO_EARNINGS';
      logic = `Caution: Price near highs but earnings are weak (${epsGrowthRate.toFixed(
        1
      )}%). Risk of fake breakout.`;
    }
  } else {
    if (isGrowing) {
      verdict = 'BUY';
      trend_status = 'Uptrend'; // [Unified] was Uptrend
      trigger_code = 'TREND_PULLBACK_OPPORTUNITY';
      logic = `Buy the Dip: Solid uptrend with earnings growth. Healthy pullback.`;
    } else {
      verdict = 'HOLD';
      trend_status = 'Neutral'; // [Unified] was Neutral
      trigger_code = 'TREND_NEUTRAL_SIDEWAYS';
      logic = `Neutral: Trend is intact but lacks strong momentum or growth catalyst.`;
    }
  }

  let winRate = 50;
  if (trend_status === 'Breakout') winRate += 40;
  else if (trend_status === 'Uptrend') winRate += 25;
  else if (trend_status === 'No Growth') winRate -= 10;
  else if (trend_status === 'Broken') winRate -= 40;

  if (trend_status === 'Breakout' && !isGrowing) winRate -= 20;

  winRate = Math.min(99, Math.max(1, Math.round(winRate)));
  const { display_price, price_status } = calculateDisplayPrice(current_price, null);

  return {
    verdict,
    target_price: null,
    sell_price: ma_200d,
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
      buy_zone_max: trendAlive ? week_52_high * 1.05 : null,
      profit_zone_min: null,
      stop_loss: ma_200d,
    },
    display_price,
    price_status,
    win_rate: winRate,
    metric_name: '200D MA',
    metric_value: ma_200d,
    trend_status, // "Breakout", "Uptrend", "No Growth", "Neutral", "Broken"
    fair_price: null,
  };
}

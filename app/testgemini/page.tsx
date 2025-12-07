'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TickerAutocomplete } from '@/components/TickerAutocomplete';

// --- 1. New Interfaces (Updated API Structure) ---

interface AnalysisSummary {
  trigger_code: string;
  key_factors: Record<string, any>;
}

interface PriceGuide {
  buy_zone_max: number | null;
  profit_zone_min: number | null;
  stop_loss: number | null;
}

interface PersonaResult {
  verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';
  analysis_summary: AnalysisSummary;
  price_guide: PriceGuide;
  metric_name?: string;
  metric_value?: number;
}

interface InvestmentData {
  ticker: string;
  meta: {
    current_price: number;
    data_period_used: string;
  };
  summary: {
    total_score: number;
    consensus_verdict: string;
    opinion_breakdown: {
      strong_buy: number;
      buy: number;
      hold: number;
      sell: number;
    };
  };
  results: {
    [key: string]: PersonaResult;
  };
}

const PERSONAS = [
  { key: 'buffett', name: 'Warren Buffett', role: 'Value Investing', avatar: '/persona/main/buffett.png' },
  { key: 'lynch', name: 'Peter Lynch', role: 'Growth Stock', avatar: '/persona/main/lynch.png' },
  { key: 'graham', name: 'Benjamin Graham', role: 'Margin of Safety', avatar: '/persona/main/graham.png' },
  { key: 'fisher', name: 'Ken Fisher', role: 'PSR Analysis', avatar: '/persona/main/fisher.png' },
  {
    key: 'druckenmiller',
    name: 'Stan Druckenmiller',
    role: 'Trend Trading',
    avatar: '/persona/main/druckenmiller.png',
  },
  { key: 'marks', name: 'Howard Marks', role: 'Market Cycles', avatar: '/persona/main/marks.png' },
] as const;

// --- 2. The "Translator" (Trigger Code -> English) ---
const MENT_MAP: Record<string, (factors: any) => string> = {
  // Lynch
  BUY_FAST_GROWER: (f) =>
    `Exceptional growth rate (${f.growth_rate}%) at a reasonable price (PEG ${f.peg}). Potential ten-bagger candidate!`,
  SELL_DEBT_RISK: (f) =>
    `Growing company but dangerous debt levels (${f.debt_to_equity}%). High risk - consider selling.`,
  SELL_PEG_EXPENSIVE: (f) => `Strong company but overvalued relative to growth. Bubble needs to deflate.`,

  // Buffett
  BUY_MOAT_BARGAIN: (f) =>
    `Clear economic moat. Current price is a bargain relative to future value.`,
  SELL_MOAT_EXPENSIVE: (f) =>
    `Great company, but current price fully reflects all future earnings. Too expensive.`,

  // Druckenmiller
  BUY_TREND_BREAKOUT: (f) =>
    `Breaking through all-time highs with strong momentum. Time to ride the trend.`,
  SELL_TREND_BROKEN: (f) => `Trend completely broken (200-day MA collapse). Exit without hesitation.`,

  // Graham
  BUY_DEEP_VALUE: (f) =>
    `Liquidation value exceeds current price. This is a 'free lunch' with minimal downside.`,
  SELL_OVERPRICED: (f) =>
    `Ridiculously overpriced by Graham's standards. Zero margin of safety.`,

  // Default Fallback
  DEFAULT: () => `Careful analysis required based on current data.`,
};

function getHumanReadableMent(code: string, factors: any) {
  const translator = MENT_MAP[code] || MENT_MAP['DEFAULT'];
  return translator(factors);
}

// --- 3. UI Helpers ---

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getVerdictBadge(verdict: string) {
  const config = {
    STRONG_BUY: {
      bg: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
      text: 'text-white',
      label: 'Strong Buy',
    },
    BUY: {
      bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
      text: 'text-white',
      label: 'Buy',
    },
    HOLD: {
      bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
      text: 'text-white',
      label: 'Hold',
    },
    SELL: {
      bg: 'bg-gradient-to-r from-rose-600 to-rose-700',
      text: 'text-white',
      label: 'Sell',
    },
    'N/A': {
      bg: 'bg-slate-400',
      text: 'text-white',
      label: 'N/A',
    },
  };

  // @ts-ignore
  const style = config[verdict] || config['N/A'];

  return (
    <Badge className={`${style.bg} ${style.text} border-0 px-3 py-1 font-semibold shadow-sm`}>
      {style.label}
    </Badge>
  );
}

// --- 4. Component: Price Zone Visualizer (New!) ---
// 초보자가 "지금 가격이 싼가 비싼가"를 한눈에 보게 해주는 바
function PriceZoneBar({ current, guide }: { current: number; guide: PriceGuide }) {
  if (!guide.buy_zone_max && !guide.profit_zone_min) return null;

  // 시각화를 위한 범위 계산 (Min ~ Max)
  const buyMax = guide.buy_zone_max || current * 0.9;
  const sellMin = guide.profit_zone_min || current * 1.1;
  const stopLoss = guide.stop_loss;

  // 전체 바의 범위 설정 (조금 넉넉하게)
  const minRange = Math.min(current, buyMax, stopLoss || Infinity) * 0.9;
  const maxRange = Math.max(current, sellMin) * 1.1;
  const totalRange = maxRange - minRange;

  const getPercent = (val: number) => ((val - minRange) / totalRange) * 100;

  return (
    <div className="mt-6 space-y-2">
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span>Low</span>
        <span>High</span>
      </div>
      <div className="relative h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-full overflow-hidden">
        {/* Buy Zone (Green) */}
        {guide.buy_zone_max && (
          <div
            className="absolute h-full bg-green-500/30 border-r border-green-500"
            style={{ width: `${getPercent(guide.buy_zone_max)}%` }}
          />
        )}

        {/* Current Price Marker (Blue) */}
        <div
          className="absolute h-full w-1 bg-blue-600 z-10 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
          style={{ left: `${getPercent(current)}%` }}
        />
      </div>

      {/* Labels */}
      <div className="relative h-6 text-xs w-full">
        <div
          className="absolute -translate-x-1/2 text-blue-600 font-bold flex flex-col items-center"
          style={{ left: `${getPercent(current)}%` }}
        >
          <span>▲</span>
          <span className="-mt-1">Now ${current}</span>
        </div>

        {guide.buy_zone_max && (
          <div
            className="absolute -translate-x-1/2 text-green-600 font-medium"
            style={{ left: `${getPercent(guide.buy_zone_max)}%` }}
          >
            Buy ${guide.buy_zone_max.toFixed(0)}
          </div>
        )}

        {guide.stop_loss && (
          <div
            className="absolute -translate-x-1/2 text-red-600 font-medium"
            style={{ left: `${getPercent(guide.stop_loss)}%` }}
          >
            Stop ${guide.stop_loss.toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
}

// --- 5. Main Page Component ---

export default function InvestmentPage() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<InvestmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  useEffect(() => {
    // API Call Logic (Same as before)
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invest/${ticker}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-20">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="space-y-4 pt-2">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              AI Stock Analysis
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Powered by 6 Investment Strategies
            </p>
          </div>
          <TickerAutocomplete value={ticker} onValueChange={setTicker} />
        </div>

        {data && !loading ? (
          <>
            {/* A. Global Header - "상황판" */}
            <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20" />

              <div className="relative z-10 space-y-4">
                {/* Ticker Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/60 dark:bg-slate-800/60 px-4 py-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-600/50 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide">
                      {data.ticker}
                    </span>
                  </div>
                </div>

                {/* Current Price - Hero */}
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Current Price
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    ${data.meta.current_price.toFixed(2)}
                  </div>
                </div>

                {/* Score & Verdict */}
                <div className="flex items-center justify-center gap-6">
                  {/* Score Circle */}
                  <div className="relative">
                    <svg className="w-24 h-24 -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(data.summary.total_score / 100) * 251.33} 251.33`}
                        className={
                          data.summary.total_score >= 70
                            ? 'text-emerald-500'
                            : data.summary.total_score >= 40
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {data.summary.total_score}
                      </span>
                    </div>
                  </div>

                  {/* Verdict Badge */}
                  <div className="text-left">
                    {getVerdictBadge(data.summary.consensus_verdict)}
                  </div>
                </div>

                {/* Opinion Breakdown - Minimal */}
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {data.summary.opinion_breakdown.strong_buy +
                        data.summary.opinion_breakdown.buy}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Buy</div>
                  </div>
                  <div className="h-12 w-px bg-slate-300 dark:bg-slate-600" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {data.summary.opinion_breakdown.hold}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Hold</div>
                  </div>
                  <div className="h-12 w-px bg-slate-300 dark:bg-slate-600" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {data.summary.opinion_breakdown.sell}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Sell</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Persona List (The Storytellers) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  Expert Analysis
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              </div>

              {PERSONAS.map((p) => {
                const result = data.results[p.key];
                const isSelected = selectedPersona === p.key;

                return (
                  <div
                    key={p.key}
                    onClick={() => setSelectedPersona(isSelected ? null : p.key)}
                    className={`group relative cursor-pointer transition-all duration-300 ${
                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div
                      className={`relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border transition-all duration-300 ${
                        isSelected
                          ? 'border-slate-300 dark:border-slate-600 shadow-xl'
                          : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300'
                      }`}
                    >
                      {/* 카드 기본 뷰 (Collapsed) */}
                      <div className="p-5 space-y-4">
                        {/* 1. 상단: Identity & Verdict */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12 ring-2 ring-slate-100 dark:ring-slate-800">
                                <AvatarImage src={p.avatar} />
                                <AvatarFallback className="bg-slate-100 text-slate-600">
                                  {p.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                                {result.verdict === 'BUY' || result.verdict === 'STRONG_BUY' ? (
                                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                                ) : result.verdict === 'SELL' ? (
                                  <TrendingDown className="w-3 h-3 text-rose-500" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {p.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{p.role}</p>
                            </div>
                          </div>
                          {getVerdictBadge(result.verdict)}
                        </div>

                        {/* 2. 중단: 가격 가이드 (⭐ 최우선) */}
                        <div className="space-y-2">
                          {result.price_guide.buy_zone_max && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                Buy ≤ ${result.price_guide.buy_zone_max.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {result.price_guide.profit_zone_min && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
                              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span className="text-sm font-medium text-rose-700 dark:text-rose-400">
                                Sell ≥ ${result.price_guide.profit_zone_min.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {result.price_guide.stop_loss && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-600" />
                              <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                                Stop Loss @ ${result.price_guide.stop_loss.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3. 하단: 한 줄 코멘트 (trigger_code 번역) */}
                        <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {getHumanReadableMent(
                              result.analysis_summary.trigger_code,
                              result.analysis_summary.key_factors
                            )}
                          </p>
                        </div>

                        {/* 확장 버튼 힌트 */}
                        {!isSelected && (
                          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 pt-2">
                            <span>View Details</span>
                            <svg
                              className="w-3 h-3 transition-transform group-hover:translate-y-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Expanded Detail View */}
                      {isSelected && (
                        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-4">
                          {/* A. 상세 지표 */}
                          {result.metric_name && (
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  {result.metric_name}
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                  {result.metric_value?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* B. PriceZoneBar 시각화 */}
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-rose-500 rounded-full" />
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Price Guide
                              </p>
                            </div>
                            <PriceZoneBar
                              current={data.meta.current_price}
                              guide={result.price_guide}
                            />

                            {/* Contextual Tip */}
                            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                              <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {result.price_guide.stop_loss
                                  ? 'Stop loss discipline is critical for risk management.'
                                  : 'No stop loss - this is a long-term investment perspective.'}
                              </p>
                            </div>
                          </div>

                          {/* C. Key Factors 상세 */}
                          {result.analysis_summary.key_factors &&
                            Object.keys(result.analysis_summary.key_factors).length > 0 && (
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                                  Detailed Analysis
                                </p>
                                <div className="space-y-2">
                                  {Object.entries(result.analysis_summary.key_factors).map(
                                    ([k, v]) => (
                                      <div
                                        key={k}
                                        className="flex items-start gap-2 text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/50"
                                      >
                                        <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[80px]">
                                          {k}:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {String(v)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              {/* Animated loading rings */}
              <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              Analyzing stock data...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

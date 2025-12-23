'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TickerAutocomplete } from '@/components/TickerAutocomplete';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Rocket,
  MoveUp,
  MoveDown,
  ChevronLeft,
  Menu,
  Target,
  Brain,
  Zap,
} from 'lucide-react';
import type { InvestmentAnalysisResult, AlgorithmResult } from '@/lib/types/investment-analysis';
import { Button } from '@/components/ui/button';

// Type aliases for code readability
type InvestmentData = InvestmentAnalysisResult;
type PersonaResult = AlgorithmResult;

const PERSONAS = [
  { key: 'buffett', name: 'Buffett', avatar: '/persona/main/buffett.png' },
  { key: 'lynch', name: 'Lynch', avatar: '/persona/main/lynch.png' },
  { key: 'graham', name: 'Graham', avatar: '/persona/main/graham.png' },
  { key: 'fisher', name: 'Fisher', avatar: '/persona/main/fisher.png' },
  { key: 'druckenmiller', name: 'Druckenmiller', avatar: '/persona/main/druckenmiller.png' },
  { key: 'marks', name: 'Marks', avatar: '/persona/main/marks.png' },
] as const;

// --- Components ---

// Helper: Get avatar path
function getPersonaAvatar(personaKey: string, verdict: string) {
  if (verdict === 'STRONG_BUY' || verdict === 'BUY')
    return `/persona/faces/${personaKey}_happy.webp`;
  if (verdict === 'HOLD') return `/persona/faces/${personaKey}_neutral.webp`;
  return `/persona/faces/${personaKey}_sad.webp`;
}

// 신호등 요약 배너
function VerdictSummary({
  buyCount,
  sellCount,
  holdCount,
}: {
  buyCount: number;
  sellCount: number;
  holdCount: number;
}) {
  // 1. 매도 우세 (Red)
  if (sellCount >= 4) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-red-100 p-2 rounded-full mb-2">
          <MoveDown className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-red-700">Warning! {sellCount} Gurus say SELL</h2>
      </div>
    );
  }

  // 2. 매수 우세 (Green)
  if (buyCount >= 4) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-green-100 p-2 rounded-full mb-2">
          <MoveUp className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-700">Opportunity! {buyCount} Gurus say BUY</h2>
      </div>
    );
  }

  // 3. 중립/혼조 (Yellow)
  return (
    <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-yellow-100 p-2 rounded-full mb-2">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
      </div>
      <h2 className="text-xl font-bold text-yellow-700">Mixed Signals! Wait & Watch</h2>
    </div>
  );
}

// Gauge Chart (반원형)
function GaugeChart({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 61) return '#34C759'; // Green
    if (score >= 41) return '#FFCC00'; // Yellow
    return '#FF3B30'; // Red
  };

  const getGradientColors = () => {
    if (score >= 61) return { start: '#7DE39F', end: '#34C759' };
    if (score >= 41) return { start: '#FFE066', end: '#FFCC00' };
    return { start: '#FF7A66', end: '#FF3B30' };
  };

  const arrowAngle = (score / 100) * 180;
  const arrowRad = ((180 - arrowAngle) * Math.PI) / 180;
  const radius = 80;
  const arrowX = 100 + radius * Math.cos(arrowRad);
  const arrowY = 100 - radius * Math.sin(arrowRad);

  const gradientColors = getGradientColors();
  const mainColor = getColor();

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div
        className="absolute inset-0 blur-2xl opacity-20 rounded-full"
        style={{
          background: `radial-gradient(circle, ${mainColor} 0%, transparent 70%)`,
        }}
      />

      <svg viewBox="0 0 200 130" className="relative z-10 w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>

          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F0F0F0" />
            <stop offset="100%" stopColor="#E5E5EA" />
          </linearGradient>

          <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2" />
          </filter>

          <filter id="textShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
          </filter>
        </defs>

        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#bgGradient)"
          strokeWidth="24"
          strokeLinecap="round"
        />

        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="24"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.33} 251.33`}
          filter="url(#gaugeShadow)"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        <g
          transform={`translate(${arrowX}, ${arrowY}) rotate(${-arrowAngle + 90})`}
          style={{
            transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: '0 0',
          }}
        >
          <path d="M 0 -8 L 6 4 L -6 4 Z" fill={mainColor} filter="url(#gaugeShadow)" />
        </g>

        <text
          x="100"
          y="85"
          textAnchor="middle"
          className="text-4xl font-bold"
          fill="#1C1C1E"
          filter="url(#textShadow)"
        >
          {score}
        </text>
        <text x="100" y="105" textAnchor="middle" className="text-xs" fill="#8E8E93">
          Investment Score
        </text>
      </svg>
    </div>
  );
}

// [NEW] Guru Grid - Single Screen Version
// - Fit Score number in bottom-right badge
// - Price/trend status displayed below avatar
// - Verdict text badge above avatar
// - Clickable to open BottomSheet
function GuruGrid({
  personas,
  data,
  onCardClick,
}: {
  personas: typeof PERSONAS;
  data: InvestmentData;
  onCardClick: (persona: (typeof PERSONAS)[number], result: PersonaResult) => void;
}) {
  // Helper function to get verdict text
  const getVerdictText = (verdict: string) => {
    if (verdict === 'STRONG_BUY') return 'STRONG BUY';
    if (verdict === 'BUY') return 'BUY';
    if (verdict === 'SELL') return 'SELL';
    if (verdict === 'HOLD') return 'HOLD';
    return 'N/A';
  };

  // Helper function to get verdict badge color
  const getVerdictBadgeClass = (verdict: string) => {
    if (verdict === 'STRONG_BUY' || verdict === 'BUY') {
      return 'bg-[#34C759] text-white border-transparent'; // Green
    }
    if (verdict === 'SELL') {
      return 'bg-[#FF3B30] text-white border-transparent'; // Red
    }
    return 'bg-[#FFCC00] text-white border-transparent'; // Yellow
  };

  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-6">
      {personas.map((p) => {
        const result = data.results[p.key];
        const avatarPath = getPersonaAvatar(p.key, result.verdict);
        const winRate = result.win_rate || 50;

        // Determine badge color based on verdict
        const badgeColor =
          result.verdict === 'BUY' || result.verdict === 'STRONG_BUY'
            ? 'bg-[#34C759]'
            : result.verdict === 'SELL'
            ? 'bg-[#FF3B30]'
            : 'bg-[#FFCC00]';

        // Get price/trend content
        const isBuy = result.verdict === 'BUY' || result.verdict === 'STRONG_BUY';
        const isSell = result.verdict === 'SELL';
        const valueColor = isBuy ? 'text-[#34C759]' : isSell ? 'text-[#FF3B30]' : 'text-gray-900';

        let contentDisplay;
        if (p.key === 'druckenmiller') {
          const status = result.trend_status || 'Neutral';
          contentDisplay = (
            <div className="flex items-center justify-center gap-1">
              <span className={`text-sm font-bold ${valueColor}`}>{status}</span>
              {isBuy && <span className="text-xs">🚀</span>}
              {isSell && <span className="text-xs">📉</span>}
            </div>
          );
        } else {
          const price = result.display_price ?? 0;
          contentDisplay = (
            <div className={`text-sm font-bold ${valueColor}`}>${price.toFixed(2)}</div>
          );
        }

        return (
          <div
            key={p.key}
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onCardClick(p, result)}
          >
            {/* [NEW] Verdict Text Badge (Top) */}
            <Badge className={`mb-2 text-xs ${getVerdictBadgeClass(result.verdict)}`}>
              {getVerdictText(result.verdict)}
            </Badge>

            {/* Avatar with Fit Score Badge */}
            <div className="relative">
              <Avatar
                className={`w-20 h-20 ring-2 ring-slate-100 ${
                  result.verdict === 'BUY' || result.verdict === 'STRONG_BUY'
                    ? 'shadow-[0_0_20px_rgba(52,199,89,0.8)]'
                    : result.verdict === 'SELL'
                    ? 'shadow-[0_0_20px_rgba(255,59,48,0.8)]'
                    : 'shadow-[0_0_20px_rgba(255,204,0,0.8)]'
                }`}
              >
                <AvatarImage src={avatarPath} alt={p.name} />
                <AvatarFallback className="bg-slate-100 text-slate-700 text-lg font-semibold">
                  {p.name[0]}
                </AvatarFallback>
              </Avatar>

              {/* [CHANGED] Fit Score Number Badge (bottom-right) */}
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${badgeColor}`}
              >
                <span className="text-white text-xs font-bold">{winRate}</span>
              </div>
            </div>

            {/* [CHANGED] Price/Trend Status Display (below avatar) */}
            <div className="mt-2 text-center">{contentDisplay}</div>
          </div>
        );
      })}
    </div>
  );
}

// Helper: Translates trigger codes into a friendly "One-Liner"
const translateTrigger = (code: string) => {
  const map: Record<string, string> = {
    // --- 1. Warren Buffett (Quality + Moat) ---
    BUY_MOAT_BARGAIN: "💎 A great company on sale! It's a rare bargain.",
    BUY_QUALITY_FAIR: '👍 High-quality stock at a fair price. Good to go.',
    HOLD_MOAT_FAIR: '👀 Great company, but the price is just "okay" right now.',
    SELL_MOAT_EXPENSIVE: '🏢 Amazing company, but the price is way too high.',

    // --- 2. Peter Lynch (Growth + PEG) ---
    BUY_FAST_GROWER: '🚀 Insane growth at a bargain price! (PEG < 0.5)',
    BUY_STALWART: '🌳 A sturdy, reliable grower. Safe and steady.',
    HOLD_FAIR_VALUE: '⚖️ Priced exactly right for its growth speed.',
    SELL_PEG_EXPENSIVE: '🐢 Price is running way faster than its growth.',
    SELL_DEBT_RISK: '💸 Too much debt! Financial health is risky.',
    HOLD_DEBT_WARNING: '⚠️ Debt levels are getting concerning. Be careful.',

    // --- 3. Benjamin Graham (Intrinsic Value + Margin of Safety) ---
    BUY_DEEP_VALUE: "🏷️ Safety margin secured! It's dirt cheap.",
    BUY_FAIR_VALUE: '💰 Trading below its "real" intrinsic value.',
    HOLD_MODERATE_PREMIUM: '🤔 Slightly above fair value, but still acceptable.',
    SELL_OVERPRICED: "🎈 It's a bubble. Way above its intrinsic value.",
    AVOID_NO_EARNINGS: '🚫 This company loses money. Graham avoids these.',

    // --- 4. Ken Fisher (PSR + Sales) ---
    BUY_PSR_BARGAIN: '📊 15%+ cheaper than historical average! Rare chance.',
    BUY_PSR_FAIR: '📉 Cheaper than its 3-year average price.',
    HOLD_PSR_BAND: '↔️ Moving within its normal historical price range.',
    SELL_PSR_EXPENSIVE: '🔥 Price vs. Sales is at an all-time high. Overheated!',

    // --- 5. Stanley Druckenmiller (Trend + Momentum) ---
    BUY_PERFECT_BREAKOUT: '📈 New Highs + Earnings Growth! Jump on the trend.',
    BUY_DIP_OPPORTUNITY: '📉 A dip in a solid uptrend. Good chance to buy.',
    HOLD_FAKE_BREAKOUT_RISK: "⚠️ Price is up, but earnings aren't. Watch out for a fake-out.",
    HOLD_NO_CATALYST: '💤 No reason to move up or down. Boring market.',
    SELL_TREND_BROKEN: "📉 The trend is broken. Run, don't walk!",

    // --- 6. Howard Marks (Cycle + Psychology) ---
    BUY_PANIC_BOTTOM: '😱 "Buy when there\'s blood in the streets." This is the bottom.',
    BUY_CYCLE_BOTTOM: '📉 The long drop is over. Building a base now.',
    HOLD_MID_CYCLE: '🌊 We are in the middle of the cycle. Just ride the waves.',
    SELL_EUPHORIA_TOP: '🎉 The party is over. Leave while everyone else is cheering.',

    // --- Common Errors ---
    DATA_INSUFFICIENT: 'Not enough data to make a call.',
    DATA_INVALID: 'Data error. Cannot analyze right now.',
  };

  return map[code] || 'Complex situation. Check details below.';
};

// Bottom Sheet Modal
function BottomSheet({
  isOpen,
  onClose,
  persona,
  result,
}: {
  isOpen: boolean;
  onClose: () => void;
  persona: (typeof PERSONAS)[number];
  result: PersonaResult;
}) {
  if (!isOpen) return null;

  const isBuy = result.verdict.includes('BUY');
  const isSell = result.verdict.includes('SELL');
  const themeColor = isBuy
    ? 'text-green-600 bg-green-50'
    : isSell
    ? 'text-red-600 bg-red-50'
    : 'text-gray-600 bg-gray-50';

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />

        {/* 1. Header: 아이콘 + 한줄 요약 */}
        <div className="flex flex-col items-center text-center mb-8">
          <Avatar className="w-20 h-20 mb-4 ring-4 ring-white shadow-lg">
            <AvatarImage src={getPersonaAvatar(persona.key, result.verdict)} />
            <AvatarFallback>{persona.name[0]}</AvatarFallback>
          </Avatar>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{persona.name}'s Insight</h2>

          {/* [NEW] 목표가격/상태 & 상승확률 */}
          <div className="flex items-center gap-4 mb-3">
            {/* 목표가격 또는 트렌드 상태 */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">
                {persona.key === 'druckenmiller' ? 'Status' : 'Target'}
              </span>
              {persona.key === 'druckenmiller' ? (
                <span
                  className={`text-lg font-bold ${
                    isBuy ? 'text-green-600' : isSell ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {result.trend_status || 'Neutral'} {isBuy && '🚀'}
                </span>
              ) : (
                <span
                  className={`text-lg font-bold ${
                    isBuy ? 'text-green-600' : isSell ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  ${(result.display_price ?? 0).toFixed(2)}
                </span>
              )}
            </div>

            {/* 구분선 */}
            <div className="w-px h-10 bg-gray-200" />

            {/* 상승확률 (Win Rate) */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Win Rate</span>
              <span className="text-lg font-bold text-gray-900">{result.win_rate}%</span>
            </div>
          </div>

          {/* 번역된 한줄 요약 */}
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${themeColor}`}>
            "{translateTrigger(result.analysis_summary.trigger_code)}"
          </div>
        </div>

        {/* 2. Logic Analysis */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-5 rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Why?
            </h3>
            <p className="text-gray-800 leading-relaxed font-medium">{result.logic}</p>
          </div>

          {/* 3. Key Factors */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Checklist
            </h3>
            <div className="space-y-3">
              {Object.entries(result.analysis_summary.key_factors).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <Button
          onClick={onClose}
          className="w-full mt-8 text-white bg-gray-900 rounded-full text-lg"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({ onSelectTicker }: { onSelectTicker: (ticker: string) => void }) {
  const popularStocks = [
    { ticker: 'AAPL', name: 'Apple', logo: '/logos/AAPL.webp' },
    { ticker: 'TSLA', name: 'Tesla', logo: '/logos/TSLA.webp' },
    { ticker: 'NVDA', name: 'NVIDIA', logo: '/logos/NVDA.webp' },
    { ticker: 'MSFT', name: 'Microsoft', logo: '/logos/MSFT.webp' },
    { ticker: 'GOOGL', name: 'Google', logo: '/logos/GOOGL.webp' },
    { ticker: 'AMZN', name: 'Amazon', logo: '/logos/AMZN.webp' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="mb-4 animate-bounce">
          <Target className="w-16 h-16 mx-auto " />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Guru Pick</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Get insights from 6 legendary investors in seconds
        </p>
      </div>

      {/* Popular Stocks */}
      <div className="w-full max-w-sm space-y-4">
        <p className="text-sm text-gray-600 font-medium">Try searching for popular stocks:</p>
        <div className="grid grid-cols-2 gap-3">
          {popularStocks.map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => onSelectTicker(stock.ticker)}
              className="flex items-center justify-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all active:scale-95"
            >
              <img src={stock.logo} alt={stock.name} className="w-8 h-8 object-contain" />
              <div className="text-left">
                <div className="font-bold text-gray-900 text-sm">{stock.ticker}</div>
                <div className="text-xs text-gray-500">{stock.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-10 space-y-3 w-full max-w-sm">
        <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100">
          <Brain className="w-8 h-8 " />
          <div className="text-left">
            <div className="font-semibold text-sm text-blue-900">6 Investment Strategies</div>
            <div className="text-xs text-gray-700">
              Buffett, Lynch, Graham, Fisher, Druckenmiller, Marks
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3  rounded-lg border border-green-100">
          <Zap className="w-8 h-8 " />
          <div className="text-left">
            <div className="font-semibold text-sm ">Instant Analysis</div>
            <div className="text-xs text-gray-700">Real-time data with AI-powered insights</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Content ---
function TestAppleOneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticker, setTicker] = useState(''); // 빈 값으로 시작
  const [data, setData] = useState<InvestmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<{
    persona: (typeof PERSONAS)[number];
    result: PersonaResult;
  } | null>(null);

  // URL 쿼리 파라미터에서 ticker 읽기 (초기 로드 시)
  useEffect(() => {
    const urlTicker = searchParams.get('ticker');
    if (urlTicker) {
      setTicker(urlTicker);
    }
  }, [searchParams]);

  // ticker 변경 시 URL 업데이트
  const updateTicker = (newTicker: string) => {
    setTicker(newTicker);
    if (newTicker) {
      // URL에 쿼리 파라미터 추가 (히스토리에 추가)
      const url = new URL(window.location.href);
      url.searchParams.set('ticker', newTicker);
      window.history.pushState({}, '', url.toString());
    } else {
      // ticker가 빈 값이면 쿼리 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete('ticker');
      window.history.pushState({}, '', url.toString());
    }
  };

  // 뒤로가기/앞으로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = () => {
      const urlTicker = new URLSearchParams(window.location.search).get('ticker');
      setTicker(urlTicker || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // ticker가 비어있으면 데이터를 가져오지 않음
    if (!ticker) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/invest/${ticker}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        if (!json.ticker || !json.results || !json.summary) {
          throw new Error('Invalid API response structure');
        }

        setData(json);
      } catch (e) {
        console.error('Investment data fetch error:', e);
        setError(
          e instanceof Error ? e.message : 'Failed to load investment data. Please try again.'
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white py-4 px-4 shadow-sm">
          {/* Title Bar with Icons */}
          <div className="flex items-center justify-between mb-3">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Title */}
            <h1 className="text-2xl font-bold">Guru Pick</h1>

            {/* Hamburger Menu */}
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <TickerAutocomplete value={ticker} onValueChange={updateTicker} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Failed to Load Data</h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setTicker(ticker);
                  }}
                  className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!ticker ? (
          // Welcome Screen when no ticker is selected
          <WelcomeScreen onSelectTicker={updateTicker} />
        ) : loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : data ? (
          <div className="p-4 space-y-4">
            {/* 신호등 요약 배너 */}
            <VerdictSummary
              buyCount={
                data.summary.opinion_breakdown.strong_buy + data.summary.opinion_breakdown.buy
              }
              sellCount={data.summary.opinion_breakdown.sell}
              holdCount={data.summary.opinion_breakdown.hold}
            />

            {/* Stock Price Info */}
            <div className="text-center py-4 border-y border-gray-200 bg-white/50 rounded-xl">
              <span className="text-sm text-gray-500">{data.ticker} is currently</span>
              <span className="text-lg font-bold text-gray-900 ml-2">
                ${data.meta.current_price.toFixed(2)}
              </span>
            </div>

            {/* Gauge Chart */}
            <GaugeChart score={data.summary.total_score} />

            {/* Guru Grid - Single Screen Version */}
            <GuruGrid
              personas={PERSONAS}
              data={data}
              onCardClick={(persona, result) => setSelectedPersona({ persona, result })}
            />
          </div>
        ) : null}

        {/* Bottom Sheet */}
        {selectedPersona && (
          <BottomSheet
            isOpen={!!selectedPersona}
            onClose={() => setSelectedPersona(null)}
            persona={selectedPersona.persona}
            result={selectedPersona.result}
          />
        )}
      </div>
    </div>
  );
}

// --- Main Page Wrapper with Suspense ---
export default function TestAppleOnePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <TestAppleOneContent />
    </Suspense>
  );
}

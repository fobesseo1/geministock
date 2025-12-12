'use client';

import { useState, useEffect } from 'react';
import { TickerAutocomplete } from '@/components/TickerAutocomplete';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { InvestmentAnalysisResult, AlgorithmResult } from '@/lib/types/investment-analysis';

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

// 화면 A: Gauge Chart (반원형 - Polished)
function GaugeChart({ score }: { score: number }) {
  // Get solid color for arrow and glow
  const getColor = () => {
    if (score >= 61) return '#34C759'; // Green
    if (score >= 41) return '#FFCC00'; // Yellow
    return '#FF3B30'; // Red
  };

  // Get gradient colors for progress arc
  const getGradientColors = () => {
    if (score >= 61) return { start: '#7DE39F', end: '#34C759' }; // Light → Dark Green
    if (score >= 41) return { start: '#FFE066', end: '#FFCC00' }; // Light → Dark Yellow
    return { start: '#FF7A66', end: '#FF3B30' }; // Light → Dark Red
  };

  // Calculate arrow position
  const arrowAngle = (score / 100) * 180; // 0-180 degrees
  const arrowRad = ((180 - arrowAngle) * Math.PI) / 180;
  const radius = 80;
  const arrowX = 100 + radius * Math.cos(arrowRad);
  const arrowY = 100 - radius * Math.sin(arrowRad);

  const gradientColors = getGradientColors();
  const mainColor = getColor();

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      {/* Background glow */}
      <div
        className="absolute inset-0 blur-2xl opacity-20 rounded-full"
        style={{
          background: `radial-gradient(circle, ${mainColor} 0%, transparent 70%)`,
        }}
      />

      {/* 수정 포인트 1: viewBox 높이를 110 -> 130으로 변경하여 하단 공간 확보 
        수정 포인트 2: overflow-visible 클래스 추가하여 그림자가 박스 밖으로 나가도 잘리지 않게 함
      */}
      <svg viewBox="0 0 200 130" className="relative z-10 w-full h-auto overflow-visible">
        <defs>
          {/* Gradient for progress arc */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>

          {/* Background arc gradient */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F0F0F0" />
            <stop offset="100%" stopColor="#E5E5EA" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2" />
          </filter>

          {/* Text shadow filter */}
          <filter id="textShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
          </filter>

          {/* Glow effect filter */}
          <filter id="glowEffect">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#bgGradient)"
          strokeWidth="24"
          strokeLinecap="round"
        />

        {/* Progress Arc */}
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

        {/* Arrow Indicator */}
        <g
          transform={`translate(${arrowX}, ${arrowY}) rotate(${-arrowAngle + 90})`}
          style={{
            transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: '0 0',
          }}
        >
          <path d="M 0 -8 L 6 4 L -6 4 Z" fill={mainColor} filter="url(#gaugeShadow)" />
        </g>

        {/* Center Text */}
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

// Helper: Get avatar path (준비: 나중에 표정별 이미지 교체)
// Future: '/persona/faces/buffett_happy.webp', 'buffett_neutral.webp', 'buffett_sad.webp'
function getPersonaAvatar(personaKey: string, verdict: string) {
  // TODO: 표정별 이미지 적용 시 아래 로직으로 변경
  if (verdict === 'STRONG_BUY' || verdict === 'BUY')
    return `/persona/faces/${personaKey}_happy.webp`;
  if (verdict === 'HOLD') return `/persona/faces/${personaKey}_neutral.webp`;
  return `/persona/faces/${personaKey}_sad.webp`;
}

// 화면 A: Guru Grid (3x2)
function GuruGrid({ personas, data }: { personas: typeof PERSONAS; data: InvestmentData }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-6">
      {personas.map((p) => {
        const result = data.results[p.key];
        const avatarPath = getPersonaAvatar(p.key, result.verdict);

        return (
          <div key={p.key} className="flex flex-col items-center">
            {/* Avatar with Badge */}
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
              {/* Verdict Badge Icon */}
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                  result.verdict === 'BUY' || result.verdict === 'STRONG_BUY'
                    ? 'bg-[#34C759]'
                    : result.verdict === 'SELL'
                    ? 'bg-[#FF3B30]'
                    : 'bg-[#FFCC00]'
                }`}
              >
                {result.verdict === 'BUY' || result.verdict === 'STRONG_BUY' ? (
                  <TrendingUp className="w-4 h-4 text-white" />
                ) : result.verdict === 'SELL' ? (
                  <TrendingDown className="w-4 h-4 text-white" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            {/* Name */}
            <p className="mt-2 text-xs font-medium text-gray-700 text-center">{p.name}</p>
          </div>
        );
      })}
    </div>
  );
}

// 화면 B: Guru Card
function GuruCard({
  persona,
  result,
  currentPrice,
  onClick,
}: {
  persona: (typeof PERSONAS)[number];
  result: PersonaResult;
  currentPrice: number;
  onClick: () => void;
}) {
  const getKeyPrice = () => {
    // Druckenmiller는 가격 대신 추세 상태를 표시 (추세 추종 전략)
    if (persona.key === 'druckenmiller') {
      const trendStatus = result.trend_status || '→ Consolidating';
      const trendLabel = result.trend_label || 'Wait & Watch';
      const trendSignal = result.trend_signal || 'HOLD';

      return {
        value: trendStatus,
        label: trendLabel,
        color:
          trendSignal === 'BUY'
            ? 'text-[#34C759]'
            : trendSignal === 'SELL'
            ? 'text-[#FF3B30]'
            : 'text-[#FFCC00]',
      };
    }

    // 나머지 5명의 guru는 모두 API의 fair_price 사용
    const fairPrice = result.fair_price || currentPrice;
    return {
      value: fairPrice ? `$${fairPrice.toFixed(2)}` : 'N/A',
      label: 'Fair Price',
      color: 'text-gray-700',
    };
  };

  const keyPrice = getKeyPrice();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center"
    >
      {/* Left: Avatar with Badge */}
      <div className="flex-shrink-0 mr-4">
        <div className="relative">
          <Avatar
            className={`w-16 h-16 ring-2 ring-slate-100 ${
              result.verdict === 'BUY' || result.verdict === 'STRONG_BUY'
                ? 'shadow-[0_0_20px_rgba(52,199,89,0.8)]'
                : result.verdict === 'SELL'
                ? 'shadow-[0_0_20px_rgba(255,59,48,0.8)]'
                : 'shadow-[0_0_20px_rgba(255,204,0,0.8)]'
            }`}
          >
            <AvatarImage src={getPersonaAvatar(persona.key, result.verdict)} alt={persona.name} />
            <AvatarFallback className="bg-slate-100 text-slate-700 text-base font-semibold">
              {persona.name[0]}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
              result.verdict === 'BUY' || result.verdict === 'STRONG_BUY'
                ? 'bg-[#34C759]'
                : result.verdict === 'SELL'
                ? 'bg-[#FF3B30]'
                : 'bg-[#FFCC00]'
            }`}
          >
            {result.verdict === 'BUY' || result.verdict === 'STRONG_BUY' ? (
              <TrendingUp className="w-4 h-4 text-white" />
            ) : result.verdict === 'SELL' ? (
              <TrendingDown className="w-4 h-4 text-white" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Center: Info */}
      <div className="flex-grow">
        {/* Row 1: Name */}
        <div className="mb-1">
          <span className="font-semibold text-gray-900">{persona.name}</span>
        </div>
        {/* Row 2: Key Price */}
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold ${keyPrice.color}`}>{keyPrice.value}</span>
          <span className="text-xs text-gray-500">{keyPrice.label}</span>
        </div>
      </div>

      {/* Right: Chevron */}
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>
  );
}

// 화면 C: Price Thermometer (수직 막대)
function PriceThermometer({ data }: { data: InvestmentData }) {
  const currentPrice = data.meta.current_price;

  // 모든 페르소나의 가격 수집
  const allPrices = PERSONAS.map((p) => {
    const result = data.results[p.key];
    return {
      name: p.name,
      target: result.price_guide.profit_zone_min,
      stop: result.price_guide.stop_loss,
    };
  }).filter((p) => p.target !== null || p.stop !== null);

  // 최고/최저 가격 계산
  const maxTarget = Math.max(...allPrices.map((p) => p.target || 0), currentPrice);
  const minStop = Math.min(
    ...allPrices.map((p) => p.stop || Infinity).filter((p) => p !== Infinity),
    currentPrice
  );

  const range = maxTarget - minStop;
  const getTopPercent = (price: number) => {
    return ((maxTarget - price) / range) * 100;
  };

  return (
    <div className="relative w-full h-[400px] bg-white rounded-2xl p-8 shadow-sm">
      {/* Vertical Bar */}
      <div className="absolute left-1/2 top-8 bottom-8 w-2 bg-gray-200 rounded-full -translate-x-1/2" />

      {/* Current Price Marker (Left) */}
      <div
        className="absolute right-[55%] -translate-y-1/2"
        style={{ top: `${getTopPercent(currentPrice) + 8}%` }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap">
            ${currentPrice.toFixed(2)}
          </div>
          <div className="w-4 h-0.5 bg-gray-900" />
        </div>
      </div>

      {/* Highest Target (Right) */}
      {maxTarget > currentPrice && (
        <div className="absolute left-[55%] -translate-y-1/2" style={{ top: '8%' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#34C759]" />
            <div className="text-[#34C759] font-bold text-sm whitespace-nowrap">
              ${maxTarget.toFixed(2)} ↑
            </div>
          </div>
        </div>
      )}

      {/* Lowest Stop (Right) */}
      {minStop < Infinity && minStop < currentPrice && (
        <div
          className="absolute left-[55%] -translate-y-1/2"
          style={{ top: `${getTopPercent(minStop) + 8}%` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#FF3B30]" />
            <div className="text-[#FF3B30] font-bold text-sm whitespace-nowrap">
              ${minStop.toFixed(2)} ↓
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

        {/* Header */}
        <h2 className="text-xl font-bold mb-4">{persona.name}'s Analysis</h2>

        {/* Logic (상세 코멘트) */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 mb-1">Trigger Code</p>
            <p className="text-base font-medium">{result.analysis_summary.trigger_code}</p>
          </div>

          {result.metric_name && (
            <div>
              <p className="text-sm text-gray-500 mb-1">{result.metric_name}</p>
              <p className="text-2xl font-bold">{result.metric_value?.toFixed(2)}</p>
            </div>
          )}

          {Object.keys(result.analysis_summary.key_factors).length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Key Factors</p>
              <div className="space-y-1">
                {Object.entries(result.analysis_summary.key_factors).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-700">{k}:</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function TestApplePage() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<InvestmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verdict' | 'insights' | 'scenario'>('verdict');
  const [selectedPersona, setSelectedPersona] = useState<{
    persona: (typeof PERSONAS)[number];
    result: PersonaResult;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset previous error

      try {
        const res = await fetch(`/api/invest/${ticker}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        // Validate response structure
        if (!json.ticker || !json.results || !json.summary) {
          throw new Error('Invalid API response structure');
        }

        setData(json);
      } catch (e) {
        console.error('Investment data fetch error:', e);
        setError(
          e instanceof Error ? e.message : 'Failed to load investment data. Please try again.'
        );
        setData(null); // Clear previous data on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  const getSummaryMessage = () => {
    if (!data) return '';
    const total = PERSONAS.length;
    const buyCount = data.summary.opinion_breakdown.strong_buy + data.summary.opinion_breakdown.buy;
    return `${buyCount} out of ${total} gurus recommend buying!`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-center mb-3">Guru Pick</h1>
          {/* <p className="text-xs text-center text-slate-500 mb-4">Your Investment Board</p> */}
          <TickerAutocomplete value={ticker} onValueChange={setTicker} />
        </div>

        {/* Stock Info Display */}
        {data && !error && (
          <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">
              {data.ticker}:{' '}
              <span className="text-base font-semibold text-gray-900">
                ${data.meta.current_price.toFixed(2)}
              </span>
            </span>
          </div>
        )}

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
                    setTicker(ticker); // Re-trigger fetch
                  }}
                  className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 flex">
          {(['verdict', 'insights', 'scenario'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === tab ? 'text-[#007AFF] border-b-2 border-[#007AFF]' : 'text-gray-500'
              }`}
            >
              {tab === 'verdict'
                ? 'The Verdict'
                : tab === 'insights'
                ? 'Guru Insights'
                : 'Price Scenario'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : data ? (
          <div className="p-4 space-y-6">
            {/* 화면 A: The Verdict */}
            {activeTab === 'verdict' && (
              <div className="space-y-12">
                <h2 className="text-center text-lg font-semibold mb-4">
                  Right now, {data.ticker} is looking interesting!
                </h2>

                <GaugeChart score={data.summary.total_score} />

                <GuruGrid personas={PERSONAS} data={data} />

                <p className="text-center text-sm text-gray-700 font-medium">
                  {getSummaryMessage()}
                </p>
              </div>
            )}

            {/* 화면 B: Guru Insights */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                {PERSONAS.map((p) => (
                  <GuruCard
                    key={p.key}
                    persona={p}
                    result={data.results[p.key]}
                    currentPrice={data.meta.current_price}
                    onClick={() => setSelectedPersona({ persona: p, result: data.results[p.key] })}
                  />
                ))}
              </div>
            )}

            {/* 화면 C: Price Scenario */}
            {activeTab === 'scenario' && <PriceThermometer data={data} />}
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

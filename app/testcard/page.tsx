'use client';

import { useState, useEffect } from 'react';
import { TickerAutocomplete } from '@/components/TickerAutocomplete';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import type { InvestmentAnalysisResult, AlgorithmResult } from '@/lib/types/investment-analysis';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion'; // 부드러운 전환을 위해 (선택사항, 없으면 일반 div 사용)

// Type aliases
type InvestmentData = InvestmentAnalysisResult;
type PersonaResult = AlgorithmResult;

const PERSONAS = [
  { key: 'buffett', name: 'Buffett', role: 'Value King' },
  { key: 'lynch', name: 'Lynch', role: 'Growth Hero' },
  { key: 'graham', name: 'Graham', role: 'Safety First' },
  { key: 'fisher', name: 'Fisher', role: 'Price/Sales' },
  { key: 'druckenmiller', name: 'Druckenmiller', role: 'Trend Master' },
  { key: 'marks', name: 'Marks', role: 'Cycle Watcher' },
] as const;

// --- Helper Functions ---

function getPersonaAvatar(personaKey: string, verdict: string) {
  // 실제 경로에 맞게 수정해주세요
  if (verdict === 'STRONG_BUY' || verdict === 'BUY')
    return `/persona/faces/${personaKey}_happy.webp`;
  if (verdict === 'HOLD') return `/persona/faces/${personaKey}_neutral.webp`;
  return `/persona/faces/${personaKey}_sad.webp`;
}

// 색상 테마 추출기
const getThemeColor = (verdict: string) => {
  if (verdict.includes('BUY')) return 'text-green-600 bg-green-50 border-green-100';
  if (verdict.includes('SELL')) return 'text-red-600 bg-red-50 border-red-100';
  return 'text-yellow-600 bg-yellow-50 border-yellow-100';
};

// --- Components ---

/**
 * [NEW] ConsensusHero
 * 사용자가 요청한 "N out of 6" 메시지를 가장 직관적으로 보여주는 헤더 컴포넌트입니다.
 */
function ConsensusHero({ summary }: { summary: InvestmentData['summary'] }) {
  const buyCount = summary.opinion_breakdown.strong_buy + summary.opinion_breakdown.buy;
  const sellCount = summary.opinion_breakdown.sell;
  const holdCount = summary.opinion_breakdown.hold;
  const totalGurus = 6;

  let title = '';
  let subTitle = '';
  let icon = null;
  let bgClass = '';

  if (buyCount >= 4) {
    title = `${buyCount} out of ${totalGurus} Gurus say BUY!`;
    subTitle = 'Strong consensus. Looks like a solid opportunity. 🚀';
    bgClass = 'bg-green-500 text-white shadow-green-200';
    icon = <TrendingUp className="w-6 h-6" />;
  } else if (sellCount >= 3) {
    title = `Warning: ${sellCount} Gurus say SELL`;
    subTitle = 'The experts are cautious. Check the risks. 📉';
    bgClass = 'bg-red-500 text-white shadow-red-200';
    icon = <TrendingDown className="w-6 h-6" />;
  } else {
    title = 'Mixed Signals Detected';
    subTitle = `${buyCount} Buy, ${holdCount} Hold, ${sellCount} Sell. Watch carefully. 👀`;
    bgClass = 'bg-gray-900 text-white shadow-gray-300';
    icon = <Minus className="w-6 h-6" />;
  }

  return (
    <div className="text-center mb-8 px-2 animate-in slide-in-from-top-4 duration-700">
      <div
        className={`inline-flex items-center justify-center p-3 rounded-2xl shadow-lg mb-4 ${bgClass}`}
      >
        {icon}
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2 leading-tight">
        {title}
      </h2>
      <p className="text-gray-500 font-medium text-lg">{subTitle}</p>
    </div>
  );
}

// Gauge Chart (기존 유지하되 스타일 다듬음)
function GaugeChart({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 61) return '#22c55e'; // Green-500
    if (score >= 41) return '#eab308'; // Yellow-500
    return '#ef4444'; // Red-500
  };

  const arrowAngle = (score / 100) * 180;
  const arrowRad = ((180 - arrowAngle) * Math.PI) / 180;
  const radius = 80;
  const arrowX = 100 + radius * Math.cos(arrowRad);
  const arrowY = 100 - radius * Math.sin(arrowRad);
  const mainColor = getColor();

  return (
    <div className="relative w-full max-w-[240px] mx-auto mb-10">
      <div className="absolute inset-0 bg-white/50 blur-3xl rounded-full" />
      <svg viewBox="0 0 200 110" className="relative z-10 w-full h-auto drop-shadow-sm">
        {/* Background Track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Active Track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={mainColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.33} 251.33`}
          style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
        />

        {/* Needle */}
        <g
          transform={`translate(${arrowX}, ${arrowY}) rotate(${-arrowAngle + 90})`}
          style={{ transition: 'transform 1.5s ease-out' }}
        >
          <circle r="4" fill="white" stroke={mainColor} strokeWidth="2" />
        </g>

        {/* Text */}
        <text x="100" y="85" textAnchor="middle" className="text-4xl font-bold" fill="#1e293b">
          {score}
        </text>
        <text
          x="100"
          y="105"
          textAnchor="middle"
          className="text-[10px] uppercase tracking-widest font-semibold"
          fill="#94a3b8"
        >
          Total Score
        </text>
      </svg>
    </div>
  );
}

/**
 * [NEW] CleanGuruCard
 * 복잡한 배지 대신 카드 형태로 정보를 정리하여 가독성을 높였습니다.
 */
function CleanGuruCard({
  persona,
  result,
  onClick,
}: {
  persona: (typeof PERSONAS)[number];
  result: PersonaResult;
  onClick: () => void;
}) {
  const isBuy = result.verdict.includes('BUY');
  const isSell = result.verdict.includes('SELL');

  // 상태별 색상 및 텍스트 정의
  const statusColor = isBuy
    ? 'text-green-600 bg-green-50'
    : isSell
    ? 'text-red-600 bg-red-50'
    : 'text-yellow-600 bg-yellow-50';
  const borderColor = isBuy ? 'border-green-100' : isSell ? 'border-red-100' : 'border-yellow-100';

  // 목표가 또는 상태 표시
  let footerContent;
  if (persona.key === 'druckenmiller') {
    footerContent = <span className="text-xs font-bold">{result.trend_status || 'Neutral'}</span>;
  } else {
    footerContent = result.display_price ? (
      <span className="text-xs font-bold font-mono">${result.display_price.toFixed(0)}</span>
    ) : (
      <span className="text-xs text-gray-400">-</span>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center p-3 rounded-2xl border ${borderColor} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95`}
    >
      {/* Verdict Indicator (Dot) */}
      <div
        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
          isBuy ? 'bg-green-500' : isSell ? 'bg-red-500' : 'bg-yellow-400'
        }`}
      />

      {/* Avatar */}
      <div className="mb-3 relative">
        <Avatar className="w-16 h-16 ring-4 ring-white shadow-sm group-hover:scale-105 transition-transform">
          <AvatarImage src={getPersonaAvatar(persona.key, result.verdict)} />
          <AvatarFallback>{persona.name[0]}</AvatarFallback>
        </Avatar>
        {/* Win Rate Badge */}
        <div className="absolute -bottom-2 -right-1 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white">
          {result.win_rate}%
        </div>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{persona.name}</h3>

      {/* Verdict Pill */}
      <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mb-2 ${statusColor}`}>
        {result.verdict.replace('_', ' ')}
      </div>

      {/* Footer: Price/Trend */}
      <div className="w-full pt-2 border-t border-gray-100 text-center text-gray-600">
        {footerContent}
      </div>
    </div>
  );
}

// Bottom Sheet (내용은 유지하되 스타일만 살짝 정리)
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
  const theme = getThemeColor(result.verdict);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
        {/* Header Color Bar */}
        <div
          className={`h-2 w-full ${
            result.verdict.includes('BUY')
              ? 'bg-green-500'
              : result.verdict.includes('SELL')
              ? 'bg-red-500'
              : 'bg-yellow-400'
          }`}
        />

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Top Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="w-20 h-20 mb-3 ring-4 ring-slate-50">
              <AvatarImage src={getPersonaAvatar(persona.key, result.verdict)} />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-gray-900">{persona.name}'s Analysis</h2>
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${theme}`}>
              {result.verdict.replace('_', ' ')}
            </div>
          </div>

          {/* Logic Box */}
          <div className="bg-slate-50 p-4 rounded-xl mb-6">
            <p className="text-slate-700 text-sm leading-relaxed font-medium">"{result.logic}"</p>
          </div>

          {/* Key Factors List */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Key Factors
            </h3>
            {Object.entries(result.analysis_summary.key_factors).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0"
              >
                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
              </div>
            ))}
          </div>

          <Button onClick={onClose} className="w-full rounded-xl h-12 text-base font-semibold">
            Close Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function GuruPickPage() {
  const [ticker, setTicker] = useState('META'); // 기본값 META로 변경 (테스트용)
  const [data, setData] = useState<InvestmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<{
    persona: (typeof PERSONAS)[number];
    result: PersonaResult;
  } | null>(null);

  useEffect(() => {
    // API Call Mocking (실제 환경에서는 fetch 사용)
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invest/${ticker}`);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
        // Fallback for demo if API fails
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (ticker) fetchData();
  }, [ticker]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden border-x border-slate-100">
        {/* 1. Top Navigation */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold tracking-tight">Guru Pick</h1>
            <div className="text-xs font-medium text-slate-400">Powered by AI</div>
          </div>
          <TickerAutocomplete value={ticker} onValueChange={setTicker} />
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Analyzing stock data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-slate-600">{error}</p>
            <Button variant="link" onClick={() => setTicker(ticker)}>
              Retry
            </Button>
          </div>
        ) : data ? (
          <div className="p-5">
            {/* 2. Stock Info Header */}
            <div className="text-center mb-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                {data.company_name}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-extrabold text-slate-900">
                  ${data.meta.current_price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 3. Hero Section (Consensus) - 요청하신 핵심 변경 사항 */}
            <ConsensusHero summary={data.summary} />

            {/* 4. Score Gauge */}
            <GaugeChart score={data.summary.total_score} />

            {/* 5. Guru Grid - 리디자인된 카드 그리드 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-slate-800">Guru Opinions</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  Tap for details
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {PERSONAS.map((p) => (
                  <CleanGuruCard
                    key={p.key}
                    persona={p}
                    result={data.results[p.key]}
                    onClick={() => setSelectedPersona({ persona: p, result: data.results[p.key] })}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Bottom Sheet */}
        <AnimatePresence>
          {selectedPersona && (
            <BottomSheet
              isOpen={!!selectedPersona}
              onClose={() => setSelectedPersona(null)}
              persona={selectedPersona.persona}
              result={selectedPersona.result}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

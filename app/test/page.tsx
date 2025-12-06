'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TickerAutocomplete } from '@/components/TickerAutocomplete';

interface PersonaResult {
  verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';
  target_price: number | null;
  sell_price: number | null;
  logic: string;
  metric_name?: string;
  metric_value?: number | null;
}

interface InvestmentData {
  ticker: string;
  meta: {
    current_price: number;
    data_period_used: string;
  };
  results: {
    buffett: PersonaResult;
    lynch: PersonaResult;
    graham: PersonaResult;
    fisher: PersonaResult;
    druckenmiller: PersonaResult;
    marks: PersonaResult;
  };
}

const PERSONAS = [
  { key: 'buffett', name: 'Warren Buffett', avatar: '/persona/main/buffett.png' },
  { key: 'lynch', name: 'Peter Lynch', avatar: '/persona/main/lynch.png' },
  { key: 'graham', name: 'Benjamin Graham', avatar: '/persona/main/graham.png' },
  { key: 'fisher', name: 'Ken Fisher', avatar: '/persona/main/fisher.png' },
  { key: 'druckenmiller', name: 'Stan Druckenmiller', avatar: '/persona/main/druckenmiller.png' },
  { key: 'marks', name: 'Howard Marks', avatar: '/persona/main/marks.png' },
] as const;

function getTrafficLightIndicator(verdict: string) {
  switch (verdict) {
    case 'STRONG_BUY':
      return <div className="w-4 h-4 rounded-full bg-green-800" />;
    case 'BUY':
      return <div className="w-4 h-4 rounded-full bg-green-500" />;
    case 'HOLD':
      return <div className="w-4 h-4 rounded-full bg-yellow-500" />;
    case 'SELL':
      return <div className="w-4 h-4 rounded-full bg-red-500" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-gray-500" />;
  }
}

function getVerdictVariant(verdict: string) {
  switch (verdict) {
    case 'STRONG_BUY':
      return 'default'; // Dark green (matches bg-green-800)
    case 'BUY':
      return 'secondary'; // Light green (matches bg-green-400)
    case 'HOLD':
      return 'outline'; // Yellow (matches bg-yellow-400)
    case 'SELL':
      return 'destructive'; // Red (matches bg-red-400)
    default:
      return 'outline'; // Gray
  }
}

// Price Visualizer Component
function PriceVisualizer({
  current,
  target,
  sell,
}: {
  current: number;
  target: number | null;
  sell: number | null;
}) {
  // Build chart data dynamically
  const chartData = [
    { label: 'NOW', value: current, fill: 'hsl(217, 91%, 60%)' }, // Blue
  ];

  if (target) {
    chartData.push({ label: 'TARGET', value: target, fill: 'hsl(142, 71%, 45%)' }); // Green
  }

  if (sell) {
    chartData.push({ label: 'LIMIT', value: sell, fill: 'hsl(0, 84%, 60%)' }); // Red
  }

  const chartConfig = {
    value: {
      label: 'Price',
    },
    now: {
      label: 'Current',
      color: 'hsl(217, 91%, 60%)',
    },
    target: {
      label: 'Target',
      color: 'hsl(142, 71%, 45%)',
    },
    limit: {
      label: 'Limit',
      color: 'hsl(0, 84%, 60%)',
    },
  } satisfies ChartConfig;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Price Comparison</p>
      <ChartContainer config={chartConfig} className="h-48 w-full">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `$${value}`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="value" radius={8}>
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={11}
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return `$${numValue.toFixed(2)}`;
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

// Detail Modal Component
function DetailModal({
  isOpen,
  onClose,
  persona,
  result,
  currentPrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  persona: (typeof PERSONAS)[number];
  result: PersonaResult;
  currentPrice: number;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
              <AvatarImage src={persona.avatar} />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{persona.name}</h3>
              <p className="text-xs text-gray-500">Investment Strategy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Verdict Banner */}
          <div
            className={`p-3 rounded-lg flex justify-between items-center ${
              result.verdict === 'STRONG_BUY'
                ? 'bg-green-100 text-green-900'
                : result.verdict === 'BUY'
                  ? 'bg-green-50 text-green-800'
                  : result.verdict === 'HOLD'
                    ? 'bg-yellow-50 text-yellow-800'
                    : result.verdict === 'SELL'
                      ? 'bg-red-50 text-red-900'
                      : 'bg-gray-100'
            }`}
          >
            <span className="font-bold text-lg">{result.verdict.replace('_', ' ')}</span>
            {getTrafficLightIndicator(result.verdict)}
          </div>

          {/* Key Logic */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Analysis Logic
            </h4>
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">
              "{result.logic}"
            </p>
          </div>

          {/* Key Metric */}
          {result.metric_name && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex justify-between items-center">
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {result.metric_name}
              </span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {result.metric_value?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
          )}

          {/* Price Visualizer */}
          <PriceVisualizer current={currentPrice} target={result.target_price} sell={result.sell_price} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-950 text-center text-xs text-gray-400">
          AI Generated Analysis based on {persona.name}'s methodology
        </div>
      </div>
    </div>
  );
}

interface PersonaCardProps {
  persona: (typeof PERSONAS)[number];
  result?: PersonaResult;
  onClick?: () => void;
}

function PersonaCard({ persona, result, onClick }: PersonaCardProps) {
  if (!result) {
    return (
      <Card className="animate-pulse py-2">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all py-2 active:scale-[0.98]"
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4">
          {/* Left: Avatar */}
          <Avatar className="w-12 h-12 shrink-0">
            <AvatarImage src={persona.avatar} alt={persona.name} />
            <AvatarFallback className="text-xs">
              {persona.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>

          {/* Middle: Name + Prices */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{persona.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Target: ${result.target_price?.toFixed(2) ?? 'N/A'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sell: ${result.sell_price?.toFixed(2) ?? 'N/A'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Tap for details</p>
          </div>

          {/* Right: Verdict + Traffic Light */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={getVerdictVariant(result.verdict) as any}
              className={`text-xs whitespace-nowrap ${
                result.verdict === 'STRONG_BUY'
                  ? 'bg-green-800 text-white border-transparent hover:bg-green-800/90'
                  : result.verdict === 'BUY'
                  ? 'bg-green-500 text-black border-transparent hover:bg-green-400/90'
                  : result.verdict === 'HOLD'
                  ? 'bg-yellow-500 text-black border-transparent hover:bg-yellow-400/90'
                  : result.verdict === 'SELL'
                  ? 'bg-red-500 text-white border-transparent hover:bg-red-400/90'
                  : ''
              }`}
            >
              {result.verdict.replace('_', ' ')}
            </Badge>
            {getTrafficLightIndicator(result.verdict)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestPage() {
  const [data, setData] = useState<InvestmentData | null>(null);
  const [ticker, setTicker] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<(typeof PERSONAS)[number] | null>(null);
  const [isUpdating, setIsUpdating] = useState(false); // 헤더 애니메이션용

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setIsUpdating(true); // 애니메이션 시작
      try {
        const res = await fetch(`/api/invest/${ticker}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch data for ${ticker}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
        // 애니메이션 종료 (2초 후)
        setTimeout(() => setIsUpdating(false), 2000);
      }
    };

    fetchData();
  }, [ticker]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      {/* Mobile-first: single column */}
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Investment Analysis
          </h1>
          {data && (
            <div className="relative inline-block">
              <p className={`text-sm text-gray-600 dark:text-gray-400 ${isUpdating ? 'animate-bounce' : ''}`}>
                <span className="font-bold text-gray-900 dark:text-gray-100">{data.ticker}</span> · Current Price: $<span className="font-bold text-gray-900 dark:text-gray-100">{data.meta.current_price.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Ticker Autocomplete */}
        <TickerAutocomplete
          value={ticker}
          onValueChange={setTicker}
          placeholder="티커, 회사명 검색... (예: 애플, AAPL)"
        />

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Persona Cards */}
        {PERSONAS.map((persona) => (
          <PersonaCard
            key={persona.key}
            persona={persona}
            result={loading ? undefined : data?.results[persona.key]}
            onClick={() => data && setSelectedPersona(persona)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPersona && data && (
        <DetailModal
          isOpen={!!selectedPersona}
          onClose={() => setSelectedPersona(null)}
          persona={selectedPersona}
          result={data.results[selectedPersona.key]}
          currentPrice={data.meta.current_price}
        />
      )}
    </div>
  );
}

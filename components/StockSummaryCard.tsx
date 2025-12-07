import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Summary {
  total_score: number;
  consensus_verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';
  opinion_breakdown: {
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
  };
}

interface StockSummaryCardProps {
  summary: Summary;
}

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case 'STRONG_BUY':
      return 'bg-green-800 text-white border-transparent hover:bg-green-800/90';
    case 'BUY':
      return 'bg-green-500 text-black border-transparent hover:bg-green-500/90';
    case 'HOLD':
      return 'bg-yellow-500 text-black border-transparent hover:bg-yellow-500/90';
    case 'SELL':
      return 'bg-red-500 text-white border-transparent hover:bg-red-500/90';
    default:
      return 'bg-gray-500 text-white';
  }
}

function getVerdictKorean(verdict: string) {
  switch (verdict) {
    case 'STRONG_BUY':
      return '강력 매수';
    case 'BUY':
      return '매수';
    case 'HOLD':
      return '보류';
    case 'SELL':
      return '매도';
    default:
      return 'N/A';
  }
}

export function StockSummaryCard({ summary }: StockSummaryCardProps) {
  const { total_score, consensus_verdict, opinion_breakdown } = summary;

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-6 space-y-4">
        {/* Consensus Verdict */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">종합 의견</h3>
          <Badge className={`text-base px-4 py-1 ${getVerdictColor(consensus_verdict)}`}>
            {getVerdictKorean(consensus_verdict)}
          </Badge>
        </div>

        {/* Total Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">총점</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {total_score}/100
            </span>
          </div>
          <Progress value={total_score} className="h-2" />
        </div>

        {/* Opinion Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">의견 분포</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-800 dark:text-green-400">강력 매수:</span>
              <span className="font-semibold">{opinion_breakdown.strong_buy}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-300">매수:</span>
              <span className="font-semibold">{opinion_breakdown.buy}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600 dark:text-yellow-300">보류:</span>
              <span className="font-semibold">{opinion_breakdown.hold}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-300">매도:</span>
              <span className="font-semibold">{opinion_breakdown.sell}개</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

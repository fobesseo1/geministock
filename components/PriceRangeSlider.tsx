interface PriceGuide {
  buy_zone_max: number | null;
  profit_zone_min: number | null;
  stop_loss: number | null;
}

interface PriceRangeSliderProps {
  current: number;
  priceGuide: PriceGuide;
}

export function PriceRangeSlider({ current, priceGuide }: PriceRangeSliderProps) {
  const { buy_zone_max, profit_zone_min, stop_loss } = priceGuide;

  // Calculate price range for visualization
  const prices = [current, buy_zone_max, profit_zone_min, stop_loss].filter(
    (p): p is number => p !== null && p > 0
  );

  if (prices.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-sm text-gray-500">
        가격 가이드 정보가 없습니다
      </div>
    );
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range * 0.1; // 10% padding on each side

  const chartMin = minPrice - padding;
  const chartMax = maxPrice + padding;
  const chartRange = chartMax - chartMin;

  // Calculate positions (percentage)
  const getPosition = (price: number | null) => {
    if (price === null) return null;
    return ((price - chartMin) / chartRange) * 100;
  };

  const currentPos = getPosition(current);
  const buyZonePos = getPosition(buy_zone_max);
  const profitZonePos = getPosition(profit_zone_min);
  const stopLossPos = getPosition(stop_loss);

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">가격 구간 분석</p>

      {/* Visual slider */}
      <div className="relative h-16 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {/* Buy Zone (green area) */}
        {buyZonePos !== null && currentPos !== null && (
          <div
            className="absolute top-0 bottom-0 bg-green-200 dark:bg-green-900/40"
            style={{
              left: `${Math.min(buyZonePos, currentPos)}%`,
              right: `${100 - Math.max(buyZonePos, currentPos)}%`,
            }}
          />
        )}

        {/* Profit Zone (light green area) */}
        {profitZonePos !== null && currentPos !== null && (
          <div
            className="absolute top-0 bottom-0 bg-green-100 dark:bg-green-900/20"
            style={{
              left: `${Math.min(profitZonePos, currentPos)}%`,
              right: `${100 - Math.max(profitZonePos, currentPos)}%`,
            }}
          />
        )}

        {/* Stop Loss marker (red line) */}
        {stopLossPos !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
            style={{ left: `${stopLossPos}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 dark:text-red-400 whitespace-nowrap">
              손절
            </div>
          </div>
        )}

        {/* Buy Zone marker */}
        {buyZonePos !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-600"
            style={{ left: `${buyZonePos}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-700 dark:text-green-400 whitespace-nowrap">
              매수
            </div>
          </div>
        )}

        {/* Profit Zone marker */}
        {profitZonePos !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-400"
            style={{ left: `${profitZonePos}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-600 dark:text-green-300 whitespace-nowrap">
              익절
            </div>
          </div>
        )}

        {/* Current Price marker (dot) */}
        {currentPos !== null && (
          <div
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${currentPos}%` }}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              현재
            </div>
          </div>
        )}
      </div>

      {/* Price labels */}
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 px-1">
        <span>${chartMin.toFixed(2)}</span>
        <span>${chartMax.toFixed(2)}</span>
      </div>

      {/* Price details */}
      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
        <div>
          <span className="text-gray-500">현재 가격:</span>
          <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">
            ${current.toFixed(2)}
          </span>
        </div>
        {buy_zone_max && (
          <div>
            <span className="text-gray-500">매수 구간:</span>
            <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
              ${buy_zone_max.toFixed(2)}
            </span>
          </div>
        )}
        {profit_zone_min && (
          <div>
            <span className="text-gray-500">익절 구간:</span>
            <span className="ml-1 font-semibold text-green-500 dark:text-green-300">
              ${profit_zone_min.toFixed(2)}
            </span>
          </div>
        )}
        {stop_loss && (
          <div>
            <span className="text-gray-500">손절가:</span>
            <span className="ml-1 font-semibold text-red-600 dark:text-red-400">
              ${stop_loss.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

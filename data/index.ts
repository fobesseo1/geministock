/**
 * 사용 가능한 종목 목록
 */
export const AVAILABLE_STOCKS = [
  {
    symbol: 'AAPL',
    name: '애플',
    market: 'NASDAQ',
  },
  // 추후 다른 종목 추가
];

export function getStockName(symbol: string): string {
  const stock = AVAILABLE_STOCKS.find(s => s.symbol === symbol);
  return stock ? stock.name : symbol;
}

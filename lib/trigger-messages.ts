/**
 * Trigger code to Korean message mapping
 * Converts developer-facing trigger codes to user-friendly Korean messages
 */

const TRIGGER_MESSAGES: Record<string, string> = {
  // Buffett (ROE-based)
  'BUY_MOAT_BARGAIN': '워렌 버핏: 강력한 경제적 해자와 함께 큰 폭으로 저평가되어 있습니다',
  'BUY_QUALITY_FAIR': '워렌 버핏: 우수한 기업이 적정 가격에 거래되고 있습니다',
  'HOLD_MOAT_FAIR': '워렌 버핏: 경쟁우위는 있으나 가격이 적정 수준입니다',
  'SELL_MOAT_EXPENSIVE': '워렌 버핏: ROE는 우수하지만 현재 가격이 너무 비쌉니다',
  'SELL_WEAK_BUSINESS': '워렌 버핏: ROE가 낮아 투자 매력이 부족합니다',

  // Lynch (PEG-based)
  'BUY_FAST_GROWER': '피터 린치: 빠른 성장주로 PEG가 매우 낮습니다',
  'BUY_STALWART': '피터 린치: 안정적인 성장주로 적정 가격입니다',
  'HOLD_FAIR_VALUE': '피터 린치: 성장 대비 가격이 공정합니다',
  'HOLD_DEBT_WARNING': '피터 린치: 부채 수준이 다소 높아 주의가 필요합니다',
  'SELL_PEG_EXPENSIVE': '피터 린치: PEG 비율이 높아 성장 대비 비쌉니다',
  'SELL_DEBT_RISK': '피터 린치: 부채비율이 너무 높아 위험합니다',

  // Graham (Value-based)
  'BUY_MARGIN_SAFETY': '벤저민 그레이엄: 내재가치 대비 큰 폭으로 저평가되어 안전마진이 있습니다',
  'HOLD_NEAR_VALUE': '벤저민 그레이엄: 가격이 내재가치 근처입니다',
  'HOLD_ABOVE_VALUE': '벤저민 그레이엄: 가격이 내재가치보다 다소 높습니다',
  'SELL_OVERVALUED': '벤저민 그레이엄: 내재가치 대비 크게 고평가되어 있습니다',

  // Fisher (PSR-based)
  'BUY_PSR_BARGAIN': '켄 피셔: 매출 대비 주가가 매우 낮아 매수 기회입니다',
  'BUY_PSR_FAIR': '켄 피셔: 매출 대비 주가가 적정 수준입니다',
  'HOLD_PSR_BAND': '켄 피셔: PSR이 역사적 범위 내에 있습니다',
  'SELL_PSR_EXPENSIVE': '켄 피셔: 매출 대비 주가가 역사적 최고치를 넘어섭니다',

  // Druckenmiller (Trend-based)
  'BUY_TREND_BREAKOUT': '스탠 드러켄밀러: 강한 상승 추세가 지속되고 있습니다',
  'HOLD_DIP_OPPORTUNITY': '스탠 드러켄밀러: 추세는 유효하나 단기 조정 중입니다',
  'SELL_TREND_BROKEN': '스탠 드러켄밀러: 200일 이동평균선 이탈로 추세가 깨졌습니다',

  // Marks (Cycle-based)
  'BUY_PANIC_BOTTOM': '하워드 막스: 공황 매도로 사이클 저점이며 강력한 매수 기회입니다',
  'BUY_CYCLE_BOTTOM': '하워드 막스: 사이클 저점으로 역발상 매수 기회입니다',
  'HOLD_MID_CYCLE': '하워드 막스: 사이클 중간으로 관망이 적절합니다',
  'SELL_EUPHORIA_TOP': '하워드 막스: 과도한 낙관으로 사이클 정점입니다',
};

/**
 * Get Korean message for a trigger code
 * @param code - Trigger code from API (e.g., "SELL_MOAT_EXPENSIVE")
 * @returns Korean message or the original code if not found
 */
export function getTriggerMessage(code: string): string {
  return TRIGGER_MESSAGES[code] || code;
}

/**
 * Check if trigger code exists in the map
 * @param code - Trigger code to check
 * @returns true if code has a Korean translation
 */
export function hasTriggerMessage(code: string): boolean {
  return code in TRIGGER_MESSAGES;
}

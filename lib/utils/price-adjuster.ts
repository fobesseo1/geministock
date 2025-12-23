import type { PriceStatus } from '@/lib/types/investment-analysis';

interface DisplayPriceResult {
  display_price: number | null;
  price_status: PriceStatus;
}

/**
 * Calculate UI-friendly display price with Soft Cap/Floor
 *
 * Prevents unrealistic price targets (±200%) from confusing users.
 * - Base range: ±30% from current price
 * - Damping factor: 20% (excess beyond ±30% is compressed)
 *
 * Example:
 * - Current: $100
 * - Raw target: $300 (+200%)
 * - Upper limit: $130 (+30%)
 * - Excess: $170
 * - Display: $130 + ($170 * 0.2) = $164 (+64%)
 *
 * @param currentPrice - Current market price
 * @param rawTargetPrice - Raw target price from algorithm (can be null)
 * @returns DisplayPriceResult with adjusted price and status
 */
export function calculateDisplayPrice(
  currentPrice: number,
  rawTargetPrice: number | null
): DisplayPriceResult {
  // Handle null or invalid target price (e.g., momentum strategies)
  if (rawTargetPrice === null || rawTargetPrice <= 0) {
    return { display_price: null, price_status: 'NORMAL' };
  }

  const CAP_THRESHOLD = 0.3; // +30% upper limit
  const FLOOR_THRESHOLD = 0.3; // -30% lower limit
  const DAMPING_FACTOR = 0.2; // 20% of excess is preserved

  const upperLimit = currentPrice * (1 + CAP_THRESHOLD);
  const lowerLimit = currentPrice * (1 - FLOOR_THRESHOLD);

  // Case 1: Soft Cap (price target too high)
  if (rawTargetPrice > upperLimit) {
    const excess = rawTargetPrice - upperLimit;
    const dampedPrice = upperLimit + excess * DAMPING_FACTOR;
    return {
      display_price: Number(dampedPrice.toFixed(2)),
      price_status: 'SOFT_CAP',
    };
  }

  // Case 2: Soft Floor (price target too low)
  if (rawTargetPrice < lowerLimit) {
    const deficit = lowerLimit - rawTargetPrice;
    const dampedPrice = lowerLimit - deficit * DAMPING_FACTOR;
    return {
      display_price: Number(dampedPrice.toFixed(2)),
      price_status: 'SOFT_FLOOR',
    };
  }

  // Case 3: Normal range (within ±30%)
  return {
    display_price: Number(rawTargetPrice.toFixed(2)),
    price_status: 'NORMAL',
  };
}

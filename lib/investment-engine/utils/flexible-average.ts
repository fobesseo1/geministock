/**
 * Utility functions for flexible data averaging and growth calculations
 */

interface AverageOptions {
  allowNegative?: boolean;
  allowZero?: boolean;
}

/**
 * Calculate average from array of values with flexible handling
 *
 * Priority:
 * 1. Use all available valid values
 * 2. Filter out null/undefined
 * 3. Optionally filter out negative or zero values
 * 4. Return null if no valid values
 *
 * @param values - Array of numbers (may include null/undefined)
 * @param options - Configuration for handling edge cases
 * @returns Average of valid values, or null if none
 */
export function getFlexibleAverage(
  values: (number | null | undefined)[],
  options: AverageOptions = {}
): number | null {
  const { allowNegative = false, allowZero = false } = options;

  const validValues = values.filter((v) => {
    if (v === null || v === undefined) return false;
    if (!allowNegative && v < 0) return false;
    if (!allowZero && v === 0) return false;
    return true;
  }) as number[];

  if (validValues.length === 0) return null;

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 *
 * Formula: (endValue / startValue)^(1/years) - 1
 *
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param years - Number of years
 * @returns Growth rate as decimal (e.g., 0.10 for 10% growth)
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) {
    return 0;
  }

  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * Safe division that returns 0 instead of Infinity or NaN
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
    return 0;
  }
  return numerator / denominator;
}

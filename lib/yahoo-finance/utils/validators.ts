/**
 * Validates that a number is finite and not NaN
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

/**
 * Validates that a value is defined and not null
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type guard for checking if value is positive
 */
export function isPositive(value: number): boolean {
  return isValidNumber(value) && value > 0;
}

/**
 * Normalize ticker for Yahoo Finance API
 * Yahoo Finance uses hyphens instead of dots for class shares
 * Examples: BRK.B → BRK-B, BF.A → BF-A
 */
export function normalizeTickerForYahoo(ticker: string): string {
  return ticker.replace(/\./g, '-');
}

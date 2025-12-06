import { StockDataError, StockDataErrorType } from '@/lib/types/stock-data';

/**
 * Determines if error is due to rate limiting
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    );
  }
  return false;
}

/**
 * Determines if ticker exists but has insufficient data
 */
export function isInsufficientDataError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('no data') ||
      message.includes('insufficient') ||
      message.includes('missing')
    );
  }
  return false;
}

/**
 * Wraps Yahoo Finance API errors with context
 */
export function handleYahooFinanceError(
  error: unknown,
  ticker: string,
  operation: string
): never {
  console.error(`Error in ${operation} for ${ticker}:`, error);

  if (error instanceof StockDataError) {
    throw error;
  }

  if (isRateLimitError(error)) {
    throw new StockDataError(
      StockDataErrorType.RATE_LIMIT,
      `Rate limit exceeded while fetching data for ${ticker}. Please try again later.`,
      error
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('404')) {
      throw new StockDataError(
        StockDataErrorType.TICKER_NOT_FOUND,
        `Ticker symbol "${ticker}" not found.`,
        error
      );
    }

    if (isInsufficientDataError(error)) {
      throw new StockDataError(
        StockDataErrorType.INSUFFICIENT_DATA,
        `Insufficient data available for ticker "${ticker}".`,
        error
      );
    }

    throw new StockDataError(
      StockDataErrorType.API_ERROR,
      `Failed to fetch data for ${ticker}: ${error.message}`,
      error
    );
  }

  throw new StockDataError(
    StockDataErrorType.API_ERROR,
    `Unknown error occurred while fetching data for ${ticker}.`,
    error
  );
}

/**
 * Creates user-friendly error messages for common scenarios
 */
export function createUserFriendlyError(
  errorType: StockDataErrorType,
  ticker: string,
  additionalContext?: string
): StockDataError {
  const messages: Record<StockDataErrorType, string> = {
    [StockDataErrorType.TICKER_NOT_FOUND]: `Ticker "${ticker}" not found. Please check the symbol and try again.`,
    [StockDataErrorType.INSUFFICIENT_DATA]: `Insufficient historical data available for "${ticker}". ${additionalContext || ''}`,
    [StockDataErrorType.API_ERROR]: `Unable to fetch data for "${ticker}". ${additionalContext || 'Please try again later.'}`,
    [StockDataErrorType.CALCULATION_ERROR]: `Error calculating metrics for "${ticker}". ${additionalContext || ''}`,
    [StockDataErrorType.RATE_LIMIT]: `Too many requests. Please wait a moment before trying again.`,
  };

  return new StockDataError(errorType, messages[errorType]);
}

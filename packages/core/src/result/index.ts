import type {
  MediaType,
  MediaSuccessResult,
  MediaErrorResult,
  MediaResult,
} from '../types/index.js';

/**
 * Common error codes
 */
export const ErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_FORMAT: 'INVALID_FORMAT',
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  NO_PROVIDER: 'NO_PROVIDER',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Create a success result
 */
export function createSuccess(params: {
  mediaType: MediaType;
  action: string;
  provider: string;
  outputPath: string;
  mime: string;
  bytes: number;
}): MediaSuccessResult {
  return {
    ok: true,
    media_type: params.mediaType,
    action: params.action,
    provider: params.provider,
    output_path: params.outputPath,
    mime: params.mime,
    bytes: params.bytes,
  };
}

/**
 * Create an error result
 */
export function createError(
  code: string,
  message: string
): MediaErrorResult {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Check if a result is successful
 */
export function isSuccess(result: MediaResult): result is MediaSuccessResult {
  return result.ok === true;
}

/**
 * Check if a result is an error
 */
export function isError(result: MediaResult): result is MediaErrorResult {
  return result.ok === false;
}

/**
 * Format a result as JSON string for stdout
 */
export function formatResult(result: MediaResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Print result to stdout (for CLI)
 */
export function printResult(result: MediaResult): void {
  console.log(formatResult(result));
}

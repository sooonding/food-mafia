export const searchErrorCodes = {
  invalidQuery: 'INVALID_QUERY',
  naverApiError: 'NAVER_API_ERROR',
  parseError: 'PARSE_ERROR',
  networkError: 'NETWORK_ERROR',
  configError: 'CONFIG_ERROR',
} as const;

export type SearchErrorCode =
  (typeof searchErrorCodes)[keyof typeof searchErrorCodes];

export interface SearchServiceError {
  code: SearchErrorCode;
  message: string;
}

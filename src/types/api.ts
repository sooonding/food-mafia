export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  SEARCH_FAILED: 'SEARCH_001',
  SEARCH_QUOTA_EXCEEDED: 'SEARCH_002',
  SEARCH_EMPTY_QUERY: 'SEARCH_003',

  MAP_LOAD_FAILED: 'MAP_001',
  MAP_DATA_FAILED: 'MAP_002',

  LOCATION_PERMISSION_DENIED: 'LOCATION_001',
  LOCATION_UNAVAILABLE: 'LOCATION_002',
  LOCATION_TIMEOUT: 'LOCATION_003',

  REVIEW_UNAUTHORIZED: 'REVIEW_001',
  REVIEW_NOT_FOUND: 'REVIEW_002',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

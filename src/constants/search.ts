export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 20,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
} as const;

export const SEARCH_HISTORY_CONFIG = {
  MAX_ITEMS: 10,
  STORAGE_KEY: 'mafia-search-history',
} as const;

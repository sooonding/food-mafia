export const REVIEW_VALIDATION = {
  AUTHOR_NAME: {
    MIN: 2,
    MAX: 10,
  },
  RATING: {
    MIN: 1,
    MAX: 5,
  },
  CONTENT: {
    MIN: 10,
    MAX: 500,
  },
  PASSWORD: {
    MIN: 4,
    MAX: 20,
  },
} as const;

export const REVIEW_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

export const REVIEW_SORT_OPTIONS = {
  LATEST: 'latest',
  RATING: 'rating',
} as const;

export type ReviewSortOption = typeof REVIEW_SORT_OPTIONS[keyof typeof REVIEW_SORT_OPTIONS];

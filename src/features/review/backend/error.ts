export const reviewErrorCodes = {
  notFound: 'REVIEW_NOT_FOUND',
  unauthorized: 'REVIEW_UNAUTHORIZED',
  fetchError: 'REVIEW_FETCH_ERROR',
  validationError: 'REVIEW_VALIDATION_ERROR',
  updateError: 'REVIEW_UPDATE_ERROR',
  createError: 'REVIEW_CREATE_ERROR',
  deleteError: 'REVIEW_DELETE_ERROR',
} as const;

type ReviewErrorValue = (typeof reviewErrorCodes)[keyof typeof reviewErrorCodes];

export type ReviewServiceError = ReviewErrorValue;

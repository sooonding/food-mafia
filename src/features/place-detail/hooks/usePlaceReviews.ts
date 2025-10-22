'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/react-query';
import type { ReviewListResponse } from '@/types/review';

export type ReviewSortOption = 'latest' | 'rating';

export function usePlaceReviews(
  placeId: string,
  sort: ReviewSortOption = 'latest'
) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.list(placeId, sort),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiGet<ReviewListResponse>(
        `/places/${placeId}/reviews?page=${pageParam}&limit=20&sort=${sort}`
      );

      if (!response.success) {
        const errorMessage =
          'error' in response ? response.error.message : 'Failed to fetch reviews';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!placeId,
  });
}

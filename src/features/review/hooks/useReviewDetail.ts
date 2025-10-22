'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/remote/api-client';
import type { ReviewResponse } from '@/features/review/lib/dto';

export const useReviewDetail = (reviewId: string | null | undefined) => {
  return useQuery({
    queryKey: ['reviews', 'detail', reviewId],
    queryFn: async () => {
      if (!reviewId) {
        throw new Error('Review ID is required');
      }

      const response = await apiGet<ReviewResponse>(`/reviews/${reviewId}`);

      if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch review');
      }

      return response.data;
    },
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

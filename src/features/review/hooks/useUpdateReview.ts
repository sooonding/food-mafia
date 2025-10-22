'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/react-query';
import { apiPatch } from '@/lib/remote/api-client';
import type { ReviewResponse, ReviewUpdateInput } from '@/features/review/lib/dto';

interface UseUpdateReviewOptions {
  reviewId: string;
  placeId: string;
  onSuccess?: (data: ReviewResponse) => void;
  onError?: (error: Error) => void;
}

export const useUpdateReview = ({
  reviewId,
  placeId,
  onSuccess,
  onError,
}: UseUpdateReviewOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: ReviewUpdateInput) => {
      const response = await apiPatch<ReviewResponse>(`/reviews/${reviewId}`, input);

      if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to update review');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.lists() });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'detail', reviewId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.places.detail(placeId) });

      // 성공 토스트 메시지
      toast.success('리뷰가 수정되었습니다');

      // 사용자 제공 콜백 실행
      if (onSuccess) {
        onSuccess(data);
      }

      // 장소 상세 페이지로 리다이렉트
      router.push(`/place/${placeId}`);
    },
    onError: (error: Error) => {
      // 에러 토스트 메시지
      const errorMessage = error.message || '리뷰 수정에 실패했습니다';
      toast.error(errorMessage);

      // 에러 로깅
      console.error('[useUpdateReview] Error:', error);

      // 사용자 제공 콜백 실행
      if (onError) {
        onError(error);
      }
    },
  });
};

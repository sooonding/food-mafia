import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/react-query';
import { apiPost } from '@/lib/remote/api-client';
import type { Review } from '@/types/review';
import type { ReviewCreateInput } from '@/schemas/review';
import { toast } from 'sonner';

export function useCreateReview(placeId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ReviewCreateInput) => {
      const response = await apiPost<Review>(`/places/${placeId}/reviews`, data);

      if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to create review');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // 리뷰 목록 캐시 무효화 (장소 상세 페이지에서 최신 리뷰 표시)
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.lists() });

      // 장소 정보 캐시 무효화 (평균 평점, 리뷰 수 갱신)
      queryClient.invalidateQueries({ queryKey: queryKeys.places.detail(placeId) });

      // 장소 목록 캐시 무효화 (지도 마커 갱신, 첫 리뷰인 경우)
      queryClient.invalidateQueries({ queryKey: queryKeys.places.lists() });

      // 성공 토스트 메시지
      toast.success('리뷰가 작성되었습니다');

      // 장소 상세 페이지로 리다이렉트
      router.push(`/place/${placeId}`);
    },
    onError: (error: Error) => {
      // 에러 토스트 메시지
      const errorMessage = error.message || '리뷰 작성에 실패했습니다';
      toast.error(errorMessage);

      // 에러 로깅 (프로덕션 환경에서는 Sentry 등 활용)
      console.error('[useCreateReview] Error:', error);
    },
  });
}

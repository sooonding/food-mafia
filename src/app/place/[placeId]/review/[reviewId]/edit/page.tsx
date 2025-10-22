'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { usePlace } from '@/features/place/hooks/usePlace';
import { useReviewDetail } from '@/features/review/hooks/useReviewDetail';
import { PageHeader } from '@/components/layout/PageHeader';
import { PlaceHeaderCard } from '@/features/place/components/PlaceHeaderCard';
import { ReviewForm } from '@/features/review/components/ReviewForm';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

interface ReviewEditPageProps {
  params: Promise<{
    placeId: string;
    reviewId: string;
  }>;
}

export default function ReviewEditPage({ params }: ReviewEditPageProps) {
  const router = useRouter();
  const { placeId, reviewId } = use(params);

  // 데이터 로딩
  const {
    data: place,
    isLoading: isPlaceLoading,
    isError: isPlaceError,
  } = usePlace(placeId);

  const {
    data: review,
    isLoading: isReviewLoading,
    isError: isReviewError,
  } = useReviewDetail(reviewId);

  // 로딩 상태
  if (isPlaceLoading || isReviewLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-2xl mx-auto p-4">
          <Skeleton className="h-14 mb-4" />
          <Skeleton className="h-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
            <Skeleton className="h-20" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 - 장소 없음
  if (isPlaceError || !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="장소를 찾을 수 없습니다"
          description="요청하신 장소가 존재하지 않거나 삭제되었습니다."
          action={
            <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
          }
        />
      </div>
    );
  }

  // 에러 상태 - 리뷰 없음
  if (isReviewError || !review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="리뷰를 찾을 수 없습니다"
          description="요청하신 리뷰가 존재하지 않거나 이미 삭제되었습니다."
          action={
            <Button onClick={() => router.push(`/place/${placeId}`)}>
              장소 페이지로 돌아가기
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-2xl mx-auto p-4">
        {/* 페이지 헤더 */}
        <PageHeader
          title="리뷰 수정"
          onBack={() => router.push(`/place/${placeId}`)}
        />

        {/* 장소 정보 요약 카드 */}
        <PlaceHeaderCard place={place} className="mb-6" />

        {/* 리뷰 수정 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ReviewForm
            mode="edit"
            placeId={placeId}
            reviewId={reviewId}
            defaultValues={{
              authorName: review.authorName,
              rating: review.rating,
              content: review.content,
              visitedAt: review.visitedAt || undefined,
              password: '', // 비밀번호는 재입력 필요
            }}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePlace } from '@/features/place/hooks/usePlace';
import { PlaceHeader } from './PlaceHeader';
import { ReviewForm } from './ReviewForm';
import { Skeleton } from '@/components/common/Skeleton';

interface ReviewNewPageContentProps {
  placeId: string;
}

export function ReviewNewPageContent({ placeId }: ReviewNewPageContentProps) {
  const { data: place, isLoading, isError } = usePlace(placeId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-4" /> {/* 뒤로가기 */}
          <Skeleton className="h-10 w-3/4 mb-2" /> {/* 장소명 */}
          <Skeleton className="h-6 w-full mb-8" /> {/* 주소 */}
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 (장소를 찾을 수 없음)
  if (isError || !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">장소를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">잘못된 접근이거나 삭제된 장소입니다</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 장소 정보 고정 헤더 */}
        <PlaceHeader place={place} />

        {/* 리뷰 작성 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold mb-6">리뷰 작성</h2>
          <ReviewForm placeId={placeId} />
        </div>
      </div>
    </div>
  );
}

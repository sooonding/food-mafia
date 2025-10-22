'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import { usePlaceReviews, ReviewSortOption } from '../hooks/usePlaceReviews';
import { PlaceHeader } from './PlaceHeader';
import { PlaceInfo } from './PlaceInfo';
import { ActionButtons } from './ActionButtons';
import { ReviewList } from './ReviewList';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

interface PlaceDetailClientProps {
  placeId: string;
}

export function PlaceDetailClient({ placeId }: PlaceDetailClientProps) {
  const router = useRouter();
  const [sortOption, setSortOption] = useState<ReviewSortOption>('latest');

  const {
    data: place,
    isLoading: isLoadingPlace,
    error: placeError,
  } = usePlaceDetail(placeId);

  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingReviews,
  } = usePlaceReviews(placeId, sortOption);

  if (isLoadingPlace || isLoadingReviews) {
    return (
      <div className="container mx-auto p-4 space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (placeError || !place) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="장소를 찾을 수 없습니다"
        description="삭제되었거나 존재하지 않는 장소입니다."
        action={
          <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
        }
      />
    );
  }

  const reviews = reviewPages?.pages.flatMap((page) => page.reviews) ?? [];

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <PlaceHeader place={place} />
      <PlaceInfo place={place} />
      <ActionButtons placeId={placeId} />
      <ReviewList
        reviews={reviews}
        sortOption={sortOption}
        onSortChange={setSortOption}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}

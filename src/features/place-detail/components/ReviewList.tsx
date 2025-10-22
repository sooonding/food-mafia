'use client';

import { useEffect, useRef } from 'react';
import { ReviewCard } from './ReviewCard';
import { ReviewSortFilter } from './ReviewSortFilter';
import { EmptyReviewState } from './EmptyReviewState';
import { Skeleton } from '@/components/common/Skeleton';
import type { Review } from '@/types/review';
import type { ReviewSortOption } from '../hooks/usePlaceReviews';

interface ReviewListProps {
  reviews: Review[];
  sortOption: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function ReviewList({
  reviews,
  sortOption,
  onSortChange,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ReviewListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (reviews.length === 0) {
    return <EmptyReviewState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">리뷰 {reviews.length}개</h2>
        <ReviewSortFilter value={sortOption} onChange={onSortChange} />
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasNextPage && (
        <div ref={observerTarget} className="py-4">
          {isFetchingNextPage && (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

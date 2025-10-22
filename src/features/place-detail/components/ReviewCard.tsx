'use client';

import { StarRating } from '@/components/common/StarRating';
import { formatRelativeTime, formatDate } from '@/lib/utils/date';
import type { Review } from '@/types/review';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            {review.authorName}
          </span>
          <StarRating rating={review.rating} readonly size="sm" />
        </div>
        <span className="text-sm text-gray-500">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {review.content}
      </p>

      {review.visitedAt && (
        <div className="text-xs text-gray-500">
          방문일: {formatDate(review.visitedAt, 'yyyy년 MM월 dd일')}
        </div>
      )}
    </article>
  );
}

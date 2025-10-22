'use client';

import { StarRating } from '@/components/common/StarRating';
import { getCategoryIcon, getCategoryColor } from '@/lib/utils/category';
import type { Place } from '@/types/place';

interface PlaceInfoProps {
  place: Place;
}

export function PlaceInfo({ place }: PlaceInfoProps) {
  const categoryIcon = getCategoryIcon(place.category);
  const categoryColor = getCategoryColor(place.category);

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-sm text-gray-500 min-w-12">주소</span>
        <span className="text-sm text-gray-900 flex-1">
          {place.roadAddress || place.address}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
          }}
        >
          <span>{categoryIcon}</span>
          <span>{place.category}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <StarRating rating={place.averageRating} readonly size="md" />
        <span className="text-lg font-semibold text-gray-900">
          {place.averageRating.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">
          리뷰 {place.reviewCount}개
        </span>
      </div>
    </div>
  );
}

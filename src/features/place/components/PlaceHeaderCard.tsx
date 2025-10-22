'use client';

import { getCategoryIcon } from '@/lib/utils/category';
import type { Place } from '@/types/place';
import { cn } from '@/lib/utils';

interface PlaceHeaderCardProps {
  place: Place;
  className?: string;
}

export function PlaceHeaderCard({ place, className }: PlaceHeaderCardProps) {
  const categoryIcon = getCategoryIcon(place.category);

  return (
    <div
      className={cn(
        'bg-white border rounded-lg p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0" aria-hidden="true">
          {categoryIcon}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {place.name}
          </h2>
          <p className="text-sm text-gray-600 truncate">{place.address}</p>
          <p className="text-xs text-gray-500 mt-1">{place.category}</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { Place } from '@/types/place';
import { getCategoryIcon } from '@/lib/utils/category';

interface PlaceHeaderProps {
  place: Place;
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10 -mx-4 px-4 py-4">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">뒤로가기</span>
      </button>

      {/* 장소 정보 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl" aria-hidden="true">
            {getCategoryIcon(place.category)}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
        </div>
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm">
            {place.roadAddress || place.address}
          </p>
        </div>
        <div className="mt-2">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {place.category}
          </span>
        </div>
      </div>
    </div>
  );
}

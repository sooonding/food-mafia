'use client';

import { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import type { PlaceMarker } from '@/types/place';
import { getCategoryIcon, getCategoryColor } from '@/lib/utils/category';

interface MapMarkerProps {
  map: naver.maps.Map;
  place: PlaceMarker;
}

export const MapMarker = memo(function MapMarker({
  map,
  place,
}: MapMarkerProps) {
  const router = useRouter();
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);

  useEffect(() => {
    const icon = getCategoryIcon(place.category);
    const color = getCategoryColor(place.category);

    // 마커 생성
    const newMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(place.latitude, place.longitude),
      map,
      icon: {
        content: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110" style="background-color: ${color}">
            <span class="text-xl">${icon}</span>
          </div>
        `,
        size: new naver.maps.Size(32, 32),
        anchor: new naver.maps.Point(16, 32),
      },
      title: place.name,
      zIndex: Math.round(place.averageRating * 10), // 평점 높은 순으로 위에 표시
    });

    // 클릭 이벤트
    naver.maps.Event.addListener(newMarker, 'click', () => {
      router.push(`/place/${place.id}`);
    });

    setMarker(newMarker);

    // 클린업
    return () => {
      newMarker.setMap(null);
    };
  }, [map, place, router]);

  return null;
});

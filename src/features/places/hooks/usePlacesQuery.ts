'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import type { MapBounds, PlaceMarker, FoodCategory } from '@/types/place';

interface PlacesQueryParams {
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
  category?: string;
}

async function fetchPlacesByBounds(
  bounds: MapBounds,
  categories: FoodCategory[]
): Promise<{ places: PlaceMarker[] }> {
  const params: PlacesQueryParams = {
    lat1: bounds.sw.lat,
    lng1: bounds.sw.lng,
    lat2: bounds.ne.lat,
    lng2: bounds.ne.lng,
  };

  if (categories.length > 0) {
    params.category = categories.join(',');
  }

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  const response = await fetch(`/api/places?${queryString}`);

  if (!response.ok) {
    throw new Error('장소 목록을 불러올 수 없습니다');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '장소 목록을 불러올 수 없습니다');
  }

  return result.data;
}

export function usePlacesQuery(
  bounds: MapBounds | null,
  categories: FoodCategory[]
) {
  return useQuery({
    queryKey: queryKeys.places.list(
      bounds
        ? `${bounds.sw.lat},${bounds.sw.lng},${bounds.ne.lat},${bounds.ne.lng},${categories.join(',')}`
        : ''
    ),
    queryFn: async () => {
      if (!bounds) return { places: [] };
      return fetchPlacesByBounds(bounds, categories);
    },
    enabled: !!bounds,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

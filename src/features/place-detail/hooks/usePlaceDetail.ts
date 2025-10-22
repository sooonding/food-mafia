'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/react-query';
import type { Place } from '@/types/place';

export function usePlaceDetail(placeId: string) {
  return useQuery({
    queryKey: queryKeys.places.detail(placeId),
    queryFn: async () => {
      const response = await apiGet<Place>(`/places/${placeId}`);

      if (!response.success) {
        const errorMessage =
          'error' in response ? response.error.message : 'Failed to fetch place';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!placeId,
  });
}

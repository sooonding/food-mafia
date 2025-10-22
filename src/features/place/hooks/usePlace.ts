import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { apiGet } from '@/lib/remote/api-client';
import type { Place } from '@/types/place';

export function usePlace(placeId: string) {
  return useQuery({
    queryKey: queryKeys.places.detail(placeId),
    queryFn: async () => {
      const response = await apiGet<Place>(`/places/${placeId}`);

      if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch place');
      }

      return response.data;
    },
    enabled: !!placeId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

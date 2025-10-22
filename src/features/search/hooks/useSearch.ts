'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/remote/api-client';
import type { SearchResponse } from '../backend/schema';
import { queryKeys } from '@/lib/react-query';
import type { ApiErrorResponse } from '@/types/api';

interface UseSearchParams {
  query: string;
  enabled?: boolean;
}

export function useSearch({ query, enabled = true }: UseSearchParams) {
  return useQuery({
    queryKey: queryKeys.search.list(query),
    queryFn: async () => {
      const response = await apiGet<SearchResponse>('/search', {
        params: {
          query,
          display: 20,
        },
      });

      if (!response.success) {
        const errorResponse = response as ApiErrorResponse;
        throw new Error(errorResponse.error.message || '검색에 실패했습니다');
      }

      return response.data;
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

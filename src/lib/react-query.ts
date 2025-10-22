import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  places: {
    all: ['places'] as const,
    lists: () => [...queryKeys.places.all, 'list'] as const,
    list: (bounds: string) => [...queryKeys.places.lists(), bounds] as const,
    details: () => [...queryKeys.places.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.places.details(), id] as const,
  },

  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (placeId: string, params: string) =>
      [...queryKeys.reviews.lists(), placeId, params] as const,
  },

  search: {
    all: ['search'] as const,
    lists: () => [...queryKeys.search.all, 'list'] as const,
    list: (query: string) => [...queryKeys.search.lists(), query] as const,
  },
} as const;

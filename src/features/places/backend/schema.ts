import { z } from 'zod';
import { FOOD_CATEGORIES } from '@/types/place';

/**
 * 장소 목록 조회 쿼리 파라미터 스키마
 */
export const placesQuerySchema = z.object({
  lat1: z.string().transform(Number), // 남서쪽 위도
  lng1: z.string().transform(Number), // 남서쪽 경도
  lat2: z.string().transform(Number), // 북동쪽 위도
  lng2: z.string().transform(Number), // 북동쪽 경도
  category: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .filter((c) =>
          Object.values(FOOD_CATEGORIES).includes(
            c as (typeof FOOD_CATEGORIES)[keyof typeof FOOD_CATEGORIES]
          )
        );
    }),
});

export type PlacesQueryParams = z.infer<typeof placesQuerySchema>;

/**
 * 장소 마커 응답 스키마
 */
export const placeMarkerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string(),
  averageRating: z.number(),
  reviewCount: z.number(),
});

export const placesResponseSchema = z.object({
  places: z.array(placeMarkerSchema),
});

export type PlacesResponse = z.infer<typeof placesResponseSchema>;

/**
 * 장소 생성/조회 요청 스키마
 */
export const createPlaceSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  roadAddress: z.string().optional().nullable(),
  category: z.string(),
  telephone: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  naverPlaceId: z.string().optional().nullable(),
  naverLink: z.string().optional().nullable(),
});

export type CreatePlaceRequest = z.infer<typeof createPlaceSchema>;

/**
 * 장소 생성 응답 스키마
 */
export const createPlaceResponseSchema = z.object({
  placeId: z.string().uuid(),
  isNew: z.boolean(), // 새로 생성되었는지 여부
});

export type CreatePlaceResponse = z.infer<typeof createPlaceResponseSchema>;

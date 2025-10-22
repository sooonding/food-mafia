import { z } from 'zod';

// 네이버 로컬 검색 API 쿼리 스키마
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  display: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// 네이버 API 응답 아이템
export const NaverSearchItemSchema = z.object({
  title: z.string(),
  link: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  telephone: z.string().optional(),
  address: z.string(),
  roadAddress: z.string().optional(),
  mapx: z.string(), // 경도 (Naver API는 문자열로 반환)
  mapy: z.string(), // 위도 (Naver API는 문자열로 반환)
});

export type NaverSearchItem = z.infer<typeof NaverSearchItemSchema>;

// 네이버 API 원본 응답
export const NaverSearchResponseSchema = z.object({
  lastBuildDate: z.string(),
  total: z.number(),
  start: z.number(),
  display: z.number(),
  items: z.array(NaverSearchItemSchema),
});

export type NaverSearchResponse = z.infer<typeof NaverSearchResponseSchema>;

// 클라이언트로 반환할 검색 결과 아이템
export const SearchResultItemSchema = z.object({
  title: z.string(),
  address: z.string(),
  roadAddress: z.string().nullable(),
  category: z.string().nullable(),
  telephone: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  link: z.string().nullable(),
});

export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

// 클라이언트 응답 스키마
export const SearchResponseSchema = z.object({
  items: z.array(SearchResultItemSchema),
  total: z.number(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

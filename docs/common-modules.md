# 공통 모듈 작업 계획

## 문서 정보

- **버전**: 1.0.0
- **최종 수정일**: 2025-10-22
- **작성자**: Development Team
- **문서 상태**: Draft

---

## 1. 개요

### 1.1 목적

이 문서는 맛집 지도 서비스의 페이지 단위 개발을 시작하기 전에 구현해야 할 공통 모듈 및 라이브러리 세팅을 정의합니다. 모든 공통 모듈은 여러 페이지에서 재사용 가능하며, 페이지 간 코드 충돌을 방지하고 병렬 개발을 가능하게 합니다.

### 1.2 설계 원칙

- **재사용성**: 여러 페이지에서 공통으로 사용 가능
- **타입 안전성**: TypeScript를 활용한 완전한 타입 정의
- **확장성**: 향후 기능 추가를 고려한 유연한 구조
- **성능**: 번들 크기 최적화 및 lazy loading 고려
- **최소주의**: 문서에 명시된 기능만 구현 (오버엔지니어링 금지)

---

## 2. 공통 타입 정의

### 2.1 장소 관련 타입

**파일 경로**: `src/types/place.ts`

**목적**: 장소 정보에 대한 공통 타입 정의

**우선순위**: P0 (Must)

**내용**:
```typescript
// 카테고리 상수
export const FOOD_CATEGORIES = {
  KOREAN: '한식',
  JAPANESE: '일식',
  WESTERN: '양식',
  CHINESE: '중식',
  CAFE: '카페',
  DESSERT: '디저트',
  FAST_FOOD: '패스트푸드',
  BAR: '주점',
  BUFFET: '뷔페',
  OTHER: '기타',
} as const;

export type FoodCategory = typeof FOOD_CATEGORIES[keyof typeof FOOD_CATEGORIES];

// 장소 기본 정보
export interface Place {
  id: string;
  name: string;
  address: string;
  roadAddress: string | null;
  category: FoodCategory;
  telephone: string | null;
  latitude: number;
  longitude: number;
  naverPlaceId: string | null;
  naverLink: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// 지도 마커용 간소화된 장소 정보
export interface PlaceMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: FoodCategory;
  averageRating: number;
  reviewCount: number;
}

// 지도 영역 (bounds)
export interface MapBounds {
  sw: { lat: number; lng: number }; // 남서쪽
  ne: { lat: number; lng: number }; // 북동쪽
}

// 네이버 검색 결과
export interface NaverSearchResult {
  title: string;
  address: string;
  category: string;
  telephone: string;
  latitude: number;
  longitude: number;
  naverPlaceId: string;
}
```

**사용처**:
- 지도 페이지 (마커 표시)
- 장소 상세 페이지
- 검색 기능
- 즐겨찾기 기능

---

### 2.2 리뷰 관련 타입

**파일 경로**: `src/types/review.ts`

**목적**: 리뷰 정보에 대한 공통 타입 정의

**우선순위**: P0 (Must)

**내용**:
```typescript
export interface Review {
  id: string;
  placeId: string;
  authorName: string;
  rating: number; // 1-5
  content: string;
  visitedAt: string | null; // ISO 8601 date
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}

// 리뷰 작성 폼 데이터
export interface ReviewFormData {
  authorName: string;
  rating: number;
  content: string;
  visitedAt?: string; // ISO 8601 date (optional)
  password: string;
}

// 리뷰 수정 폼 데이터
export interface ReviewUpdateFormData {
  rating: number;
  content: string;
  visitedAt?: string | null;
  password: string;
}

// 리뷰 삭제 요청
export interface ReviewDeleteRequest {
  password: string;
}

// 리뷰 목록 응답 (페이지네이션)
export interface ReviewListResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}
```

**사용처**:
- 리뷰 작성 페이지
- 리뷰 수정 페이지
- 장소 상세 페이지 (리뷰 목록)

---

### 2.3 즐겨찾기 관련 타입

**파일 경로**: `src/types/favorite.ts`

**목적**: 즐겨찾기 정보에 대한 공통 타입 정의

**우선순위**: P1 (Should)

**내용**:
```typescript
// 로컬 스토리지에 저장되는 즐겨찾기 데이터
export interface Favorite {
  placeId: string;
  placeName: string;
  category: string;
  averageRating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  addedAt: string; // ISO 8601
}

// 즐겨찾기 목록
export interface FavoriteList {
  favorites: Favorite[];
}
```

**사용처**:
- 즐겨찾기 목록 페이지
- 장소 상세 페이지 (즐겨찾기 버튼)

---

### 2.4 공통 API 응답 타입

**파일 경로**: `src/types/api.ts`

**목적**: API 응답 형식의 공통 타입 정의

**우선순위**: P0 (Must)

**내용**:
```typescript
// 성공 응답
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// 에러 응답
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// 통합 응답 타입
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// API 에러 코드
export const API_ERROR_CODES = {
  // 공통 에러
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // 검색 관련
  SEARCH_FAILED: 'SEARCH_001',
  SEARCH_QUOTA_EXCEEDED: 'SEARCH_002',
  SEARCH_EMPTY_QUERY: 'SEARCH_003',

  // 지도 관련
  MAP_LOAD_FAILED: 'MAP_001',
  MAP_DATA_FAILED: 'MAP_002',

  // 위치 관련
  LOCATION_PERMISSION_DENIED: 'LOCATION_001',
  LOCATION_UNAVAILABLE: 'LOCATION_002',
  LOCATION_TIMEOUT: 'LOCATION_003',

  // 리뷰 관련
  REVIEW_UNAUTHORIZED: 'REVIEW_001',
  REVIEW_NOT_FOUND: 'REVIEW_002',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
```

**사용처**:
- 모든 API 호출
- 에러 처리 공통 로직

---

## 3. 공통 상수

### 3.1 지도 설정 상수

**파일 경로**: `src/constants/map.ts`

**목적**: 네이버 지도 관련 공통 설정값

**우선순위**: P0 (Must)

**내용**:
```typescript
// 지도 초기 설정
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 37.5665, lng: 126.9780 }, // 서울시청
  DEFAULT_ZOOM: 15,
  MIN_ZOOM: 10,
  MAX_ZOOM: 19,
  CLUSTER_MIN_ZOOM: 13, // 이 줌 레벨 미만에서 클러스터링 활성화
  MAX_MARKERS: 100, // 최대 마커 표시 개수
} as const;

// 위치 정보 설정
export const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000, // 10초
  maximumAge: 60000, // 1분
} as const;

// 카테고리별 마커 아이콘
export const CATEGORY_ICONS = {
  한식: '🍚',
  일식: '🍣',
  양식: '🥩',
  중식: '🥟',
  카페: '☕',
  디저트: '🍰',
  패스트푸드: '🍔',
  주점: '🍺',
  뷔페: '🍱',
  기타: '🍽️',
} as const;

// 카테고리별 색상
export const CATEGORY_COLORS = {
  한식: '#FF6B6B',
  일식: '#4ECDC4',
  양식: '#95E1D3',
  중식: '#F38181',
  카페: '#AA96DA',
  디저트: '#FCBAD3',
  패스트푸드: '#FFFFB5',
  주점: '#FFA07A',
  뷔페: '#98D8C8',
  기타: '#B0BEC5',
} as const;
```

**사용처**:
- 지도 컴포넌트
- 마커 컴포넌트
- 현재 위치 기능

---

### 3.2 검색 설정 상수

**파일 경로**: `src/constants/search.ts`

**목적**: 검색 기능 관련 공통 설정값

**우선순위**: P0 (Must)

**내용**:
```typescript
// 검색 설정
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  MAX_RESULTS: 20,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
} as const;

// 최근 검색어 설정
export const SEARCH_HISTORY_CONFIG = {
  MAX_ITEMS: 10,
  STORAGE_KEY: 'mafia-search-history',
} as const;
```

**사용처**:
- 검색 컴포넌트
- 최근 검색어 기능

---

### 3.3 리뷰 설정 상수

**파일 경로**: `src/constants/review.ts`

**목적**: 리뷰 기능 관련 공통 설정값

**우선순위**: P0 (Must)

**내용**:
```typescript
// 리뷰 유효성 검증 규칙
export const REVIEW_VALIDATION = {
  AUTHOR_NAME: {
    MIN: 2,
    MAX: 10,
  },
  RATING: {
    MIN: 1,
    MAX: 5,
  },
  CONTENT: {
    MIN: 10,
    MAX: 500,
  },
  PASSWORD: {
    MIN: 4,
    MAX: 20,
  },
} as const;

// 리뷰 목록 페이지네이션
export const REVIEW_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

// 리뷰 정렬 옵션
export const REVIEW_SORT_OPTIONS = {
  LATEST: 'latest',
  RATING: 'rating',
} as const;

export type ReviewSortOption = typeof REVIEW_SORT_OPTIONS[keyof typeof REVIEW_SORT_OPTIONS];
```

**사용처**:
- 리뷰 작성/수정 폼
- 리뷰 목록 컴포넌트

---

### 3.4 즐겨찾기 설정 상수

**파일 경로**: `src/constants/favorite.ts`

**목적**: 즐겨찾기 기능 관련 공통 설정값

**우선순위**: P1 (Should)

**내용**:
```typescript
// 즐겨찾기 로컬 스토리지 설정
export const FAVORITE_CONFIG = {
  STORAGE_KEY: 'mafia-favorites',
  MAX_ITEMS: 100, // 최대 100개까지 저장
} as const;
```

**사용처**:
- 즐겨찾기 훅
- 즐겨찾기 목록 페이지

---

## 4. 공통 유틸리티 함수

### 4.1 날짜 포맷 유틸리티

**파일 경로**: `src/lib/utils/date.ts`

**목적**: 날짜/시간 포맷팅 공통 함수

**우선순위**: P0 (Must)

**의존성**: `date-fns`

**내용**:
```typescript
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 상대 시간 표시 (예: "2일 전", "3주 전")
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), {
    addSuffix: true,
    locale: ko,
  });
}

/**
 * 날짜 포맷팅 (예: "2025년 10월 21일")
 */
export function formatDate(dateString: string, formatStr = 'yyyy년 MM월 dd일'): string {
  return format(parseISO(dateString), formatStr, { locale: ko });
}

/**
 * 날짜+시간 포맷팅 (예: "2025-10-21 14:30")
 */
export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
}

/**
 * ISO 8601 형식으로 변환
 */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
```

**사용처**:
- 리뷰 작성 날짜 표시
- 방문 날짜 입력
- 모든 날짜 표시

---

### 4.2 로컬 스토리지 유틸리티

**파일 경로**: `src/lib/utils/storage.ts`

**목적**: 로컬 스토리지 공통 함수 (타입 안전)

**우선순위**: P0 (Must)

**내용**:
```typescript
/**
 * 로컬 스토리지에서 JSON 데이터 가져오기
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * 로컬 스토리지에 JSON 데이터 저장
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

/**
 * 로컬 스토리지에서 항목 제거
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
```

**사용처**:
- 즐겨찾기 기능
- 최근 검색어 기능
- 필터 상태 저장 (세션 스토리지)

---

### 4.3 카테고리 유틸리티

**파일 경로**: `src/lib/utils/category.ts`

**목적**: 카테고리 관련 공통 함수

**우선순위**: P0 (Must)

**내용**:
```typescript
import { FOOD_CATEGORIES, type FoodCategory } from '@/types/place';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/constants/map';

/**
 * 네이버 API 카테고리를 내부 카테고리로 변환
 */
export function mapNaverCategory(naverCategory: string): FoodCategory {
  const categoryMap: Record<string, FoodCategory> = {
    한식: FOOD_CATEGORIES.KOREAN,
    한정식: FOOD_CATEGORIES.KOREAN,
    백반: FOOD_CATEGORIES.KOREAN,
    찌개: FOOD_CATEGORIES.KOREAN,
    일식: FOOD_CATEGORIES.JAPANESE,
    초밥: FOOD_CATEGORIES.JAPANESE,
    돈까스: FOOD_CATEGORIES.JAPANESE,
    라멘: FOOD_CATEGORIES.JAPANESE,
    양식: FOOD_CATEGORIES.WESTERN,
    스테이크: FOOD_CATEGORIES.WESTERN,
    파스타: FOOD_CATEGORIES.WESTERN,
    중식: FOOD_CATEGORIES.CHINESE,
    중화요리: FOOD_CATEGORIES.CHINESE,
    카페: FOOD_CATEGORIES.CAFE,
    디저트: FOOD_CATEGORIES.DESSERT,
    베이커리: FOOD_CATEGORIES.DESSERT,
    패스트푸드: FOOD_CATEGORIES.FAST_FOOD,
    주점: FOOD_CATEGORIES.BAR,
    뷔페: FOOD_CATEGORIES.BUFFET,
  };

  // 가장 가까운 카테고리 매칭
  for (const [key, value] of Object.entries(categoryMap)) {
    if (naverCategory.includes(key)) {
      return value;
    }
  }

  return FOOD_CATEGORIES.OTHER;
}

/**
 * 카테고리 아이콘 가져오기
 */
export function getCategoryIcon(category: FoodCategory): string {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.기타;
}

/**
 * 카테고리 색상 가져오기
 */
export function getCategoryColor(category: FoodCategory): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.기타;
}

/**
 * 모든 카테고리 목록 가져오기
 */
export function getAllCategories(): FoodCategory[] {
  return Object.values(FOOD_CATEGORIES);
}
```

**사용처**:
- 카테고리 필터 컴포넌트
- 마커 아이콘 선택
- 검색 결과 카테고리 변환

---

### 4.4 URL 유틸리티

**파일 경로**: `src/lib/utils/url.ts`

**목적**: URL 관련 공통 함수

**우선순위**: P1 (Should)

**내용**:
```typescript
/**
 * 쿼리 파라미터를 객체로 변환
 */
export function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * 객체를 쿼리 파라미터로 변환
 */
export function stringifyQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * 절대 URL 생성
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
```

**사용처**:
- 공유 기능
- 네비게이션

---

## 5. 공통 훅 (Hooks)

### 5.1 즐겨찾기 훅

**파일 경로**: `src/hooks/useFavorites.ts`

**목적**: 즐겨찾기 기능 공통 훅

**우선순위**: P1 (Should)

**내용**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Favorite, FavoriteList } from '@/types/favorite';
import { FAVORITE_CONFIG } from '@/constants/favorite';
import { getLocalStorage, setLocalStorage } from '@/lib/utils/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // 로컬 스토리지에서 즐겨찾기 로드
  useEffect(() => {
    const stored = getLocalStorage<FavoriteList>(
      FAVORITE_CONFIG.STORAGE_KEY,
      { favorites: [] }
    );
    setFavorites(stored.favorites);
  }, []);

  // 즐겨찾기 추가
  const addFavorite = useCallback((favorite: Favorite) => {
    setFavorites((prev) => {
      // 이미 존재하면 추가하지 않음
      if (prev.some((f) => f.placeId === favorite.placeId)) {
        return prev;
      }

      // 최대 개수 초과 시 가장 오래된 항목 제거
      const newFavorites = [...prev, favorite];
      if (newFavorites.length > FAVORITE_CONFIG.MAX_ITEMS) {
        newFavorites.shift();
      }

      // 로컬 스토리지에 저장
      setLocalStorage(FAVORITE_CONFIG.STORAGE_KEY, { favorites: newFavorites });
      return newFavorites;
    });
  }, []);

  // 즐겨찾기 제거
  const removeFavorite = useCallback((placeId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.filter((f) => f.placeId !== placeId);
      setLocalStorage(FAVORITE_CONFIG.STORAGE_KEY, { favorites: newFavorites });
      return newFavorites;
    });
  }, []);

  // 즐겨찾기 여부 확인
  const isFavorite = useCallback(
    (placeId: string) => {
      return favorites.some((f) => f.placeId === placeId);
    },
    [favorites]
  );

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(
    (favorite: Favorite) => {
      if (isFavorite(favorite.placeId)) {
        removeFavorite(favorite.placeId);
      } else {
        addFavorite(favorite);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
```

**사용처**:
- 장소 상세 페이지 (즐겨찾기 버튼)
- 즐겨찾기 목록 페이지

---

### 5.2 지도 상태 훅 (Zustand)

**파일 경로**: `src/hooks/useMapStore.ts`

**목적**: 지도 상태 관리 (중심점, 줌, 필터)

**우선순위**: P0 (Must)

**의존성**: `zustand`

**내용**:
```typescript
import { create } from 'zustand';
import type { FoodCategory } from '@/types/place';
import { MAP_CONFIG } from '@/constants/map';

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedCategories: FoodCategory[];
  currentLocation: { lat: number; lng: number } | null;

  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  toggleCategory: (category: FoodCategory) => void;
  clearCategories: () => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: MAP_CONFIG.DEFAULT_CENTER,
  zoom: MAP_CONFIG.DEFAULT_ZOOM,
  selectedCategories: [],
  currentLocation: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  toggleCategory: (category) =>
    set((state) => {
      const isSelected = state.selectedCategories.includes(category);
      return {
        selectedCategories: isSelected
          ? state.selectedCategories.filter((c) => c !== category)
          : [...state.selectedCategories, category],
      };
    }),

  clearCategories: () => set({ selectedCategories: [] }),

  setCurrentLocation: (location) => set({ currentLocation: location }),
}));
```

**사용처**:
- 지도 컴포넌트
- 카테고리 필터 컴포넌트
- 현재 위치 버튼

---

### 5.3 디바운스 훅

**파일 경로**: `src/hooks/useDebounce.ts`

**목적**: 디바운싱 공통 훅

**우선순위**: P0 (Must)

**내용**:
```typescript
import { useEffect, useState } from 'react';

/**
 * 값에 디바운싱 적용
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**사용처**:
- 검색 입력 필드
- 지도 이동 이벤트

---

## 6. 공통 Zod 스키마

### 6.1 리뷰 스키마

**파일 경로**: `src/schemas/review.ts`

**목적**: 리뷰 유효성 검증 스키마

**우선순위**: P0 (Must)

**의존성**: `zod`

**내용**:
```typescript
import { z } from 'zod';
import { REVIEW_VALIDATION } from '@/constants/review';

// 리뷰 작성 스키마
export const reviewCreateSchema = z.object({
  authorName: z
    .string()
    .min(REVIEW_VALIDATION.AUTHOR_NAME.MIN, '작성자명은 최소 2자 이상이어야 합니다')
    .max(REVIEW_VALIDATION.AUTHOR_NAME.MAX, '작성자명은 최대 10자 이하여야 합니다'),

  rating: z
    .number()
    .int('평점은 정수여야 합니다')
    .min(REVIEW_VALIDATION.RATING.MIN, '평점은 최소 1점 이상이어야 합니다')
    .max(REVIEW_VALIDATION.RATING.MAX, '평점은 최대 5점 이하여야 합니다'),

  content: z
    .string()
    .min(REVIEW_VALIDATION.CONTENT.MIN, '리뷰 내용은 최소 10자 이상이어야 합니다')
    .max(REVIEW_VALIDATION.CONTENT.MAX, '리뷰 내용은 최대 500자 이하여야 합니다'),

  visitedAt: z.string().optional(),

  password: z
    .string()
    .min(REVIEW_VALIDATION.PASSWORD.MIN, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(REVIEW_VALIDATION.PASSWORD.MAX, '비밀번호는 최대 20자 이하여야 합니다'),
});

// 리뷰 수정 스키마
export const reviewUpdateSchema = z.object({
  rating: z
    .number()
    .int()
    .min(REVIEW_VALIDATION.RATING.MIN)
    .max(REVIEW_VALIDATION.RATING.MAX),

  content: z
    .string()
    .min(REVIEW_VALIDATION.CONTENT.MIN)
    .max(REVIEW_VALIDATION.CONTENT.MAX),

  visitedAt: z.string().optional().nullable(),

  password: z
    .string()
    .min(REVIEW_VALIDATION.PASSWORD.MIN)
    .max(REVIEW_VALIDATION.PASSWORD.MAX),
});

// 리뷰 삭제 스키마
export const reviewDeleteSchema = z.object({
  password: z.string().min(REVIEW_VALIDATION.PASSWORD.MIN),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type ReviewDeleteInput = z.infer<typeof reviewDeleteSchema>;
```

**사용처**:
- 리뷰 작성/수정 폼 (클라이언트)
- 리뷰 API 라우트 (서버)

---

## 7. 공통 UI 컴포넌트

### 7.1 별점 컴포넌트

**파일 경로**: `src/components/common/StarRating.tsx`

**목적**: 별점 표시 및 선택 컴포넌트

**우선순위**: P0 (Must)

**내용**:
```typescript
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  className,
}: StarRatingProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div className={cn('flex gap-1', className)} role="group" aria-label="별점">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;

        return (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange?.(star)}
            disabled={readonly}
            className={cn(
              sizeClass,
              'transition-colors',
              !readonly && 'cursor-pointer hover:scale-110',
              readonly && 'cursor-default'
            )}
            aria-label={`${star}점`}
          >
            <Star
              className={cn(
                'w-full h-full',
                isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
```

**사용처**:
- 리뷰 작성/수정 폼 (선택 모드)
- 리뷰 목록 (읽기 전용 모드)
- 장소 상세 페이지 (평균 평점 표시)

---

### 7.2 로딩 스켈레톤

**파일 경로**: `src/components/common/Skeleton.tsx`

**목적**: 로딩 상태 표시용 스켈레톤 UI

**우선순위**: P0 (Must)

**내용**:
```typescript
'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      role="status"
      aria-label="로딩 중"
    />
  );
}

// 리뷰 카드 스켈레톤
export function ReviewCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// 장소 카드 스켈레톤
export function PlaceCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
```

**사용처**:
- 모든 로딩 상태 표시

---

### 7.3 빈 상태 컴포넌트

**파일 경로**: `src/components/common/EmptyState.tsx`

**목적**: 데이터가 없을 때 표시하는 안내 UI

**우선순위**: P0 (Must)

**내용**:
```typescript
'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {Icon && (
        <Icon className="w-12 h-12 text-gray-400 mb-4" aria-hidden="true" />
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}
```

**사용처**:
- 리뷰 없음
- 검색 결과 없음
- 즐겨찾기 없음

---

## 8. API 클라이언트

### 8.1 공통 API 클라이언트

**파일 경로**: `src/lib/api-client.ts`

**목적**: 공통 HTTP 클라이언트 (axios 래퍼)

**우선순위**: P0 (Must)

**의존성**: `axios`

**내용**:
```typescript
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 네트워크 에러
    if (!error.response) {
      return Promise.reject({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '네트워크 연결을 확인해주세요',
        },
      });
    }

    // 서버 에러
    if (error.response.status >= 500) {
      return Promise.reject({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
        },
      });
    }

    // 기타 에러 (클라이언트 에러 등)
    return Promise.reject(error.response.data);
  }
);

// 공통 API 호출 함수
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data;
}

// GET 요청
export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'GET', url });
}

// POST 요청
export async function apiPost<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'POST', url, data });
}

// PATCH 요청
export async function apiPatch<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data });
}

// DELETE 요청
export async function apiDelete<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'DELETE', url, data });
}

export default apiClient;
```

**사용처**:
- 모든 API 호출

---

## 9. React Query 설정

### 9.1 Query Client 설정

**파일 경로**: `src/lib/react-query.ts`

**목적**: React Query 글로벌 설정

**우선순위**: P0 (Must)

**의존성**: `@tanstack/react-query`

**내용**:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query Keys Factory
export const queryKeys = {
  // 장소
  places: {
    all: ['places'] as const,
    lists: () => [...queryKeys.places.all, 'list'] as const,
    list: (bounds: string) => [...queryKeys.places.lists(), bounds] as const,
    details: () => [...queryKeys.places.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.places.details(), id] as const,
  },

  // 리뷰
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (placeId: string, params: string) =>
      [...queryKeys.reviews.lists(), placeId, params] as const,
  },

  // 검색
  search: {
    all: ['search'] as const,
    results: (query: string) => [...queryKeys.search.all, query] as const,
  },
} as const;
```

**사용처**:
- 프로바이더 설정
- 모든 React Query 훅

---

## 10. 에러 핸들링

### 10.1 에러 바운더리

**파일 경로**: `src/components/common/ErrorBoundary.tsx`

**목적**: 클라이언트 측 에러 처리

**우선순위**: P1 (Should)

**내용**:
```typescript
'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            예기치 않은 오류가 발생했습니다. 페이지를 새로고침해주세요.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            새로고침
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**사용처**:
- 앱 전체 래핑

---

## 11. 작업 순서 및 우선순위

### Phase 1: 기초 설정 (P0)

1. **공통 타입 정의** (2시간)
   - `src/types/place.ts`
   - `src/types/review.ts`
   - `src/types/api.ts`

2. **공통 상수 정의** (1시간)
   - `src/constants/map.ts`
   - `src/constants/search.ts`
   - `src/constants/review.ts`

3. **공통 유틸리티** (2시간)
   - `src/lib/utils/date.ts`
   - `src/lib/utils/storage.ts`
   - `src/lib/utils/category.ts`

4. **API 클라이언트** (1시간)
   - `src/lib/api-client.ts`

5. **React Query 설정** (1시간)
   - `src/lib/react-query.ts`

### Phase 2: 공통 훅 및 스키마 (P0)

6. **Zod 스키마** (1시간)
   - `src/schemas/review.ts`

7. **공통 훅** (2시간)
   - `src/hooks/useMapStore.ts`
   - `src/hooks/useDebounce.ts`

### Phase 3: 공통 UI 컴포넌트 (P0)

8. **기본 컴포넌트** (3시간)
   - `src/components/common/StarRating.tsx`
   - `src/components/common/Skeleton.tsx`
   - `src/components/common/EmptyState.tsx`

### Phase 4: 즐겨찾기 관련 (P1)

9. **즐겨찾기 기능** (2시간)
   - `src/types/favorite.ts`
   - `src/constants/favorite.ts`
   - `src/hooks/useFavorites.ts`

### Phase 5: 부가 기능 (P1-P2)

10. **URL 유틸리티** (30분)
    - `src/lib/utils/url.ts`

11. **에러 바운더리** (1시간)
    - `src/components/common/ErrorBoundary.tsx`

---

## 12. 검증 체크리스트

각 모듈 구현 후 다음 항목을 확인하세요:

- [ ] 타입 정의가 완전하고 명확한가?
- [ ] 모든 함수에 JSDoc 주석이 있는가?
- [ ] 에러 처리가 적절히 구현되었는가?
- [ ] 재사용 가능한 구조인가?
- [ ] 다른 모듈과 의존성 충돌이 없는가?
- [ ] 테스트 가능한 구조인가?
- [ ] 문서에 명시된 기능만 구현되었는가? (오버엔지니어링 방지)

---

## 13. 주의사항

### 페이지 간 충돌 방지

- 모든 공통 모듈은 명확한 책임과 범위를 가져야 합니다
- 페이지 특화 로직은 공통 모듈에 포함하지 않습니다
- 공통 모듈 수정 시 영향 범위를 반드시 확인합니다

### 타입 안전성

- 모든 공통 함수는 완전한 타입 정의가 필요합니다
- `any` 타입 사용을 최소화합니다
- 제네릭을 활용하여 타입 추론을 지원합니다

### 성능 고려

- 공통 유틸리티는 트리 쉐이킹이 가능하도록 작성합니다
- 무거운 라이브러리는 동적 임포트를 고려합니다
- 메모이제이션이 필요한 경우 `useMemo`, `useCallback` 사용을 권장합니다

---

## 14. 참고 문서

- [PRD](/docs/prd.md)
- [사용자 플로우](/docs/userflow.md)
- [데이터베이스 설계](/docs/database.md)
- [유스케이스 - 검색 및 탐색](/docs/usecases/search-and-exploration.md)
- [유스케이스 - 리뷰 관리](/docs/usecases/review-management.md)
- [유스케이스 - 지도 기능](/docs/usecases/map-features.md)

---

**문서 끝**

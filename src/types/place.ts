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

export interface PlaceMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: FoodCategory;
  averageRating: number;
  reviewCount: number;
}

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

export interface NaverSearchResult {
  title: string;
  address: string;
  category: string;
  telephone: string;
  latitude: number;
  longitude: number;
  naverPlaceId: string;
}

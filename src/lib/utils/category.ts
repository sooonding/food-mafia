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

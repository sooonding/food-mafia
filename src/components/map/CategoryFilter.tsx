'use client';

import { Button } from '@/components/ui/button';
import { useMapStore } from '@/hooks/useMapStore';
import { getAllCategories, getCategoryIcon } from '@/lib/utils/category';
import type { FoodCategory } from '@/types/place';

export function CategoryFilter() {
  const { selectedCategories, toggleCategory, clearCategories } = useMapStore();

  const categories = getAllCategories();

  const handleCategoryClick = (category: FoodCategory) => {
    toggleCategory(category);
  };

  const handleAllClick = () => {
    clearCategories();
  };

  const isSelected = (category: FoodCategory) =>
    selectedCategories.includes(category);

  const isAllSelected = selectedCategories.length === 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg">
      <div className="overflow-x-auto">
        <div className="flex gap-2 px-4 py-3 whitespace-nowrap md:justify-center">
          {/* 전체 버튼 */}
          <Button
            variant={isAllSelected ? 'default' : 'outline'}
            size="sm"
            onClick={handleAllClick}
            className="rounded-full px-4"
            aria-label="전체 카테고리"
            aria-pressed={isAllSelected}
          >
            전체
          </Button>

          {/* 카테고리 버튼들 */}
          {categories.map((category) => (
            <Button
              key={category}
              variant={isSelected(category) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryClick(category)}
              className="rounded-full px-4 gap-1"
              aria-label={`${category} 카테고리 필터`}
              aria-pressed={isSelected(category)}
            >
              <span>{getCategoryIcon(category)}</span>
              <span>{category}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

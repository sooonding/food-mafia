'use client';

import { MapPin, Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SearchResultItem as SearchResult } from '@/features/search/backend/schema';
import { getCategoryColor } from '@/lib/utils/category';
import type { FoodCategory } from '@/types/place';

interface SearchResultItemProps {
  item: SearchResult;
  onViewDetail: (item: SearchResult) => void;
}

export function SearchResultItem({ item, onViewDetail }: SearchResultItemProps) {
  const categoryColor = item.category
    ? getCategoryColor(item.category as FoodCategory)
    : 'gray';

  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* 제목과 카테고리 */}
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {item.category && (
              <div>
                <span className="text-sm text-gray-600">{item.category}</span>
              </div>
            )}
          </div>

          {/* 주소 */}
          <div className="flex items-start gap-1 text-sm text-gray-600">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">
              {item.roadAddress || item.address}
            </span>
          </div>
        </div>

        {/* 상세보기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(item)}
          className="flex-shrink-0"
        >
          상세보기
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

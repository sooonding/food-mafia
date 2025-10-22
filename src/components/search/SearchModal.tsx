'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { SearchResultItem } from './SearchResultItem';
import { useSearch } from '@/features/search/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { useMapStore } from '@/hooks/useMapStore';
import type { SearchResultItem as SearchResult } from '@/features/search/backend/schema';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onPlaceSelect: (place: SearchResult) => void;
}

export function SearchModal({ open, onClose, onPlaceSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { setCenter, setZoom } = useMapStore();

  const { data, isLoading, error } = useSearch({
    query: debouncedQuery,
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleViewDetail = (item: SearchResult) => {
    // 1. 지도 중심 이동
    setCenter({
      lat: item.latitude,
      lng: item.longitude,
    });
    setZoom(16);

    // 2. 부모 컴포넌트에 선택된 장소 전달
    onPlaceSelect(item);
  };

  const showResults = debouncedQuery.trim().length > 0;
  const hasResults = data && data.items.length > 0;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="top" className="h-full sm:h-auto sm:max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>장소 검색</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="장소, 음식 종류를 검색하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="검색어 지우기"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* 검색 결과 */}
          {!showResults && (
            <div className="py-8">
              <EmptyState
                icon={Search}
                title="검색어를 입력하세요"
                description="장소명이나 음식 종류로 검색할 수 있습니다"
              />
            </div>
          )}

          {showResults && isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {showResults && error && (
            <div className="py-8">
              <EmptyState
                icon={Search}
                title="검색에 실패했습니다"
                description={error instanceof Error ? error.message : '다시 시도해주세요'}
              />
            </div>
          )}

          {showResults && !isLoading && !error && !hasResults && (
            <div className="py-8">
              <EmptyState
                icon={Search}
                title="검색 결과가 없습니다"
                description="다른 검색어로 시도해보세요"
              />
            </div>
          )}

          {showResults && !isLoading && hasResults && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                총 {data.total.toLocaleString()}개의 결과
              </div>
              {data.items.map((item, index) => (
                <SearchResultItem
                  key={`${item.title}-${item.latitude}-${item.longitude}-${index}`}
                  item={item}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

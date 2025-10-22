'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { NaverMap } from '@/components/map/NaverMap';
import { CategoryFilter } from '@/components/map/CategoryFilter';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { SearchModal } from '@/components/search/SearchModal';
import { PlaceDetailModal } from '@/components/search/PlaceDetailModal';
import type { SearchResultItem } from '@/features/search/backend/schema';

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SearchResultItem | null>(null);

  const handlePlaceSelect = (place: SearchResultItem) => {
    // 1. 검색 모달 닫기
    setIsSearchOpen(false);

    // 2. Sheet 애니메이션(300ms)이 완전히 끝난 후 상세 모달 열기
    setTimeout(() => {
      setSelectedPlace(place);
    }, 350);
  };

  const handleClosePlaceDetail = () => {
    setSelectedPlace(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      <div className="flex-1 relative">
        <NaverMap />
        <CurrentLocationButton />
      </div>

      <CategoryFilter />

      {/* 검색 모달 - SearchModal이 열려있을 때만 렌더링 */}
      {isSearchOpen && (
        <SearchModal
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onPlaceSelect={handlePlaceSelect}
        />
      )}

      {/* 장소 상세 모달 - SearchModal이 완전히 닫힌 후에만 렌더링 */}
      {!isSearchOpen && selectedPlace && (
        <PlaceDetailModal
          open={true}
          onClose={handleClosePlaceDetail}
          place={selectedPlace}
        />
      )}
    </div>
  );
}

'use client';

import { X, MapPin, Phone, Star } from 'lucide-react';
import { CATEGORY_COLORS } from '@/constants/map';
import type { Favorite } from '@/types/favorite';

interface Place {
  id: string;
  name: string;
  address: string;
  roadAddress: string | null;
  category: string;
  latitude: number;
  longitude: number;
  telephone: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FavoriteCardProps {
  favorite: Favorite;
  placeData?: Place;
  onRemove: (placeId: string) => void;
  onCardClick: (placeId: string) => void;
}

export function FavoriteCard({
  favorite,
  placeData,
  onRemove,
  onCardClick,
}: FavoriteCardProps) {
  const displayName = placeData?.name || favorite.placeName;
  const displayAddress = placeData?.address || '';
  const displayCategory = placeData?.category || favorite.category;
  const displayRating = placeData?.averageRating ?? favorite.averageRating;
  const displayReviewCount = placeData?.reviewCount ?? favorite.reviewCount;
  const telephone = placeData?.telephone;

  const categoryColor =
    CATEGORY_COLORS[displayCategory as keyof typeof CATEGORY_COLORS] ||
    CATEGORY_COLORS['기타'];

  const handleCardClick = () => {
    onCardClick(favorite.placeId);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(favorite.placeId);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300" />
          <div className="absolute overflow-hidden w-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer min-h-[120px]"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      <button
        onClick={handleRemoveClick}
        className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`${displayName} 즐겨찾기 제거`}
        tabIndex={0}
      >
        <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
      </button>

      <div className="pr-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {displayName}
        </h3>

        {displayAddress && (
          <div className="flex items-start gap-1 mb-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-2">
              {displayAddress}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="inline-block px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: categoryColor + '20',
              color: categoryColor,
            }}
          >
            {displayCategory}
          </span>

          {telephone && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="w-3 h-3" />
              <span className="text-xs">{telephone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {renderStars(displayRating)}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {displayRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            리뷰 {displayReviewCount}개
          </span>
        </div>
      </div>
    </div>
  );
}

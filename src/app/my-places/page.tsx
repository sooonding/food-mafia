'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { FavoriteCard } from './_components/FavoriteCard';
import { FavoritesMap } from './_components/FavoritesMap';
import { FavoritesSkeleton } from './_components/FavoritesSkeleton';

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

export default function MyPlacesPage() {
  const router = useRouter();
  const { favorites, removeFavorite } = useFavorites();
  const [placesData, setPlacesData] = useState<Map<string, Place>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlacesData = useCallback(async () => {
    if (favorites.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const promises = favorites.map((fav) =>
      fetch(`/api/places/${fav.placeId}`)
        .then((res) => res.json())
        .catch((err) => ({ placeId: fav.placeId, error: err }))
    );

    const results = await Promise.allSettled(promises);

    const newPlacesMap = new Map<string, Place>();
    let failedCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        newPlacesMap.set(favorites[index].placeId, result.value.data);
      } else {
        failedCount++;
      }
    });

    setPlacesData(newPlacesMap);
    setIsLoading(false);

    if (failedCount > 0 && failedCount < favorites.length) {
      setError(
        `일부 장소 정보를 불러올 수 없습니다 (${failedCount}개). 캐시된 정보로 표시됩니다.`
      );
    } else if (failedCount === favorites.length && favorites.length > 0) {
      setError('네트워크 연결을 확인해주세요.');
    }
  }, [favorites]);

  useEffect(() => {
    fetchPlacesData();
  }, [fetchPlacesData]);

  const handleRemoveFavorite = useCallback(
    (placeId: string) => {
      const confirmed = window.confirm(
        '이 장소를 즐겨찾기에서 제거하시겠습니까?'
      );

      if (confirmed) {
        removeFavorite(placeId);
      }
    },
    [removeFavorite]
  );

  const handleCardClick = useCallback(
    (placeId: string) => {
      router.push(`/place/${placeId}`);
    },
    [router]
  );

  const handleMarkerClick = useCallback(
    (placeId: string) => {
      router.push(`/place/${placeId}`);
    },
    [router]
  );

  const handleBackClick = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return <FavoritesSkeleton />;
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={handleBackClick}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-2 text-lg font-semibold">즐겨찾기</h1>
          </div>
        </header>

        <EmptyState
          icon={Heart}
          title="아직 즐겨찾기한 장소가 없습니다"
          description="마음에 드는 맛집을 찾아 즐겨찾기에 추가해보세요!"
          action={
            <Button onClick={() => router.push('/')}>홈으로 이동</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={handleBackClick}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 text-lg font-semibold">즐겨찾기</h1>
        </div>
      </header>

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          저장한 장소 ({favorites.length}개)
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-120px)]">
        <div className="w-full md:w-2/5 h-[300px] md:h-full">
          <FavoritesMap
            favorites={favorites}
            onMarkerClick={handleMarkerClick}
            className="w-full h-full"
          />
        </div>

        <div className="w-full md:w-3/5 md:overflow-y-auto">
          <div
            className="p-4 space-y-4"
            role="list"
            aria-label="즐겨찾기 장소 목록"
          >
            {favorites.map((favorite) => (
              <div role="listitem" key={favorite.placeId}>
                <FavoriteCard
                  favorite={favorite}
                  placeData={placesData.get(favorite.placeId)}
                  onRemove={handleRemoveFavorite}
                  onCardClick={handleCardClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

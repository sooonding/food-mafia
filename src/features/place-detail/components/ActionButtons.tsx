'use client';

import { useRouter } from 'next/navigation';
import { PlusCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import { useToast } from '@/hooks/use-toast';

interface ActionButtonsProps {
  placeId: string;
}

export function ActionButtons({ placeId }: ActionButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: place } = usePlaceDetail(placeId);
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = place ? isFavorite(placeId) : false;

  const handleToggleFavorite = () => {
    if (!place) return;

    const favorite = {
      placeId: place.id,
      placeName: place.name,
      category: place.category,
      averageRating: place.averageRating,
      reviewCount: place.reviewCount,
      latitude: place.latitude,
      longitude: place.longitude,
      addedAt: new Date().toISOString(),
    };

    toggleFavorite(favorite);

    toast({
      title: isFav
        ? '즐겨찾기에서 제거되었습니다'
        : '즐겨찾기에 추가되었습니다',
      duration: 3000,
    });
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => router.push(`/place/${placeId}/review/new`)}
        className="flex-1"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        리뷰 작성
      </Button>
      <Button
        variant={isFav ? 'default' : 'outline'}
        onClick={handleToggleFavorite}
        aria-label={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}

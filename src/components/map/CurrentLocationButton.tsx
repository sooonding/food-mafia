'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/hooks/useMapStore';
import { useToast } from '@/hooks/use-toast';
import { GEOLOCATION_CONFIG } from '@/constants/map';

export function CurrentLocationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { setCenter, setCurrentLocation, setZoom } = useMapStore();
  const { toast } = useToast();

  const handleClick = async () => {
    setIsLoading(true);

    try {
      // 위치 권한 확인
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });

      if (permission.state === 'denied') {
        toast({
          title: '위치 권한이 필요합니다',
          description: '브라우저 설정에서 위치 권한을 허용해주세요.',
          variant: 'destructive',
        });
        return;
      }

      // 현재 위치 획득
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            GEOLOCATION_CONFIG
          );
        }
      );

      const { latitude, longitude } = position.coords;

      // 지도 이동
      setCenter({ lat: latitude, lng: longitude });
      setCurrentLocation({ lat: latitude, lng: longitude });
      setZoom(15);

      toast({
        title: '현재 위치로 이동했습니다',
      });
    } catch (error) {
      console.error('위치 획득 실패:', error);
      toast({
        title: '위치를 가져올 수 없습니다',
        description: '위치 서비스를 확인해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-28 md:h-16 md:w-16"
      size="icon"
      aria-label="현재 위치로 이동"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <MapPin className="h-6 w-6" />
      )}
    </Button>
  );
}

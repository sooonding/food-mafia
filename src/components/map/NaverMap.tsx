'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/hooks/useMapStore';
import { MAP_CONFIG } from '@/constants/map';
import { useToast } from '@/hooks/use-toast';
import { usePlacesQuery } from '@/features/places/hooks/usePlacesQuery';
import { MapMarker } from './MapMarker';
import type { MapBounds } from '@/types/place';

export function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { center, zoom, setCenter, setCurrentLocation } = useMapStore();
  const { toast } = useToast();

  // 네이버 지도 SDK 로딩
  useEffect(() => {
    const loadNaverMapScript = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 로드된 경우
        if (window.naver && window.naver.maps) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error('네이버 지도 SDK 로드 실패'));
        document.head.appendChild(script);
      });
    };

    loadNaverMapScript()
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        toast({
          title: '지도 로드 실패',
          description: '지도를 불러올 수 없습니다. 페이지를 새로고침 해주세요.',
          variant: 'destructive',
        });
      });
  }, [toast]);

  // 위치 권한 요청 및 지도 초기화
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    const initializeMap = async () => {
      let initialCenter = MAP_CONFIG.DEFAULT_CENTER;

      // 위치 권한 요청
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            });
          }
        );

        initialCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(initialCenter);
        setCurrentLocation(initialCenter);
      } catch (error) {
        console.warn('위치 권한 거부:', error);
        toast({
          title: '위치 권한이 필요합니다',
          description: '기본 위치(서울시청)로 지도를 표시합니다.',
        });
      }

      // 지도 생성
      const mapInstance = new naver.maps.Map(mapRef.current!, {
        center: new naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        mapTypeControl: false,
        scaleControl: true,
        logoControl: true,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      });

      setMap(mapInstance);
    };

    initializeMap();
  }, [isLoading, setCenter, setCurrentLocation, toast]);

  // 영역 기반 장소 로딩 및 마커 렌더링
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { selectedCategories } = useMapStore();
  const { data: placesData, isLoading: isLoadingPlaces } = usePlacesQuery(
    bounds,
    selectedCategories
  );

  // 지도 이동 시 영역 계산 (디바운싱 적용)
  useEffect(() => {
    if (!map) return;

    let timeoutId: NodeJS.Timeout;

    const handleIdle = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mapBounds = map.getBounds();
        const sw = mapBounds.getSW();
        const ne = mapBounds.getNE();

        setBounds({
          sw: { lat: sw.lat(), lng: sw.lng() },
          ne: { lat: ne.lat(), lng: ne.lng() },
        });
      }, 300);
    };

    // idle 이벤트 리스너 등록
    naver.maps.Event.addListener(map, 'idle', handleIdle);

    // 초기 영역 계산
    handleIdle();

    return () => {
      clearTimeout(timeoutId);
      naver.maps.Event.clearListeners(map, 'idle');
    };
  }, [map]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-full">
      {/* 로딩 인디케이터 */}
      {isLoadingPlaces && map && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-700">장소 로딩 중...</span>
          </div>
        </div>
      )}

      {/* 마커 렌더링 */}
      {map &&
        placesData?.places.map((place) => (
          <MapMarker key={place.id} map={map} place={place} />
        ))}
    </div>
  );
}

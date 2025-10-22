'use client';

import { useEffect, useRef, useState } from 'react';
import { MAP_CONFIG, CATEGORY_ICONS } from '@/constants/map';
import type { Favorite } from '@/types/favorite';
import { cn } from '@/lib/utils';

interface FavoritesMapProps {
  favorites: Favorite[];
  onMarkerClick: (placeId: string) => void;
  className?: string;
}

export function FavoritesMap({
  favorites,
  onMarkerClick,
  className,
}: FavoritesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    if (mapInstanceRef.current) {
      return;
    }

    const centerPosition =
      favorites.length > 0
        ? new naver.maps.LatLng(favorites[0].latitude, favorites[0].longitude)
        : new naver.maps.LatLng(
            MAP_CONFIG.DEFAULT_CENTER.lat,
            MAP_CONFIG.DEFAULT_CENTER.lng
          );

    const map = new naver.maps.Map(mapRef.current, {
      center: centerPosition,
      zoom: favorites.length === 1 ? 15 : MAP_CONFIG.DEFAULT_ZOOM,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
    });

    mapInstanceRef.current = map;
    setIsMapLoaded(true);
  }, [favorites]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || favorites.length === 0) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    let minLat = favorites[0].latitude;
    let maxLat = favorites[0].latitude;
    let minLng = favorites[0].longitude;
    let maxLng = favorites[0].longitude;

    favorites.forEach((favorite) => {
      const position = new naver.maps.LatLng(
        favorite.latitude,
        favorite.longitude
      );

      minLat = Math.min(minLat, favorite.latitude);
      maxLat = Math.max(maxLat, favorite.latitude);
      minLng = Math.min(minLng, favorite.longitude);
      maxLng = Math.max(maxLng, favorite.longitude);

      const icon =
        CATEGORY_ICONS[favorite.category as keyof typeof CATEGORY_ICONS] ||
        CATEGORY_ICONS['기타'];

      const marker = new naver.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: favorite.placeName,
        icon: {
          content: `
            <div class="flex items-center justify-center w-10 h-10 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <span class="text-xl">${icon}</span>
            </div>
          `,
          anchor: new naver.maps.Point(20, 20),
        },
      });

      marker.addListener('click', () => {
        onMarkerClick(favorite.placeId);
      });

      markersRef.current.push(marker);
    });

    if (favorites.length === 1) {
      mapInstanceRef.current.setCenter(
        new naver.maps.LatLng(favorites[0].latitude, favorites[0].longitude)
      );
      mapInstanceRef.current.setZoom(15);
    } else if (favorites.length > 1) {
      const centerLat = (maxLat + minLat) / 2;
      const centerLng = (maxLng + minLng) / 2;

      mapInstanceRef.current.setCenter(
        new naver.maps.LatLng(centerLat, centerLng)
      );

      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);

      let zoom = 15;
      if (maxDiff > 0.1) zoom = 11;
      else if (maxDiff > 0.05) zoom = 12;
      else if (maxDiff > 0.02) zoom = 13;
      else if (maxDiff > 0.01) zoom = 14;

      mapInstanceRef.current.setZoom(zoom);
    }
  }, [favorites, isMapLoaded, onMarkerClick]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className={cn('w-full h-full', className)}
      role="region"
      aria-label="즐겨찾기 장소 지도"
    />
  );
}

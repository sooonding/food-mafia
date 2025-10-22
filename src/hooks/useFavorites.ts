'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Favorite, FavoriteList } from '@/types/favorite';
import { FAVORITE_CONFIG } from '@/constants/favorite';
import { getLocalStorage, setLocalStorage } from '@/lib/utils/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const stored = getLocalStorage<FavoriteList>(
      FAVORITE_CONFIG.STORAGE_KEY,
      { favorites: [] }
    );
    setFavorites(stored.favorites);
  }, []);

  const addFavorite = useCallback((favorite: Favorite) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.placeId === favorite.placeId)) {
        return prev;
      }

      const newFavorites = [...prev, favorite];
      if (newFavorites.length > FAVORITE_CONFIG.MAX_ITEMS) {
        newFavorites.shift();
      }

      setLocalStorage(FAVORITE_CONFIG.STORAGE_KEY, { favorites: newFavorites });
      return newFavorites;
    });
  }, []);

  const removeFavorite = useCallback((placeId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.filter((f) => f.placeId !== placeId);
      setLocalStorage(FAVORITE_CONFIG.STORAGE_KEY, { favorites: newFavorites });
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback(
    (placeId: string) => {
      return favorites.some((f) => f.placeId === placeId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (favorite: Favorite) => {
      if (isFavorite(favorite.placeId)) {
        removeFavorite(favorite.placeId);
      } else {
        addFavorite(favorite);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}

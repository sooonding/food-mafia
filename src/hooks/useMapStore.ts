'use client';

import { create } from 'zustand';
import type { FoodCategory } from '@/types/place';
import { MAP_CONFIG } from '@/constants/map';

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedCategories: FoodCategory[];
  currentLocation: { lat: number; lng: number } | null;

  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  toggleCategory: (category: FoodCategory) => void;
  clearCategories: () => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: MAP_CONFIG.DEFAULT_CENTER,
  zoom: MAP_CONFIG.DEFAULT_ZOOM,
  selectedCategories: [],
  currentLocation: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  toggleCategory: (category) =>
    set((state) => {
      const isSelected = state.selectedCategories.includes(category);
      return {
        selectedCategories: isSelected
          ? state.selectedCategories.filter((c) => c !== category)
          : [...state.selectedCategories, category],
      };
    }),

  clearCategories: () => set({ selectedCategories: [] }),

  setCurrentLocation: (location) => set({ currentLocation: location }),
}));

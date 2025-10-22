export interface Favorite {
  placeId: string;
  placeName: string;
  category: string;
  averageRating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  addedAt: string;
}

export interface FavoriteList {
  favorites: Favorite[];
}

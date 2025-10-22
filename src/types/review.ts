export interface Review {
  id: string;
  placeId: string;
  authorName: string;
  rating: number;
  content: string;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFormData {
  authorName: string;
  rating: number;
  content: string;
  visitedAt?: string;
  password: string;
}

export interface ReviewUpdateFormData {
  rating: number;
  content: string;
  visitedAt?: string | null;
  password: string;
}

export interface ReviewDeleteRequest {
  password: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

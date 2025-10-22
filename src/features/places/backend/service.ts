import type { SupabaseClient } from '@supabase/supabase-js';
import type { Place, PlaceMarker } from '@/types/place';
import type { CreatePlaceRequest } from './schema';

interface FetchPlacesByBoundsParams {
  supabase: SupabaseClient;
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
  categories?: string[];
}

/**
 * 지도 영역 내 장소 목록 조회
 */
export async function fetchPlacesByBounds({
  supabase,
  lat1,
  lng1,
  lat2,
  lng2,
  categories,
}: FetchPlacesByBoundsParams): Promise<PlaceMarker[]> {
  let query = supabase
    .from('places')
    .select('id, name, latitude, longitude, category, average_rating, review_count')
    .gte('latitude', Math.min(lat1, lat2))
    .lte('latitude', Math.max(lat1, lat2))
    .gte('longitude', Math.min(lng1, lng2))
    .lte('longitude', Math.max(lng1, lng2))
    .gt('review_count', 0) // 리뷰가 있는 장소만
    .order('review_count', { ascending: false })
    .limit(100);

  // 카테고리 필터 적용
  if (categories && categories.length > 0) {
    query = query.in('category', categories);
  }

  const { data, error } = await query;

  if (error) {
    console.error('장소 목록 조회 실패:', error);
    throw new Error('장소 목록을 불러올 수 없습니다');
  }

  return (
    data?.map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category,
      averageRating: place.average_rating,
      reviewCount: place.review_count,
    })) || []
  );
}

/**
 * 장소 생성 또는 조회 (upsert)
 * 같은 네이버 링크를 가진 장소가 있으면 조회, 없으면 생성
 */
export async function upsertPlace(
  supabase: SupabaseClient,
  placeData: CreatePlaceRequest
): Promise<{ placeId: string; isNew: boolean }> {
  // 1. 네이버 링크로 기존 장소 검색
  if (placeData.naverLink) {
    const { data: existingPlace } = await supabase
      .from('places')
      .select('id')
      .eq('naver_link', placeData.naverLink)
      .single();

    if (existingPlace) {
      return { placeId: existingPlace.id, isNew: false };
    }
  }

  // 2. 좌표 + 이름으로 중복 체크 (네이버 링크가 없는 경우)
  const { data: duplicatePlace } = await supabase
    .from('places')
    .select('id')
    .eq('name', placeData.name)
    .gte('latitude', placeData.latitude - 0.0001) // 약 11m 오차
    .lte('latitude', placeData.latitude + 0.0001)
    .gte('longitude', placeData.longitude - 0.0001)
    .lte('longitude', placeData.longitude + 0.0001)
    .single();

  if (duplicatePlace) {
    return { placeId: duplicatePlace.id, isNew: false };
  }

  // 3. 새 장소 생성
  const { data: newPlace, error } = await supabase
    .from('places')
    .insert({
      name: placeData.name,
      address: placeData.address,
      road_address: placeData.roadAddress,
      category: placeData.category,
      telephone: placeData.telephone,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      naver_place_id: placeData.naverPlaceId,
      naver_link: placeData.naverLink,
      average_rating: 0,
      review_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('장소 생성 실패:', error);
    throw new Error('장소를 생성할 수 없습니다');
  }

  return { placeId: newPlace.id, isNew: true };
}

/**
 * 특정 장소 상세 정보 조회
 */
export async function fetchPlaceById(
  supabase: SupabaseClient,
  placeId: string
): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (error) {
    console.error('장소 조회 실패:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    roadAddress: data.road_address,
    category: data.category,
    telephone: data.telephone,
    latitude: data.latitude,
    longitude: data.longitude,
    naverPlaceId: data.naver_place_id,
    naverLink: data.naver_link,
    averageRating: data.average_rating,
    reviewCount: data.review_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

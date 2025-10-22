-- =====================================================
-- 장소 테이블 생성
-- =====================================================
-- 설명: 리뷰가 작성된 맛집 정보 저장
-- 작성일: 2025-10-21
-- =====================================================

CREATE TABLE IF NOT EXISTS public.places (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 장소 기본 정보
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  address TEXT NOT NULL CHECK (length(address) >= 1),
  road_address TEXT CHECK (road_address IS NULL OR length(road_address) >= 1),
  category TEXT NOT NULL CHECK (category IN ('한식', '일식', '양식', '중식', '카페', '디저트', '패스트푸드', '주점', '뷔페', '기타')),
  telephone TEXT CHECK (telephone IS NULL OR telephone ~ '^\d{2,3}-\d{3,4}-\d{4}$'),

  -- 위치 정보 (WGS84 좌표계)
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),

  -- 네이버 연동 정보
  naver_place_id TEXT UNIQUE, -- 네이버 장소 고유 ID
  naver_link TEXT CHECK (naver_link IS NULL OR naver_link ~ '^https?://'),

  -- 통계 정보 (비정규화)
  average_rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 테이블 설명
COMMENT ON TABLE public.places IS '장소 정보 테이블 - 리뷰가 작성된 맛집 정보 저장';

-- 컬럼 설명
COMMENT ON COLUMN public.places.id IS '장소 고유 식별자 (UUID)';
COMMENT ON COLUMN public.places.name IS '장소명 (1~100자)';
COMMENT ON COLUMN public.places.address IS '지번 주소';
COMMENT ON COLUMN public.places.road_address IS '도로명 주소';
COMMENT ON COLUMN public.places.category IS '음식 카테고리 (한식/일식/양식/중식/카페/디저트/패스트푸드/주점/뷔페/기타)';
COMMENT ON COLUMN public.places.telephone IS '전화번호 (형식: 02-1234-5678)';
COMMENT ON COLUMN public.places.latitude IS '위도 (WGS84, -90~90)';
COMMENT ON COLUMN public.places.longitude IS '경도 (WGS84, -180~180)';
COMMENT ON COLUMN public.places.naver_place_id IS '네이버 장소 ID (중복 방지)';
COMMENT ON COLUMN public.places.naver_link IS '네이버 지도 링크';
COMMENT ON COLUMN public.places.average_rating IS '평균 평점 (0.0 ~ 5.0, 소수점 1자리)';
COMMENT ON COLUMN public.places.review_count IS '총 리뷰 개수 (캐시)';
COMMENT ON COLUMN public.places.created_at IS '생성 시각';
COMMENT ON COLUMN public.places.updated_at IS '최종 수정 시각';

-- RLS 비활성화
ALTER TABLE IF EXISTS public.places DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_places_updated_at
BEFORE UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

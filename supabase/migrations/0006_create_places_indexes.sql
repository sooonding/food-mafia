-- =====================================================
-- 장소 테이블 인덱스 생성
-- =====================================================
-- 설명: 위치 기반 검색 및 성능 최적화 인덱스
-- 작성일: 2025-10-21
-- =====================================================

-- 1. 위치 기반 검색 (지도 bounds 조회) - GiST 인덱스 사용
-- PostgreSQL의 box 타입과 GiST 인덱스를 활용한 공간 검색
CREATE INDEX IF NOT EXISTS idx_places_location_gist
ON public.places USING GIST (box(point(longitude, latitude), point(longitude, latitude)));

COMMENT ON INDEX idx_places_location_gist IS '위치 기반 범위 검색 최적화 (GiST)';

-- 2. 카테고리별 위치 검색 (복합 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_places_category_location
ON public.places(category, latitude, longitude)
WHERE review_count > 0;

COMMENT ON INDEX idx_places_category_location IS '카테고리별 위치 검색 (리뷰가 있는 장소만)';

-- 3. 네이버 장소 ID 검색 (중복 확인) - UNIQUE 제약조건으로 자동 생성됨
-- CREATE UNIQUE INDEX는 테이블 정의에서 UNIQUE 컬럼으로 대체됨

-- 4. 인기 장소 조회 (리뷰 개수 + 평점 복합)
CREATE INDEX IF NOT EXISTS idx_places_popularity
ON public.places(review_count DESC, average_rating DESC)
WHERE review_count > 0;

COMMENT ON INDEX idx_places_popularity IS '인기 장소 정렬 최적화 (리뷰수 + 평점)';

-- 5. 최근 추가된 장소 조회
CREATE INDEX IF NOT EXISTS idx_places_created_at
ON public.places(created_at DESC);

COMMENT ON INDEX idx_places_created_at IS '최근 추가 장소 조회';

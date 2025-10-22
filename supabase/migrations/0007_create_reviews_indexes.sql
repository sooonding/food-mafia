-- =====================================================
-- 리뷰 테이블 인덱스 생성
-- =====================================================
-- 설명: 리뷰 조회 및 정렬 성능 최적화
-- 작성일: 2025-10-21
-- =====================================================

-- 1. 특정 장소의 리뷰 조회 (외래키로 자동 생성되지만 명시적으로 관리)
CREATE INDEX IF NOT EXISTS idx_reviews_place_id
ON public.reviews(place_id);

COMMENT ON INDEX idx_reviews_place_id IS '장소별 리뷰 목록 조회';

-- 2. 장소별 최신 리뷰 정렬 (커버링 인덱스)
CREATE INDEX IF NOT EXISTS idx_reviews_place_created
ON public.reviews(place_id, created_at DESC)
INCLUDE (rating, author_name);

COMMENT ON INDEX idx_reviews_place_created IS '장소별 최신 리뷰 정렬 (커버링 인덱스)';

-- 3. 장소별 평점 정렬
CREATE INDEX IF NOT EXISTS idx_reviews_place_rating
ON public.reviews(place_id, rating DESC);

COMMENT ON INDEX idx_reviews_place_rating IS '장소별 평점순 정렬';

-- 4. 전체 최신 리뷰 조회
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
ON public.reviews(created_at DESC);

COMMENT ON INDEX idx_reviews_created_at IS '전체 최신 리뷰 조회';

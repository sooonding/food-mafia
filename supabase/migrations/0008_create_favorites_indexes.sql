-- =====================================================
-- 즐겨찾기 테이블 인덱스 생성
-- =====================================================
-- 설명: 사용자별 즐겨찾기 조회 최적화
-- 작성일: 2025-10-21
-- =====================================================

-- 1. 사용자별 즐겨찾기 조회 (복합 인덱스로 정렬까지 커버)
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
ON public.favorites(user_identifier, created_at DESC);

COMMENT ON INDEX idx_favorites_user_created IS '사용자별 즐겨찾기 조회 및 최신순 정렬';

-- 2. 장소별 즐겨찾기 수 조회
CREATE INDEX IF NOT EXISTS idx_favorites_place
ON public.favorites(place_id);

COMMENT ON INDEX idx_favorites_place IS '장소별 즐겨찾기 수 집계';

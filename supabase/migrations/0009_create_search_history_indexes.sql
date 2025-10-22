-- =====================================================
-- 검색 기록 테이블 인덱스 생성
-- =====================================================
-- 설명: 최근 검색어 조회 최적화
-- 작성일: 2025-10-21
-- =====================================================

-- 1. 사용자별 검색 기록 조회 (최신순)
CREATE INDEX IF NOT EXISTS idx_search_history_user_created
ON public.search_history(user_identifier, created_at DESC);

COMMENT ON INDEX idx_search_history_user_created IS '사용자별 최근 검색어 조회';

-- =====================================================
-- 검색 기록 테이블 생성
-- =====================================================
-- 설명: 사용자의 최근 검색어 저장 (최대 10개)
-- 작성일: 2025-10-21
-- =====================================================

CREATE TABLE IF NOT EXISTS public.search_history (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 식별
  user_identifier TEXT NOT NULL CHECK (length(user_identifier) >= 1),

  -- 검색 정보
  search_query TEXT NOT NULL CHECK (length(search_query) >= 1 AND length(search_query) <= 100),

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 중복 검색어 방지 (같은 사용자의 같은 검색어는 하나만 유지)
CREATE UNIQUE INDEX IF NOT EXISTS search_history_user_query_unique
ON public.search_history(user_identifier, search_query);

-- 테이블 설명
COMMENT ON TABLE public.search_history IS '검색 기록 테이블 - 최근 검색어 저장 (최대 10개)';

-- 컬럼 설명
COMMENT ON COLUMN public.search_history.id IS '검색 기록 고유 식별자 (UUID)';
COMMENT ON COLUMN public.search_history.user_identifier IS '사용자 식별자 (브라우저 UUID)';
COMMENT ON COLUMN public.search_history.search_query IS '검색어 (1~100자)';
COMMENT ON COLUMN public.search_history.created_at IS '검색 시각';

-- RLS 비활성화
ALTER TABLE IF EXISTS public.search_history DISABLE ROW LEVEL SECURITY;

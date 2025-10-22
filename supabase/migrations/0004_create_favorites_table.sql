-- =====================================================
-- 즐겨찾기 테이블 생성
-- =====================================================
-- 설명: 사용자가 저장한 장소 즐겨찾기
-- 작성일: 2025-10-21
-- =====================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,

  -- 사용자 식별
  user_identifier TEXT NOT NULL CHECK (length(user_identifier) >= 1), -- 브라우저 UUID 또는 향후 사용자 ID

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 중복 즐겨찾기 방지 (같은 사용자가 같은 장소를 중복 저장할 수 없음)
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_place_unique
ON public.favorites(user_identifier, place_id);

-- 테이블 설명
COMMENT ON TABLE public.favorites IS '즐겨찾기 테이블 - 사용자가 저장한 장소';

-- 컬럼 설명
COMMENT ON COLUMN public.favorites.id IS '즐겨찾기 고유 식별자 (UUID)';
COMMENT ON COLUMN public.favorites.place_id IS '장소 ID (외래키)';
COMMENT ON COLUMN public.favorites.user_identifier IS '사용자 식별자 (브라우저 UUID 또는 향후 User ID)';
COMMENT ON COLUMN public.favorites.created_at IS '즐겨찾기 추가 시각';

-- RLS 비활성화
ALTER TABLE IF EXISTS public.favorites DISABLE ROW LEVEL SECURITY;

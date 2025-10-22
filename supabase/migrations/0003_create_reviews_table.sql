-- =====================================================
-- 리뷰 테이블 생성
-- =====================================================
-- 설명: 사용자가 작성한 장소 리뷰
-- 작성일: 2025-10-21
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,

  -- 리뷰 내용
  author_name TEXT NOT NULL CHECK (length(author_name) >= 2 AND length(author_name) <= 10),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL CHECK (length(content) >= 10 AND length(content) <= 500),
  visited_at DATE CHECK (visited_at IS NULL OR visited_at <= CURRENT_DATE),

  -- 인증 정보
  password_hash TEXT NOT NULL CHECK (length(password_hash) = 60), -- bcrypt 해시는 항상 60자

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 테이블 설명
COMMENT ON TABLE public.reviews IS '리뷰 테이블 - 사용자가 작성한 장소 리뷰';

-- 컬럼 설명
COMMENT ON COLUMN public.reviews.id IS '리뷰 고유 식별자 (UUID)';
COMMENT ON COLUMN public.reviews.place_id IS '장소 ID (외래키)';
COMMENT ON COLUMN public.reviews.author_name IS '리뷰 작성자명 (2~10자)';
COMMENT ON COLUMN public.reviews.rating IS '평점 (1~5 정수)';
COMMENT ON COLUMN public.reviews.content IS '리뷰 내용 (10~500자)';
COMMENT ON COLUMN public.reviews.visited_at IS '방문 날짜 (선택, 미래 날짜 불가)';
COMMENT ON COLUMN public.reviews.password_hash IS 'bcrypt 해시 비밀번호 (60자, 수정/삭제 인증용)';
COMMENT ON COLUMN public.reviews.created_at IS '생성 시각';
COMMENT ON COLUMN public.reviews.updated_at IS '최종 수정 시각';

-- RLS 비활성화
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

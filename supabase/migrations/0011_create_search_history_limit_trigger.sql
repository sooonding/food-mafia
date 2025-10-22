-- =====================================================
-- 검색 기록 10개 제한 트리거 생성
-- =====================================================
-- 설명: 사용자별 검색 기록을 최대 10개로 자동 제한
-- 작성일: 2025-10-21
-- =====================================================

-- 10개 제한 자동 관리 트리거 함수
CREATE OR REPLACE FUNCTION limit_search_history()
RETURNS TRIGGER AS $$
BEGIN
  -- 10개를 초과하는 오래된 검색 기록 삭제
  DELETE FROM public.search_history
  WHERE id IN (
    SELECT id FROM public.search_history
    WHERE user_identifier = NEW.user_identifier
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limit_search_history() IS '사용자별 검색 기록을 최대 10개로 제한';

-- 검색 기록 추가 시 트리거
CREATE TRIGGER trigger_limit_search_history
AFTER INSERT ON public.search_history
FOR EACH ROW
EXECUTE FUNCTION limit_search_history();

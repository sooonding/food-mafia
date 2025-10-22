-- =====================================================
-- 장소 통계 자동 업데이트 트리거 생성
-- =====================================================
-- 설명: 리뷰 추가/수정/삭제 시 장소의 평균 평점 및 리뷰 개수 자동 갱신
-- 작성일: 2025-10-21
-- =====================================================

-- INSERT/UPDATE 트리거 함수 (NEW 사용)
CREATE OR REPLACE FUNCTION update_place_stats_on_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.places
  SET
    review_count = (
      SELECT COUNT(*) FROM public.reviews WHERE place_id = NEW.place_id
    ),
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0.0)
      FROM public.reviews
      WHERE place_id = NEW.place_id
    ),
    updated_at = NOW()
  WHERE id = NEW.place_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_place_stats_on_change() IS '리뷰 추가/수정 시 장소 통계 업데이트';

-- DELETE 트리거 함수 (OLD 사용)
CREATE OR REPLACE FUNCTION update_place_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.places
  SET
    review_count = (
      SELECT COUNT(*) FROM public.reviews WHERE place_id = OLD.place_id
    ),
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0.0)
      FROM public.reviews
      WHERE place_id = OLD.place_id
    ),
    updated_at = NOW()
  WHERE id = OLD.place_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_place_stats_on_delete() IS '리뷰 삭제 시 장소 통계 업데이트';

-- INSERT 트리거
CREATE TRIGGER trigger_review_insert_stats
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_place_stats_on_change();

-- UPDATE 트리거 (평점 또는 장소 변경 시에만 실행)
CREATE TRIGGER trigger_review_update_stats
AFTER UPDATE ON public.reviews
FOR EACH ROW
WHEN (OLD.rating IS DISTINCT FROM NEW.rating OR OLD.place_id IS DISTINCT FROM NEW.place_id)
EXECUTE FUNCTION update_place_stats_on_change();

-- DELETE 트리거 (OLD 사용)
CREATE TRIGGER trigger_review_delete_stats
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_place_stats_on_delete();

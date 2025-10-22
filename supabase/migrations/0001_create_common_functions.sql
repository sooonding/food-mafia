-- =====================================================
-- 공통 함수 생성
-- =====================================================
-- 설명: updated_at 컬럼을 자동으로 갱신하는 트리거 함수
-- 작성일: 2025-10-21
-- =====================================================

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 함수 설명
COMMENT ON FUNCTION update_updated_at_column() IS 'updated_at 컬럼을 현재 시각으로 자동 갱신하는 트리거 함수';

-- =====================================================
-- 샘플 데이터 생성 (개발/테스트용)
-- =====================================================
-- 설명: 개발 및 테스트 환경을 위한 초기 샘플 데이터
-- 작성일: 2025-10-21
-- 주의: 프로덕션 환경에서는 이 마이그레이션을 실행하지 마세요!
-- =====================================================

-- 샘플 장소 데이터 삽입
INSERT INTO public.places (
  id,
  name,
  address,
  road_address,
  category,
  telephone,
  latitude,
  longitude,
  naver_place_id,
  naver_link,
  average_rating,
  review_count
) VALUES
  -- 서울 이태원 한식당
  (
    '550e8400-e29b-41d4-a716-446655440000',
    '이태원 맛집',
    '서울특별시 용산구 이태원동 123-45',
    '서울특별시 용산구 이태원로 123',
    '한식',
    '02-1234-5678',
    37.5344,
    126.9944,
    'naver-place-001',
    'https://map.naver.com/v5/entry/place/1234567890',
    4.5,
    3
  ),
  -- 강남 일식당
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '강남 초밥집',
    '서울특별시 강남구 역삼동 234-56',
    '서울특별시 강남구 테헤란로 234',
    '일식',
    '02-2345-6789',
    37.4979,
    127.0276,
    'naver-place-002',
    'https://map.naver.com/v5/entry/place/2345678901',
    4.8,
    2
  ),
  -- 홍대 카페
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '홍대 감성카페',
    '서울특별시 마포구 서교동 345-67',
    '서울특별시 마포구 홍익로 345',
    '카페',
    '02-3456-7890',
    37.5563,
    126.9238,
    'naver-place-003',
    'https://map.naver.com/v5/entry/place/3456789012',
    4.2,
    1
  )
ON CONFLICT (id) DO NOTHING;

-- 샘플 리뷰 데이터 삽입
-- 비밀번호: "test1234" (bcrypt 해시)
INSERT INTO public.reviews (
  id,
  place_id,
  author_name,
  rating,
  content,
  visited_at,
  password_hash
) VALUES
  -- 이태원 맛집 리뷰 1
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '맛집헌터',
    5,
    '정말 맛있었어요! 특히 김치찌개가 일품이었습니다. 다음에도 꼭 방문하고 싶네요.',
    '2025-10-15',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  -- 이태원 맛집 리뷰 2
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '음식러버',
    4,
    '분위기도 좋고 음식도 맛있어요. 다만 웨이팅이 좀 길었습니다.',
    '2025-10-18',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  -- 이태원 맛집 리뷰 3
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    '서울탐방',
    5,
    '이태원에서 가장 맛있는 한식당이에요. 강추합니다!',
    '2025-10-20',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  -- 강남 초밥집 리뷰 1
  (
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    '초밥마니아',
    5,
    '신선한 재료와 정성스러운 손맛이 느껴지는 곳입니다. 가격대비 훌륭해요!',
    '2025-10-16',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  -- 강남 초밥집 리뷰 2
  (
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    '강남러버',
    4,
    '회가 정말 신선하고 맛있어요. 재방문 의사 100%입니다.',
    '2025-10-19',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  -- 홍대 카페 리뷰 1
  (
    '660e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440002',
    '카페투어',
    4,
    '인테리어가 너무 예쁘고 커피도 맛있어요. 사진 찍기 좋은 곳!',
    '2025-10-17',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  )
ON CONFLICT (id) DO NOTHING;

-- 데이터 삽입 확인
DO $$
DECLARE
  place_count INTEGER;
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO place_count FROM public.places;
  SELECT COUNT(*) INTO review_count FROM public.reviews;

  RAISE NOTICE '샘플 데이터 삽입 완료';
  RAISE NOTICE '- 장소: %개', place_count;
  RAISE NOTICE '- 리뷰: %개', review_count;
END $$;

# 맛집 지도 서비스 - 데이터베이스 설계 문서

## 목차

1. [개요](#개요)
2. [ERD (Entity Relationship Diagram)](#erd-entity-relationship-diagram)
3. [테이블 상세 스키마](#테이블-상세-스키마)
4. [인덱스 설계](#인덱스-설계)
5. [관계 (Foreign Keys)](#관계-foreign-keys)
6. [데이터 접근 패턴](#데이터-접근-패턴)
7. [확장성 고려사항](#확장성-고려사항)
8. [보안 고려사항](#보안-고려사항)

---

## 개요

### 설계 원칙

- **비로그인 서비스**: 사용자 인증 없이 리뷰 작성 및 조회 가능
- **비밀번호 기반 인증**: 리뷰 수정/삭제 시 비밀번호로 소유권 확인
- **위치 기반 검색**: 지도 영역(bounds) 기반 효율적 데이터 로딩
- **카테고리 기반 필터링**: 음식 카테고리별 장소 분류 및 검색
- **성능 최적화**: 인덱스를 통한 빠른 검색 및 조회
- **확장 가능성**: 향후 기능 추가를 고려한 유연한 스키마

### 기술 스택

- **Database**: PostgreSQL (Supabase)
- **ORM/Client**: Supabase JavaScript SDK
- **Password Hashing**: bcrypt (salt rounds: 10)
- **Validation**: Zod schema validation

---

## ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│      places         │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ address             │
│ road_address        │
│ category            │
│ telephone           │
│ latitude            │
│ longitude           │
│ naver_place_id      │
│ naver_link          │
│ average_rating      │
│ review_count        │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:N
          │
          ▼
┌─────────────────────┐
│      reviews        │
├─────────────────────┤
│ id (PK)             │
│ place_id (FK)       │
│ author_name         │
│ rating              │
│ content             │
│ visited_at          │
│ password_hash       │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│    favorites        │
├─────────────────────┤
│ id (PK)             │
│ place_id (FK)       │
│ user_identifier     │
│ created_at          │
└─────────────────────┘
          │
          │ N:1
          │
          ▼
┌─────────────────────┐
│      places         │
│     (참조)          │
└─────────────────────┘

┌─────────────────────┐
│  search_history     │
├─────────────────────┤
│ id (PK)             │
│ user_identifier     │
│ search_query        │
│ created_at          │
└─────────────────────┘
```

---

## 테이블 상세 스키마

### 1. places (장소)

장소 정보를 저장하는 핵심 테이블. 네이버 로컬 API에서 검색된 장소 정보를 기반으로 생성되며, 리뷰 작성 시 자동으로 DB에 추가됩니다.

```sql
CREATE TABLE IF NOT EXISTS public.places (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 장소 기본 정보
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  address TEXT NOT NULL CHECK (length(address) >= 1),
  road_address TEXT CHECK (road_address IS NULL OR length(road_address) >= 1),
  category TEXT NOT NULL CHECK (category IN ('한식', '일식', '양식', '중식', '카페', '디저트', '패스트푸드', '주점', '뷔페', '기타')),
  telephone TEXT CHECK (telephone IS NULL OR telephone ~ '^\d{2,3}-\d{3,4}-\d{4}$'),

  -- 위치 정보 (WGS84 좌표계)
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),

  -- 네이버 연동 정보
  naver_place_id TEXT UNIQUE, -- 네이버 장소 고유 ID
  naver_link TEXT CHECK (naver_link IS NULL OR naver_link ~ '^https?://'),

  -- 통계 정보 (비정규화)
  average_rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 테이블 설명
COMMENT ON TABLE public.places IS '장소 정보 테이블 - 리뷰가 작성된 맛집 정보 저장';

-- 컬럼 설명
COMMENT ON COLUMN public.places.id IS '장소 고유 식별자 (UUID)';
COMMENT ON COLUMN public.places.name IS '장소명 (1~100자)';
COMMENT ON COLUMN public.places.address IS '지번 주소';
COMMENT ON COLUMN public.places.road_address IS '도로명 주소';
COMMENT ON COLUMN public.places.category IS '음식 카테고리 (한식/일식/양식/중식/카페/디저트/패스트푸드/주점/뷔페/기타)';
COMMENT ON COLUMN public.places.telephone IS '전화번호 (형식: 02-1234-5678)';
COMMENT ON COLUMN public.places.latitude IS '위도 (WGS84, -90~90)';
COMMENT ON COLUMN public.places.longitude IS '경도 (WGS84, -180~180)';
COMMENT ON COLUMN public.places.naver_place_id IS '네이버 장소 ID (중복 방지)';
COMMENT ON COLUMN public.places.average_rating IS '평균 평점 (0.0 ~ 5.0, 소수점 1자리)';
COMMENT ON COLUMN public.places.review_count IS '총 리뷰 개수 (캐시)';

-- RLS 비활성화
ALTER TABLE IF EXISTS public.places DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_places_updated_at
BEFORE UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**데이터 예시**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "이태원 맛집",
  "address": "서울특별시 용산구 이태원동 123-45",
  "road_address": "서울특별시 용산구 이태원로 123",
  "category": "한식",
  "telephone": "02-1234-5678",
  "latitude": 37.5344,
  "longitude": 126.9944,
  "naver_place_id": "1234567890",
  "naver_link": "https://map.naver.com/v5/entry/place/1234567890",
  "average_rating": 4.5,
  "review_count": 12,
  "created_at": "2025-10-21T05:00:00Z",
  "updated_at": "2025-10-21T06:30:00Z"
}
```

---

### 2. reviews (리뷰)

사용자가 작성한 리뷰 정보. 비밀번호 해시를 저장하여 수정/삭제 시 인증에 사용합니다.

```sql
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

-- RLS 비활성화
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**데이터 예시**:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "place_id": "550e8400-e29b-41d4-a716-446655440000",
  "author_name": "맛집헌터",
  "rating": 5,
  "content": "정말 맛있었어요! 특히 김치찌개가 일품이었습니다. 다음에도 꼭 방문하고 싶네요.",
  "visited_at": "2025-10-15",
  "password_hash": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "created_at": "2025-10-21T05:00:00Z",
  "updated_at": "2025-10-21T05:00:00Z"
}
```

---

### 3. favorites (즐겨찾기)

사용자가 저장한 즐겨찾기 장소. 비로그인 환경에서는 브라우저 식별자(LocalStorage UUID 등)를 사용합니다.

```sql
CREATE TABLE IF NOT EXISTS public.favorites (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,

  -- 사용자 식별
  user_identifier TEXT NOT NULL, -- 브라우저 UUID 또는 향후 사용자 ID

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

-- RLS 비활성화
ALTER TABLE IF EXISTS public.favorites DISABLE ROW LEVEL SECURITY;
```

**데이터 예시**:

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "place_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_identifier": "browser-uuid-abcd1234",
  "created_at": "2025-10-21T05:30:00Z"
}
```

---

### 4. search_history (검색 기록)

사용자의 최근 검색어를 저장하여 빠른 재검색을 지원합니다. (최대 10개 유지)

```sql
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

-- RLS 비활성화
ALTER TABLE IF EXISTS public.search_history DISABLE ROW LEVEL SECURITY;

-- 10개 제한 자동 관리 트리거
CREATE OR REPLACE FUNCTION limit_search_history()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER trigger_limit_search_history
AFTER INSERT ON public.search_history
FOR EACH ROW
EXECUTE FUNCTION limit_search_history();
```

**데이터 예시**:

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "user_identifier": "browser-uuid-abcd1234",
  "search_query": "이태원 한식",
  "created_at": "2025-10-21T06:00:00Z"
}
```

---

## 인덱스 설계

### 성능 최적화를 위한 인덱스

```sql
-- ===== places 테이블 인덱스 =====

-- 1. 위치 기반 검색 (지도 bounds 조회) - GiST 인덱스 사용
-- PostgreSQL의 box 타입과 GiST 인덱스를 활용한 공간 검색
CREATE INDEX IF NOT EXISTS idx_places_location_gist
ON public.places USING GIST (box(point(longitude, latitude), point(longitude, latitude)));

-- 2. 카테고리별 위치 검색 (복합 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_places_category_location
ON public.places(category, latitude, longitude)
WHERE review_count > 0;

-- 3. 네이버 장소 ID 검색 (중복 확인) - 이미 UNIQUE 제약조건으로 인덱스 자동 생성됨
-- CREATE UNIQUE INDEX는 테이블 정의에서 UNIQUE 컬럼으로 대체됨

-- 4. 인기 장소 조회 (리뷰 개수 + 평점 복합)
CREATE INDEX IF NOT EXISTS idx_places_popularity
ON public.places(review_count DESC, average_rating DESC)
WHERE review_count > 0;

-- 5. 최근 추가된 장소 조회
CREATE INDEX IF NOT EXISTS idx_places_created_at
ON public.places(created_at DESC);


-- ===== reviews 테이블 인덱스 =====

-- 1. 특정 장소의 리뷰 조회 (외래키로 자동 생성되지만 명시적으로 관리)
CREATE INDEX IF NOT EXISTS idx_reviews_place_id
ON public.reviews(place_id);

-- 2. 장소별 최신 리뷰 정렬 (커버링 인덱스)
CREATE INDEX IF NOT EXISTS idx_reviews_place_created
ON public.reviews(place_id, created_at DESC)
INCLUDE (rating, author_name);

-- 3. 장소별 평점 정렬
CREATE INDEX IF NOT EXISTS idx_reviews_place_rating
ON public.reviews(place_id, rating DESC);

-- 4. 전체 최신 리뷰 조회
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
ON public.reviews(created_at DESC);


-- ===== favorites 테이블 인덱스 =====

-- 1. 사용자별 즐겨찾기 조회 (복합 인덱스로 정렬까지 커버)
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
ON public.favorites(user_identifier, created_at DESC);

-- 2. 장소별 즐겨찾기 수 조회
CREATE INDEX IF NOT EXISTS idx_favorites_place
ON public.favorites(place_id);


-- ===== search_history 테이블 인덱스 =====

-- 1. 사용자별 검색 기록 조회 (최신순)
CREATE INDEX IF NOT EXISTS idx_search_history_user_created
ON public.search_history(user_identifier, created_at DESC);
```

### 인덱스 선정 이유

| 테이블         | 인덱스            | 사용 패턴                            | 인덱스 타입      | 중요도 |
| -------------- | ----------------- | ------------------------------------ | ---------------- | ------ |
| places         | location_gist     | 지도 영역 내 장소 검색 (공간 인덱스) | GiST             | ★★★★★  |
| places         | category_location | 카테고리 + 위치 복합 검색            | B-tree (partial) | ★★★★★  |
| places         | popularity        | 인기 장소 정렬 (리뷰수 + 평점)       | B-tree (partial) | ★★★★☆  |
| reviews        | place_created     | 장소별 최신 리뷰 (커버링 인덱스)     | B-tree + INCLUDE | ★★★★★  |
| reviews        | place_id          | 장소별 리뷰 목록 조회                | B-tree           | ★★★★★  |
| favorites      | user_created      | 사용자별 즐겨찾기 조회 + 정렬        | B-tree           | ★★★★☆  |
| search_history | user_created      | 최근 검색어 조회                     | B-tree           | ★★★☆☆  |

### 인덱스 최적화 전략

1. **GiST 인덱스**: 위치 기반 범위 검색(bounding box)에 최적화
2. **Partial 인덱스**: `WHERE review_count > 0` 조건으로 인덱스 크기 감소
3. **커버링 인덱스**: `INCLUDE` 절로 추가 테이블 조회 없이 데이터 반환
4. **복합 인덱스**: 자주 함께 사용되는 컬럼을 묶어 쿼리 성능 향상

---

## 관계 (Foreign Keys)

### 1. reviews → places

```sql
-- 리뷰는 반드시 하나의 장소에 속함
ALTER TABLE public.reviews
ADD CONSTRAINT fk_reviews_place
FOREIGN KEY (place_id)
REFERENCES public.places(id)
ON DELETE CASCADE;
```

**설명**:

- `ON DELETE CASCADE`: 장소 삭제 시 관련 리뷰도 자동 삭제
- 무결성 보장: 존재하지 않는 장소에 리뷰 작성 불가

### 2. favorites → places

```sql
-- 즐겨찾기는 반드시 하나의 장소를 참조
ALTER TABLE public.favorites
ADD CONSTRAINT fk_favorites_place
FOREIGN KEY (place_id)
REFERENCES public.places(id)
ON DELETE CASCADE;
```

**설명**:

- `ON DELETE CASCADE`: 장소 삭제 시 즐겨찾기도 자동 삭제
- 고아 레코드 방지

---

## 데이터 접근 패턴

### 1. 지도 영역 기반 장소 조회 (가장 빈번)

**요구사항**: 사용자가 보고 있는 지도 영역 내 장소만 로딩

```sql
-- 기본 쿼리
SELECT
  id, name, address, category, latitude, longitude,
  average_rating, review_count
FROM public.places
WHERE
  latitude BETWEEN :sw_lat AND :ne_lat
  AND longitude BETWEEN :sw_lng AND :ne_lng
  AND review_count > 0 -- 리뷰가 있는 장소만
ORDER BY review_count DESC
LIMIT 100;

-- 카테고리 필터 추가
SELECT * FROM public.places
WHERE
  latitude BETWEEN :sw_lat AND :ne_lat
  AND longitude BETWEEN :sw_lng AND :ne_lng
  AND category = :category
  AND review_count > 0
ORDER BY average_rating DESC
LIMIT 100;
```

**성능 최적화**:

- `idx_places_location` 복합 인덱스 사용
- LIMIT으로 결과 제한 (마커 클러스터링 고려)

---

### 2. 장소 상세 조회

**요구사항**: 특정 장소의 모든 정보 + 리뷰 통계

```sql
-- 장소 기본 정보
SELECT * FROM public.places WHERE id = :place_id;

-- 장소의 리뷰 목록 (페이지네이션)
SELECT
  id, author_name, rating, content, visited_at, created_at
FROM public.reviews
WHERE place_id = :place_id
ORDER BY created_at DESC
LIMIT 10 OFFSET :offset;

-- 평점별 분포
SELECT
  rating,
  COUNT(*) as count
FROM public.reviews
WHERE place_id = :place_id
GROUP BY rating
ORDER BY rating DESC;
```

---

### 3. 리뷰 작성 시 장소 통계 업데이트

**요구사항**: 리뷰 작성 후 `average_rating`, `review_count` 자동 갱신

```sql
-- INSERT/UPDATE 트리거 함수
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

-- INSERT 트리거
CREATE TRIGGER trigger_review_insert_stats
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_place_stats_on_change();

-- UPDATE 트리거 (모든 업데이트에 반응)
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
```

**개선사항**:

- DELETE 시 `OLD.place_id` 사용 (기존 버그 수정)
- UPDATE 시 실제 변경이 있을 때만 트리거 실행 (`WHEN` 조건)
- `COALESCE`로 NULL 처리 (리뷰가 모두 삭제된 경우 0.0 반환)
- 평점/장소 변경 모두 감지

---

### 4. 리뷰 수정/삭제 인증

**요구사항**: 비밀번호 확인 후 수정/삭제 허용

```sql
-- 비밀번호 검증 (서비스 레이어에서 bcrypt 사용)
SELECT password_hash
FROM public.reviews
WHERE id = :review_id;

-- 검증 통과 후 수정
UPDATE public.reviews
SET
  rating = :rating,
  content = :content,
  updated_at = NOW()
WHERE id = :review_id;

-- 검증 통과 후 삭제
DELETE FROM public.reviews WHERE id = :review_id;
```

---

### 5. 즐겨찾기 조회

**요구사항**: 사용자가 저장한 장소 목록

```sql
-- 즐겨찾기 목록 + 장소 정보 조인
SELECT
  f.id as favorite_id,
  f.created_at as saved_at,
  p.*
FROM public.favorites f
INNER JOIN public.places p ON f.place_id = p.id
WHERE f.user_identifier = :user_id
ORDER BY f.created_at DESC;

-- 즐겨찾기 추가 (중복 방지)
INSERT INTO public.favorites (place_id, user_identifier)
VALUES (:place_id, :user_id)
ON CONFLICT (user_identifier, place_id) DO NOTHING;

-- 즐겨찾기 제거
DELETE FROM public.favorites
WHERE user_identifier = :user_id AND place_id = :place_id;
```

---

### 6. 검색어 기록 관리

**요구사항**: 최근 검색어 10개 유지 (중복 제거)

```sql
-- 최근 검색어 조회 (중복 없음)
SELECT id, search_query, created_at
FROM public.search_history
WHERE user_identifier = :user_id
ORDER BY created_at DESC
LIMIT 10;

-- 검색어 추가 (중복 시 created_at 갱신)
INSERT INTO public.search_history (user_identifier, search_query)
VALUES (:user_id, :query)
ON CONFLICT (user_identifier, search_query)
DO UPDATE SET created_at = NOW();

-- 오래된 검색어는 트리거가 자동 삭제하므로 별도 쿼리 불필요
```

**개선사항**:

- `UNIQUE INDEX (user_identifier, search_query)`로 중복 방지
- `ON CONFLICT` 절로 중복 검색어는 시간만 갱신
- 트리거가 10개 제한을 자동 관리하므로 애플리케이션 로직 단순화
- `DISTINCT ON` 불필요 (이미 유니크 제약조건으로 보장)

---

## 확장성 고려사항

### 1. 수평 확장 (Horizontal Scaling)

**파티셔닝 전략**:

```sql
-- 위치 기반 파티셔닝 (향후 데이터 증가 시)
-- 지역별로 테이블 분할 가능

CREATE TABLE places_seoul PARTITION OF places
FOR VALUES FROM ('37.0', '126.0') TO ('38.0', '127.5');

CREATE TABLE places_busan PARTITION OF places
FOR VALUES FROM ('35.0', '128.5') TO ('35.5', '129.5');
```

### 2. 캐싱 전략

**Redis 캐싱 대상**:

- 인기 장소 목록 (TTL: 10분)
- 장소 상세 정보 (TTL: 5분)
- 검색 결과 (TTL: 3분)

```typescript
// 예시: 장소 상세 캐싱
const getCachedPlace = async (placeId: string) => {
  const cached = await redis.get(`place:${placeId}`);
  if (cached) return JSON.parse(cached);

  const place = await db.places.findById(placeId);
  await redis.set(`place:${placeId}`, JSON.stringify(place), 'EX', 300);
  return place;
};
```

### 3. 읽기 복제본 (Read Replica)

**쿼리 분리**:

- **Primary DB**: INSERT, UPDATE, DELETE (리뷰 작성/수정/삭제)
- **Replica DB**: SELECT (장소 조회, 리뷰 목록)

### 4. 아카이빙 전략

**오래된 데이터 처리**:

```sql
-- 1년 이상 활동 없는 장소 아카이빙
CREATE TABLE places_archived AS
SELECT * FROM places
WHERE updated_at < NOW() - INTERVAL '1 year'
  AND review_count = 0;

-- 원본에서 삭제
DELETE FROM places
WHERE id IN (SELECT id FROM places_archived);
```

### 5. 전체 텍스트 검색 (Full-Text Search)

**향후 검색 기능 강화**:

```sql
-- PostgreSQL Full-Text Search 인덱스
ALTER TABLE places
ADD COLUMN search_vector tsvector;

CREATE INDEX idx_places_search
ON places USING GIN(search_vector);

-- 자동 업데이트 트리거
CREATE TRIGGER tsvector_update
BEFORE INSERT OR UPDATE ON places
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.korean', name, address);
```

### 6. 통계 테이블 분리

**대용량 통계 처리**:

```sql
-- 일별 통계 테이블
CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,
  total_places INTEGER,
  total_reviews INTEGER,
  avg_rating DECIMAL(2,1),
  top_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매일 자정 집계 (cron job)
INSERT INTO daily_stats (date, total_places, total_reviews, avg_rating)
SELECT
  CURRENT_DATE,
  COUNT(DISTINCT id) FROM places,
  (SELECT COUNT(*) FROM reviews),
  (SELECT AVG(average_rating) FROM places WHERE review_count > 0);
```

---

## 보안 고려사항

### 1. 비밀번호 해싱

**bcrypt 사용 규칙**:

- Salt rounds: **10**
- 리뷰 작성 시 클라이언트에서 평문 전송 → 서버에서 해싱
- 인증 시 bcrypt.compare() 사용
- **중요**: HTTPS 필수 (평문 비밀번호 전송 보호)

```typescript
// 리뷰 작성 시
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash(plainPassword, 10);

// 비밀번호 해시 길이 검증 (bcrypt는 항상 60자)
if (passwordHash.length !== 60) {
  throw new Error('Invalid password hash');
}

// 리뷰 수정/삭제 시
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 2. SQL Injection 방지

**Prepared Statements 필수**:

```typescript
// ❌ 위험한 코드
const query = `SELECT * FROM places WHERE name = '${userInput}'`;

// ✅ 안전한 코드 (Supabase SDK 사용)
const { data } = await supabase.from('places').select('*').eq('name', userInput);
```

### 3. XSS 방지

**입력값 Sanitization**:

```typescript
import DOMPurify from 'dompurify';

// 리뷰 내용 저장 전
const sanitizedContent = DOMPurify.sanitize(userInput);
```

### 4. Rate Limiting

**API 요청 제한** (Hono middleware 구현):

```typescript
// src/backend/middleware/rate-limit.ts
import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

// Redis 기반 Rate Limiting (향후 확장)
// 현재는 메모리 기반으로 구현 (단일 서버 환경)

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (c: Context) => string;
}) => {
  return createMiddleware(async (c, next) => {
    const key = options.keyGenerator
      ? options.keyGenerator(c)
      : c.req.header('x-forwarded-for') || 'default';

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.maxRequests) {
      return c.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        429
      );
    }

    record.count++;
    return next();
  });
};

// 사용 예시
// 리뷰 작성: 사용자당 1분에 3개
app.post(
  '/reviews',
  rateLimit({
    maxRequests: 3,
    windowMs: 60000,
    keyGenerator: c => c.req.header('user-identifier') || 'anonymous',
  })
);

// 검색 요청: IP당 1분에 30개
app.get(
  '/search',
  rateLimit({
    maxRequests: 30,
    windowMs: 60000,
  })
);

// 즐겨찾기: 사용자당 1분에 10개
app.post(
  '/favorites',
  rateLimit({
    maxRequests: 10,
    windowMs: 60000,
    keyGenerator: c => c.req.header('user-identifier') || 'anonymous',
  })
);
```

**향후 개선**:

- Redis로 교체하여 멀티 서버 환경 지원
- Sliding window 알고리즘 적용

### 5. 민감 정보 로깅 금지

**로그 규칙**:

- ❌ 비밀번호 (평문/해시 모두 로깅 금지)
- ❌ 사용자 식별자 (개인정보 보호)
- ✅ 쿼리 성능 메트릭만 로깅

### 6. HTTPS 강제

```typescript
// middleware.ts
if (request.headers.get('x-forwarded-proto') !== 'https') {
  return NextResponse.redirect('https://' + request.url);
}
```

---

## 마이그레이션 체크리스트

### 필수 마이그레이션 파일

```bash
supabase/migrations/
├── 0001_create_example_table.sql                   # ✅ 이미 존재 (삭제 가능)
├── 0002_create_common_functions.sql                # 📝 공통 함수 (updated_at 트리거)
├── 0003_create_places_table.sql                    # 📝 장소 테이블
├── 0004_create_reviews_table.sql                   # 📝 리뷰 테이블
├── 0005_create_favorites_table.sql                 # 📝 즐겨찾기 테이블
├── 0006_create_search_history_table.sql            # 📝 검색 기록 테이블
├── 0007_create_places_indexes.sql                  # 📝 장소 인덱스
├── 0008_create_reviews_indexes.sql                 # 📝 리뷰 인덱스
├── 0009_create_favorites_indexes.sql               # 📝 즐겨찾기 인덱스
├── 0010_create_search_history_indexes.sql          # 📝 검색 기록 인덱스
├── 0011_create_place_stats_triggers.sql            # 📝 장소 통계 트리거
└── 0012_create_search_history_limit_trigger.sql    # 📝 검색 기록 제한 트리거
```

### 적용 순서

1. **공통 함수 생성** (`update_updated_at_column`)
2. **기본 테이블 생성** (places, reviews, favorites, search_history)
   - 제약조건 포함 (CHECK, UNIQUE, FK)
3. **인덱스 생성** (각 테이블별로 분리)
4. **비즈니스 로직 트리거** (통계 업데이트, 검색 기록 제한)
5. **데이터 검증** (제약조건 테스트)

### 마이그레이션 검증 쿼리

```sql
-- 모든 테이블 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 모든 인덱스 확인
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- 모든 트리거 확인
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- 모든 제약조건 확인
SELECT conname, contype, conrelid::regclass AS table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype;
```

---

## 부록: 카테고리 정의

### 음식 카테고리 목록

```typescript
export const FOOD_CATEGORIES = {
  KOREAN: '한식',
  JAPANESE: '일식',
  WESTERN: '양식',
  CHINESE: '중식',
  CAFE: '카페',
  DESSERT: '디저트',
  FAST_FOOD: '패스트푸드',
  BAR: '주점',
  BUFFET: '뷔페',
  OTHER: '기타',
} as const;

export const CATEGORY_ICONS = {
  한식: '🍚',
  일식: '🍣',
  양식: '🥩',
  중식: '🥟',
  카페: '☕',
  디저트: '🍰',
  패스트푸드: '🍔',
  주점: '🍺',
  뷔페: '🍱',
  기타: '🍽️',
} as const;
```

---

## 성능 모니터링 쿼리

### 슬로우 쿼리 확인

```sql
-- 실행 시간이 긴 쿼리 모니터링
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 인덱스 사용률 확인

```sql
-- 사용되지 않는 인덱스 찾기
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename;
```

### 테이블 크기 모니터링

```sql
-- 테이블별 용량 확인
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 개선 이력

### v2.0.0 (2025-10-21)

**주요 개선사항**:

1. **데이터 무결성 강화**

   - 모든 필드에 CHECK 제약조건 추가 (길이, 범위, 형식 검증)
   - bcrypt 해시 길이 검증 (60자 고정)
   - 전화번호 정규식 검증
   - 미래 날짜 방문일 방지

2. **인덱스 최적화**

   - B-tree → GiST 인덱스로 위치 검색 성능 향상
   - Partial 인덱스 도입 (review_count > 0)
   - 커버링 인덱스 (INCLUDE 절) 활용
   - 복합 인덱스 추가 (category + location)
   - 중복 인덱스 제거

3. **트리거 함수 버그 수정**

   - DELETE 트리거에서 OLD.place_id 사용 (기존 NEW.place_id 버그)
   - UPDATE 트리거 조건 개선 (WHEN 절로 불필요한 실행 방지)
   - COALESCE 추가 (NULL 안전성)
   - updated_at 자동 업데이트 트리거 추가

4. **검색 기록 관리 개선**

   - UNIQUE 제약조건으로 중복 검색어 자동 방지
   - ON CONFLICT DO UPDATE로 시간 갱신
   - 트리거로 10개 제한 자동 관리
   - DISTINCT ON 쿼리 제거 (불필요)

5. **보안 강화**

   - Rate Limiting 구현 예시 추가
   - 비밀번호 해시 검증 강화
   - HTTPS 필수 명시

6. **문서 개선**
   - 인덱스 선정 이유 상세화 (타입 명시)
   - 마이그레이션 파일 구조 개선 (12개로 세분화)
   - 검증 쿼리 추가

### v1.0.0 (2025-10-21)

- 초기 데이터베이스 설계

---

## 문서 버전

- **버전**: 2.0.0
- **작성일**: 2025-10-21
- **최종 수정일**: 2025-10-21
- **작성자**: Database Architect
- **검토자**: Senior Database Reviewer

---

## 참고 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 인덱스 가이드](https://www.postgresql.org/docs/current/indexes.html)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

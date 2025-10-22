# Supabase 마이그레이션 가이드

## 📋 개요

이 디렉토리는 맛집 지도 서비스의 PostgreSQL 데이터베이스 마이그레이션 파일을 포함하고 있습니다.

## 🗂️ 마이그레이션 파일 목록

### 필수 순서대로 실행

| 번호 | 파일명 | 설명 | 비고 |
|------|--------|------|------|
| 0001 | `create_common_functions.sql` | 공통 함수 생성 (updated_at 트리거) | 필수 |
| 0002 | `create_places_table.sql` | 장소 테이블 생성 | 핵심 테이블 |
| 0003 | `create_reviews_table.sql` | 리뷰 테이블 생성 | 핵심 테이블 |
| 0004 | `create_favorites_table.sql` | 즐겨찾기 테이블 생성 | 부가 기능 |
| 0005 | `create_search_history_table.sql` | 검색 기록 테이블 생성 | 부가 기능 |
| 0006 | `create_places_indexes.sql` | 장소 인덱스 생성 | 성능 최적화 |
| 0007 | `create_reviews_indexes.sql` | 리뷰 인덱스 생성 | 성능 최적화 |
| 0008 | `create_favorites_indexes.sql` | 즐겨찾기 인덱스 생성 | 성능 최적화 |
| 0009 | `create_search_history_indexes.sql` | 검색 기록 인덱스 생성 | 성능 최적화 |
| 0010 | `create_place_stats_triggers.sql` | 장소 통계 트리거 생성 | 비즈니스 로직 |
| 0011 | `create_search_history_limit_trigger.sql` | 검색 기록 제한 트리거 | 비즈니스 로직 |
| 0012 | `seed_sample_data.sql` | 샘플 데이터 생성 | 개발용 (선택) |

## 🚀 적용 방법

### Supabase CLI 사용 (권장)

```bash
# 1. Supabase 프로젝트에 로그인
supabase login

# 2. 로컬 Supabase 연결 (이미 연결된 경우 스킵)
supabase link --project-ref YOUR_PROJECT_REF

# 3. 마이그레이션 적용
supabase db push

# 4. 적용 확인
supabase db diff
```

### Supabase Dashboard 사용

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 `SQL Editor` 선택
4. 각 마이그레이션 파일을 순서대로 복사하여 실행

## ✅ 마이그레이션 검증

### 1. 테이블 생성 확인

```sql
-- 모든 테이블 확인
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 예상 결과:
-- - favorites
-- - places
-- - reviews
-- - search_history
```

### 2. 인덱스 생성 확인

```sql
-- 모든 인덱스 확인
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 최소 14개 이상의 인덱스가 생성되어야 함
```

### 3. 트리거 확인

```sql
-- 모든 트리거 확인
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 예상 결과:
-- - trigger_places_updated_at
-- - trigger_reviews_updated_at
-- - trigger_review_insert_stats
-- - trigger_review_update_stats
-- - trigger_review_delete_stats
-- - trigger_limit_search_history
```

### 4. 제약조건 확인

```sql
-- 모든 제약조건 확인
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype;

-- contype 의미:
-- p = PRIMARY KEY
-- f = FOREIGN KEY
-- c = CHECK
-- u = UNIQUE
```

### 5. 샘플 데이터 확인

```sql
-- 장소 개수 확인
SELECT COUNT(*) AS place_count FROM public.places;

-- 리뷰 개수 확인
SELECT COUNT(*) AS review_count FROM public.reviews;

-- 장소별 통계 확인 (트리거 동작 검증)
SELECT
  name,
  category,
  average_rating,
  review_count
FROM public.places
ORDER BY review_count DESC;
```

## 🔍 테이블 구조

### places (장소)

```
- id: UUID (PK)
- name: TEXT (1~100자)
- address: TEXT
- road_address: TEXT (선택)
- category: TEXT (한식/일식/양식/중식/카페/디저트/패스트푸드/주점/뷔페/기타)
- telephone: TEXT (선택, 형식: 02-1234-5678)
- latitude: DOUBLE PRECISION (WGS84)
- longitude: DOUBLE PRECISION (WGS84)
- naver_place_id: TEXT (UNIQUE, 선택)
- naver_link: TEXT (선택)
- average_rating: DECIMAL(2,1) (0.0~5.0)
- review_count: INTEGER (≥0)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### reviews (리뷰)

```
- id: UUID (PK)
- place_id: UUID (FK → places)
- author_name: TEXT (2~10자)
- rating: INTEGER (1~5)
- content: TEXT (10~500자)
- visited_at: DATE (선택, 과거/오늘만)
- password_hash: TEXT (60자, bcrypt)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### favorites (즐겨찾기)

```
- id: UUID (PK)
- place_id: UUID (FK → places)
- user_identifier: TEXT (브라우저 UUID)
- created_at: TIMESTAMPTZ

UNIQUE: (user_identifier, place_id)
```

### search_history (검색 기록)

```
- id: UUID (PK)
- user_identifier: TEXT
- search_query: TEXT (1~100자)
- created_at: TIMESTAMPTZ

UNIQUE: (user_identifier, search_query)
최대 10개 자동 제한
```

## ⚠️ 주의사항

### 1. 프로덕션 환경

- `0012_seed_sample_data.sql`은 **개발/테스트 환경에서만** 실행하세요
- 프로덕션에서는 실제 데이터를 사용하세요

### 2. 비밀번호 해싱

- 샘플 데이터의 비밀번호는 모두 `test1234`입니다
- 실제 환경에서는 bcrypt로 해싱된 비밀번호만 저장하세요
- Salt rounds: **10**

### 3. RLS (Row Level Security)

- 현재 **모든 테이블에서 RLS가 비활성화**되어 있습니다
- 비로그인 서비스이므로 인증 없이 모든 데이터에 접근 가능합니다
- 향후 사용자 인증을 추가할 경우 RLS를 활성화하세요

### 4. 인덱스 생성 시간

- 대용량 데이터가 있는 경우 인덱스 생성에 시간이 소요될 수 있습니다
- GiST 인덱스는 B-tree보다 생성 시간이 더 걸립니다
- 부하가 적은 시간대에 실행하는 것을 권장합니다

### 5. 백업

- 마이그레이션 실행 전 **반드시 백업**을 수행하세요
- Supabase Dashboard에서 스냅샷을 생성할 수 있습니다

## 🔄 롤백 방법

### 전체 삭제 (개발 환경만!)

```sql
-- 테이블 삭제 (외래키 CASCADE로 자동 삭제)
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_place_stats_on_change() CASCADE;
DROP FUNCTION IF EXISTS update_place_stats_on_delete() CASCADE;
DROP FUNCTION IF EXISTS limit_search_history() CASCADE;
```

### 개별 테이블 삭제

```sql
-- 검색 기록만 삭제
DROP TABLE IF EXISTS public.search_history CASCADE;

-- 즐겨찾기만 삭제
DROP TABLE IF EXISTS public.favorites CASCADE;

-- 리뷰만 삭제 (장소 통계도 함께 초기화됨)
DROP TABLE IF EXISTS public.reviews CASCADE;
```

## 📊 성능 모니터링

### 슬로우 쿼리 확인

```sql
-- pg_stat_statements 확장 활성화 필요
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%places%' OR query LIKE '%reviews%'
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
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY tablename;
```

### 테이블 크기 확인

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size('public.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

## 🐛 트러블슈팅

### 에러: "relation already exists"

**원인**: 테이블이 이미 존재합니다

**해결**:
```sql
-- 기존 테이블 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 필요시 DROP 후 재생성
```

### 에러: "function does not exist"

**원인**: 공통 함수가 먼저 생성되지 않았습니다

**해결**: `0001_create_common_functions.sql`을 먼저 실행하세요

### 에러: "violates foreign key constraint"

**원인**: places 테이블이 생성되지 않았습니다

**해결**: 테이블 생성 순서를 확인하세요 (places → reviews → favorites)

### 트리거가 동작하지 않음

**확인사항**:
```sql
-- 트리거 존재 확인
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- 트리거 함수 존재 확인
SELECT proname FROM pg_proc WHERE proname LIKE '%place%' OR proname LIKE '%search%';
```

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 인덱스 가이드](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL 트리거 가이드](https://www.postgresql.org/docs/current/trigger-definition.html)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

## 📝 변경 이력

### v2.0.0 (2025-10-21)
- 12개 파일로 마이그레이션 세분화
- GiST 인덱스 추가 (위치 검색 최적화)
- 트리거 버그 수정 (DELETE 시 OLD 사용)
- CHECK 제약조건 강화
- 커버링 인덱스 추가

### v1.0.0 (2025-10-21)
- 초기 데이터베이스 설계

---

**작성일**: 2025-10-21
**문서 버전**: 2.0.0
**작성자**: Database Architect

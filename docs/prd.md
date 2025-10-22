# PRD: 맛집 지도 서비스

## 문서 정보

- **버전**: 1.0.0
- **최종 수정일**: 2025-10-21
- **작성자**: Development Team
- **문서 상태**: Draft

---

## 1. 프로덕트 개요

### 1.1 프로젝트 배경

맛집 정보를 빠르게 공유하고 탐색할 수 있는 경량화된 지도 기반 리뷰 플랫폼이 필요합니다. 기존 서비스들은 회원가입 절차가 복잡하고 필요 이상의 개인정보를 요구하는 경향이 있어, 보다 간편하고 접근성 높은 서비스를 제공하고자 합니다.

### 1.2 프로젝트 목표

1. **접근성 향상**: 비로그인으로 모든 서비스 이용 가능
2. **사용자 경험 최적화**: 지도 기반 직관적 UI/UX 제공
3. **데이터 보안**: 비밀번호 기반 리뷰 관리로 개인정보 최소화
4. **성능 최적화**: 지도 영역 기반 동적 로딩으로 빠른 응답 속도 보장
5. **모바일 우선**: 반응형 디자인으로 모바일 환경 최적화

### 1.3 핵심 가치 제안

- **Zero Friction**: 회원가입 없이 즉시 리뷰 작성 및 조회
- **Visual First**: 지도 기반 시각적 정보 탐색
- **Privacy by Design**: 최소한의 정보만 수집 (익명성 보장)
- **Fast & Responsive**: 영역 기반 로딩으로 빠른 서비스 제공

---

## 2. 타겟 사용자

### 2.1 주요 페르소나

#### 페르소나 1: 맛집 탐색가 (20-30대 직장인)
- **니즈**: 회사 근처 점심 메뉴 추천, 빠른 검색
- **페인포인트**: 회원가입 절차가 번거롭고 시간 소요
- **사용 시나리오**: 점심시간에 주변 맛집 검색 및 리뷰 확인

#### 페르소나 2: 경험 공유자 (20-40대 일반 사용자)
- **니즈**: 방문한 맛집 후기를 간편하게 남기고 싶음
- **페인포인트**: 복잡한 리뷰 작성 과정
- **사용 시나리오**: 식사 후 간단한 평점과 리뷰 작성

#### 페르소나 3: 지역 주민 (전 연령대)
- **니즈**: 자주 가는 맛집을 저장하고 관리
- **페인포인트**: 즐겨찾기 기능 부재
- **사용 시나리오**: 단골 맛집을 즐겨찾기에 추가하여 빠른 접근

---

## 3. 핵심 기능 명세

### 3.1 기능 우선순위

| 우선순위 | 기능 | MoSCoW |
|---------|------|---------|
| P0 | 지도 기반 장소 표시 및 마커 | Must |
| P0 | 장소 검색 (네이버 API) | Must |
| P0 | 리뷰 작성/조회 | Must |
| P1 | 리뷰 수정/삭제 (비밀번호 인증) | Should |
| P1 | 카테고리별 필터링 | Should |
| P1 | 즐겨찾기 기능 | Should |
| P2 | 마커 클러스터링 | Could |
| P2 | 리뷰 정렬 (최신순/평점순) | Could |
| P3 | 길찾기 연동 | Won't (v1) |
| P3 | 공유 기능 | Won't (v1) |

### 3.2 상세 기능 요구사항

#### 3.2.1 지도 및 장소 관리

**FR-MAP-001: 지도 렌더링**
- 네이버 지도 SDK를 활용한 지도 표시
- 초기 위치: 사용자 현재 위치 (권한 허용 시) 또는 서울시청
- 줌 레벨: 15 (기본값)
- 줌 컨트롤 버튼 제공 (우측 상단)

**FR-MAP-002: 마커 표시**
- 리뷰가 있는 장소에 마커 표시
- 카테고리별 아이콘 구분
  - 한식: 밥 아이콘
  - 일식: 초밥 아이콘
  - 양식: 스테이크 아이콘
  - 중식: 만두 아이콘
  - 카페/디저트: 커피 아이콘
  - 기타: 기본 핀 아이콘
- 마커 클릭 시 장소 상세 페이지로 이동

**FR-MAP-003: 영역 기반 로딩**
- 지도 이동/줌 변경 시 보이는 영역의 장소만 로드
- `idle` 이벤트 활용하여 지도 조작 완료 후 API 호출
- 로딩 중 스켈레톤 UI 표시

**FR-MAP-004: 마커 클러스터링**
- 줌 레벨이 낮을 때 근접한 마커를 그룹화
- 클러스터 클릭 시 해당 영역으로 줌인

**FR-MAP-005: 현재 위치 버튼**
- 사용자 위치로 지도 중심 이동
- 위치 권한 미허용 시 안내 메시지 표시

#### 3.2.2 장소 검색

**FR-SEARCH-001: 키워드 검색**
- 네이버 로컬 검색 API 활용
- 검색어 입력 디바운싱 (300ms)
- 검색 결과 최대 20개 표시

**FR-SEARCH-002: 검색 결과 표시**
- 장소명, 주소, 카테고리, 거리 정보 표시
- 정렬 옵션: 거리순, 평점순
- 검색 결과 클릭 시 지도 이동 및 장소 상세 페이지 열기

**FR-SEARCH-003: 최근 검색어**
- 최대 10개 저장 (로컬 스토리지)
- 검색어 개별 삭제 가능
- 최근 검색어 클릭 시 재검색

#### 3.2.3 리뷰 관리

**FR-REVIEW-001: 리뷰 작성**
- 필수 입력 항목
  - 작성자명 (2-10자)
  - 평점 (별점 1-5)
  - 리뷰 내용 (10-500자)
  - 비밀번호 (4-20자)
- 선택 입력 항목
  - 방문 날짜
- 입력값 검증 (클라이언트 + 서버)
- XSS 방지를 위한 입력값 sanitization

**FR-REVIEW-002: 리뷰 조회**
- 장소별 리뷰 목록 표시
- 무한 스크롤 페이지네이션 (20개씩)
- 정렬 옵션: 최신순, 평점순
- 빈 상태 안내 (리뷰 없음)

**FR-REVIEW-003: 리뷰 수정**
- 비밀번호 인증 후 수정 가능
- 기존 내용 자동 입력
- 작성 시점과 동일한 유효성 검증 적용

**FR-REVIEW-004: 리뷰 삭제**
- 비밀번호 인증 후 삭제 가능
- 삭제 확인 모달 표시
- 해당 장소의 리뷰가 0개가 되면 지도 마커 제거

**FR-REVIEW-005: 평점 집계**
- 장소별 평균 평점 계산 및 표시
- 리뷰 수 표시
- 평점 분포 시각화 (선택사항)

#### 3.2.4 즐겨찾기

**FR-FAVORITE-001: 즐겨찾기 추가/제거**
- 장소 상세 페이지에서 추가/제거 토글
- 로컬 스토리지에 저장
- 즐겨찾기 상태 실시간 반영

**FR-FAVORITE-002: 즐겨찾기 목록**
- 저장한 장소 리스트 표시
- 미니 지도로 장소 마커 시각화
- 장소 클릭 시 상세 페이지 이동
- 목록에서 직접 즐겨찾기 제거 가능

#### 3.2.5 카테고리 필터링

**FR-FILTER-001: 카테고리 필터**
- 지원 카테고리: 전체, 한식, 일식, 양식, 중식, 카페/디저트, 기타
- 필터바에서 카테고리 선택
- 선택한 카테고리의 마커만 지도에 표시
- 다중 선택 가능

---

## 4. 사용자 스토리

### 4.1 Epic 1: 장소 탐색

**US-001: 주변 맛집 찾기**
> As a 사용자,
> I want to 지도에서 내 주변 맛집을 볼 수 있기를,
> So that 쉽게 식사 장소를 결정할 수 있다.

**인수 조건**:
- [ ] 현재 위치 기반 지도 초기화
- [ ] 반경 1km 이내 리뷰가 있는 장소 마커 표시
- [ ] 마커 클릭 시 장소 정보 확인 가능

**US-002: 특정 장소 검색**
> As a 사용자,
> I want to 장소명이나 음식 종류로 검색할 수 있기를,
> So that 원하는 맛집을 빠르게 찾을 수 있다.

**인수 조건**:
- [ ] 검색어 입력 시 300ms 디바운싱 적용
- [ ] 검색 결과 최대 20개 표시
- [ ] 결과 클릭 시 지도 이동 및 상세 정보 표시

**US-003: 카테고리별 필터링**
> As a 사용자,
> I want to 음식 카테고리별로 장소를 필터링할 수 있기를,
> So that 원하는 종류의 음식점만 볼 수 있다.

**인수 조건**:
- [ ] 필터바에서 카테고리 선택 가능
- [ ] 선택한 카테고리의 마커만 표시
- [ ] 필터 해제 시 전체 마커 표시

### 4.2 Epic 2: 리뷰 작성 및 관리

**US-004: 리뷰 작성**
> As a 사용자,
> I want to 방문한 맛집에 리뷰를 남길 수 있기를,
> So that 내 경험을 다른 사람과 공유할 수 있다.

**인수 조건**:
- [ ] 회원가입 없이 리뷰 작성 가능
- [ ] 평점, 내용, 비밀번호 필수 입력
- [ ] 입력값 검증 및 에러 메시지 표시
- [ ] 작성 완료 시 토스트 메시지 및 상세 페이지로 이동

**US-005: 내 리뷰 수정**
> As a 사용자,
> I want to 내가 작성한 리뷰를 수정할 수 있기를,
> So that 잘못된 정보를 바로잡을 수 있다.

**인수 조건**:
- [ ] 비밀번호 인증 후 수정 가능
- [ ] 기존 내용 자동 입력
- [ ] 수정 완료 시 토스트 메시지 표시

**US-006: 내 리뷰 삭제**
> As a 사용자,
> I want to 내가 작성한 리뷰를 삭제할 수 있기를,
> So that 더 이상 필요 없는 정보를 제거할 수 있다.

**인수 조건**:
- [ ] 비밀번호 인증 후 삭제 가능
- [ ] 삭제 확인 모달 표시
- [ ] 삭제 완료 시 목록에서 즉시 제거

### 4.3 Epic 3: 즐겨찾기

**US-007: 즐겨찾기 추가**
> As a 사용자,
> I want to 자주 가는 맛집을 즐겨찾기할 수 있기를,
> So that 나중에 빠르게 찾을 수 있다.

**인수 조건**:
- [ ] 장소 상세 페이지에서 즐겨찾기 버튼 클릭
- [ ] 추가 시 토스트 메시지 표시
- [ ] 즐겨찾기 상태 즉시 반영

**US-008: 즐겨찾기 목록 관리**
> As a 사용자,
> I want to 즐겨찾기한 장소 목록을 볼 수 있기를,
> So that 저장한 맛집을 한눈에 확인할 수 있다.

**인수 조건**:
- [ ] 즐겨찾기 페이지에서 목록 표시
- [ ] 미니 지도로 장소 위치 시각화
- [ ] 장소 클릭 시 상세 페이지 이동
- [ ] 목록에서 즐겨찾기 제거 가능

---

## 5. 기술 스택

### 5.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15.1.0 | React 프레임워크 (App Router) |
| **React** | 19.0.0 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안정성 |
| **Tailwind CSS** | 4.1.13 | 스타일링 |
| **shadcn-ui** | Latest | UI 컴포넌트 |
| **@tanstack/react-query** | 5.x | 서버 상태 관리 |
| **zustand** | 4.x | 클라이언트 전역 상태 관리 |
| **react-hook-form** | 7.x | 폼 관리 |
| **zod** | 3.x | 스키마 검증 |
| **date-fns** | 4.x | 날짜 처리 |
| **lucide-react** | 0.469.0 | 아이콘 |
| **framer-motion** | 11.x | 애니메이션 |

### 5.2 백엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| **Hono** | 4.9.9 | HTTP 라우터 (Next.js API Routes) |
| **Supabase** | 2.58.0 | PostgreSQL 데이터베이스 |
| **bcrypt** | Latest | 비밀번호 해싱 |
| **ts-pattern** | 5.x | 패턴 매칭 |

### 5.3 외부 API

| 서비스 | 용도 | 인증 방식 |
|--------|------|----------|
| **네이버 지도 SDK** | 지도 렌더링 및 마커 관리 | Client ID (클라이언트) |
| **네이버 로컬 검색 API** | 장소 검색 | Client ID + Secret (서버) |

### 5.4 개발 도구

- **ESLint**: 코드 린팅
- **Prettier**: 코드 포맷팅
- **Turbopack**: 빌드 도구 (Next.js dev)
- **Git**: 버전 관리

---

## 6. 데이터 모델

### 6.1 ERD 개요

```
places (장소)
  ├── reviews (리뷰) [1:N]
  └── favorites (즐겨찾기) [1:N, 로컬 스토리지]
```

### 6.2 테이블 스키마

#### 6.2.1 places (장소)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 장소 고유 ID |
| name | text | NOT NULL | 장소명 |
| address | text | NOT NULL | 도로명 주소 |
| category | text | NOT NULL | 카테고리 (한식, 일식 등) |
| latitude | numeric(10, 7) | NOT NULL | 위도 (WGS84) |
| longitude | numeric(10, 7) | NOT NULL | 경도 (WGS84) |
| naver_place_id | text | UNIQUE | 네이버 장소 ID |
| telephone | text | NULL | 전화번호 |
| average_rating | numeric(2, 1) | DEFAULT 0 | 평균 평점 (0.0-5.0) |
| review_count | integer | DEFAULT 0 | 리뷰 수 |
| created_at | timestamptz | DEFAULT now() | 생성일시 |
| updated_at | timestamptz | DEFAULT now() | 수정일시 |

**인덱스**:
- `idx_places_location` ON (latitude, longitude) - 지리적 검색 최적화
- `idx_places_category` ON (category) - 카테고리 필터 최적화
- `idx_places_naver_place_id` ON (naver_place_id) - 네이버 ID 검색

#### 6.2.2 reviews (리뷰)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 리뷰 고유 ID |
| place_id | uuid | FK (places.id), NOT NULL | 장소 ID |
| author_name | text | NOT NULL | 작성자명 (2-10자) |
| rating | integer | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | 평점 (1-5) |
| content | text | NOT NULL | 리뷰 내용 (10-500자) |
| visit_date | date | NULL | 방문 날짜 |
| password_hash | text | NOT NULL | 비밀번호 해시 (bcrypt) |
| created_at | timestamptz | DEFAULT now() | 작성일시 |
| updated_at | timestamptz | DEFAULT now() | 수정일시 |

**인덱스**:
- `idx_reviews_place_id` ON (place_id) - 장소별 리뷰 조회 최적화
- `idx_reviews_created_at` ON (created_at DESC) - 최신순 정렬

**트리거**:
- `update_place_stats` - 리뷰 추가/수정/삭제 시 places 테이블의 average_rating, review_count 자동 갱신

#### 6.2.3 favorites (즐겨찾기) - 로컬 스토리지

로컬 스토리지에 JSON 배열로 저장:

```typescript
interface Favorite {
  placeId: string;
  placeName: string;
  category: string;
  averageRating: number;
  addedAt: string; // ISO 8601
}

// localStorage key: 'mafia-favorites'
```

**용량 제한**: 최대 100개 (초과 시 가장 오래된 항목부터 제거)

---

## 7. API 명세

### 7.1 API 설계 원칙

- RESTful API 설계
- Hono 라우터를 통한 타입 안전 API
- Zod 스키마 기반 요청/응답 검증
- 공통 응답 포맷: `{ success: boolean, data?: T, error?: { code: string, message: string } }`

### 7.2 엔드포인트 목록

#### 7.2.1 장소 (Places)

**GET /api/places**
- **설명**: 지도 영역 내 장소 목록 조회
- **쿼리 파라미터**:
  - `lat1` (number): 남서쪽 위도
  - `lng1` (number): 남서쪽 경도
  - `lat2` (number): 북동쪽 위도
  - `lng2` (number): 북동쪽 경도
  - `category` (string, optional): 카테고리 필터 (쉼표 구분)
- **응답**:
```json
{
  "success": true,
  "data": {
    "places": [
      {
        "id": "uuid",
        "name": "맛있는 한식당",
        "latitude": 37.5665,
        "longitude": 126.9780,
        "category": "한식",
        "averageRating": 4.5,
        "reviewCount": 12
      }
    ]
  }
}
```

**GET /api/places/:id**
- **설명**: 장소 상세 정보 조회
- **응답**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "맛있는 한식당",
    "address": "서울특별시 종로구 ...",
    "category": "한식",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "telephone": "02-1234-5678",
    "averageRating": 4.5,
    "reviewCount": 12,
    "createdAt": "2025-10-01T00:00:00Z"
  }
}
```

**POST /api/places**
- **설명**: 장소 생성 (리뷰 작성 시 자동 호출)
- **요청 본문**:
```json
{
  "name": "새로운 맛집",
  "address": "서울특별시 강남구 ...",
  "category": "일식",
  "latitude": 37.4979,
  "longitude": 127.0276,
  "naverPlaceId": "naver_id_123",
  "telephone": "02-9876-5432"
}
```

#### 7.2.2 리뷰 (Reviews)

**GET /api/places/:placeId/reviews**
- **설명**: 장소별 리뷰 목록 조회
- **쿼리 파라미터**:
  - `page` (number, default: 1): 페이지 번호
  - `limit` (number, default: 20): 페이지당 개수
  - `sort` (string, default: 'latest'): 정렬 기준 (latest, rating)
- **응답**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "authorName": "홍길동",
        "rating": 5,
        "content": "정말 맛있어요!",
        "visitDate": "2025-10-15",
        "createdAt": "2025-10-16T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "hasNext": true
    }
  }
}
```

**POST /api/places/:placeId/reviews**
- **설명**: 리뷰 작성
- **요청 본문**:
```json
{
  "authorName": "홍길동",
  "rating": 5,
  "content": "정말 맛있어요! 강추합니다.",
  "visitDate": "2025-10-15",
  "password": "mypassword123"
}
```

**PATCH /api/reviews/:id**
- **설명**: 리뷰 수정
- **요청 본문**:
```json
{
  "rating": 4,
  "content": "수정된 리뷰 내용",
  "visitDate": "2025-10-15",
  "password": "mypassword123"
}
```

**DELETE /api/reviews/:id**
- **설명**: 리뷰 삭제
- **요청 본문**:
```json
{
  "password": "mypassword123"
}
```

#### 7.2.3 검색 (Search)

**GET /api/search**
- **설명**: 장소 검색 (네이버 API 프록시)
- **쿼리 파라미터**:
  - `query` (string): 검색어
  - `latitude` (number, optional): 현재 위도
  - `longitude` (number, optional): 현재 경도
  - `display` (number, default: 20): 결과 개수
- **응답**:
```json
{
  "success": true,
  "data": {
    "places": [
      {
        "title": "맛있는 한식당",
        "address": "서울특별시 종로구 ...",
        "category": "한식>한정식",
        "telephone": "02-1234-5678",
        "latitude": 37.5665,
        "longitude": 126.9780,
        "naverPlaceId": "naver_id_123"
      }
    ]
  }
}
```

---

## 8. 비기능 요구사항

### 8.1 성능

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 초기 페이지 로딩 | < 2초 | Lighthouse |
| 지도 렌더링 | < 1초 | Performance API |
| API 응답 시간 | < 500ms (p95) | Server Timing |
| 마커 표시 (100개) | < 500ms | Performance API |
| 검색 디바운싱 | 300ms | 코드 상수 |

**최적화 전략**:
- 지도 영역 기반 동적 로딩
- 마커 클러스터링 (줌 레벨 < 13)
- 이미지 최적화 (Next.js Image)
- React Query 캐싱 (staleTime: 5분)
- 무한 스크롤 페이지네이션

### 8.2 보안

| 요구사항 | 구현 방법 |
|----------|----------|
| 비밀번호 보호 | bcrypt 해싱 (salt rounds: 10) |
| XSS 방지 | DOMPurify 또는 React 기본 이스케이프 |
| SQL Injection 방지 | Supabase 파라미터화된 쿼리 |
| API Rate Limiting | Hono 미들웨어 (선택사항) |
| HTTPS 강제 | Next.js 배포 환경 설정 |
| 환경변수 보호 | .env.local, 서버 전용 키 분리 |

**보안 체크리스트**:
- [ ] 비밀번호 평문 저장 금지
- [ ] 사용자 입력값 검증 (클라이언트 + 서버)
- [ ] Content Security Policy 설정
- [ ] 네이버 API 키 도메인 제한
- [ ] Supabase RLS 정책 비활성화 (비로그인 서비스)

### 8.3 접근성 (Accessibility)

| 요구사항 | WCAG 레벨 | 구현 |
|----------|-----------|------|
| 키보드 네비게이션 | A | 모든 인터랙티브 요소 포커스 가능 |
| 대체 텍스트 | A | 이미지 및 아이콘에 aria-label |
| 색상 대비 | AA | 최소 4.5:1 대비율 유지 |
| 스크린 리더 지원 | AA | ARIA 속성 적용 |
| 폼 레이블 | A | label 요소 또는 aria-labelledby |

**도구**:
- Lighthouse Accessibility 점수 > 90
- axe DevTools 검사

### 8.4 호환성

| 플랫폼 | 최소 버전 | 테스트 우선순위 |
|--------|-----------|----------------|
| Chrome | 100+ | P0 |
| Safari (iOS) | 15+ | P0 |
| Firefox | 100+ | P1 |
| Samsung Internet | 18+ | P1 |
| Edge | 100+ | P2 |

**화면 크기**:
- Mobile: 360px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### 8.5 가용성

| 지표 | 목표 |
|------|------|
| Uptime | 99.5% |
| 에러율 | < 1% |
| 복구 시간 (MTTR) | < 30분 |

**모니터링**:
- Vercel Analytics (배포 환경)
- Console 에러 로깅
- Supabase 대시보드 모니터링

---

## 9. UI/UX 가이드라인

### 9.1 디자인 원칙

1. **모바일 우선 (Mobile First)**: 작은 화면부터 설계
2. **간결함 (Simplicity)**: 불필요한 UI 요소 최소화
3. **즉각적 피드백 (Immediate Feedback)**: 모든 액션에 시각적 피드백
4. **일관성 (Consistency)**: 디자인 시스템 준수

### 9.2 컬러 팔레트

```css
/* Primary (지도 및 주요 액션) */
--primary: #3b82f6; /* Blue 500 */
--primary-hover: #2563eb; /* Blue 600 */

/* Secondary (카테고리 필터) */
--secondary: #10b981; /* Green 500 */

/* Neutral (배경 및 텍스트) */
--background: #ffffff;
--foreground: #1f2937; /* Gray 800 */
--muted: #f3f4f6; /* Gray 100 */

/* Accent (별점, 강조) */
--accent-rating: #fbbf24; /* Yellow 400 */
--accent-danger: #ef4444; /* Red 500 */
```

### 9.3 타이포그래피

| 용도 | 크기 | 가중치 | 행간 |
|------|------|--------|------|
| H1 (페이지 제목) | 2rem (32px) | 700 | 1.2 |
| H2 (섹션 제목) | 1.5rem (24px) | 600 | 1.3 |
| H3 (서브 제목) | 1.25rem (20px) | 600 | 1.4 |
| Body (본문) | 1rem (16px) | 400 | 1.5 |
| Caption (보조) | 0.875rem (14px) | 400 | 1.4 |
| Small (메타) | 0.75rem (12px) | 400 | 1.3 |

**폰트**: 시스템 폰트 스택
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
```

### 9.4 상태 표시

| 상태 | UI 패턴 |
|------|---------|
| 로딩 | 스켈레톤 UI + 스피너 |
| 성공 | 토스트 메시지 (녹색, 3초) |
| 에러 | 토스트 메시지 (빨강, 5초) |
| 빈 상태 | 일러스트 + 안내 텍스트 |
| 확인 필요 | 모달 또는 다이얼로그 |

### 9.5 인터랙션

- **터치 타겟 크기**: 최소 44x44px (Apple HIG 기준)
- **애니메이션 지속 시간**: 200-300ms (easing: ease-out)
- **스크롤 동작**: 부드러운 스크롤 (smooth scroll)
- **포커스 스타일**: 2px 파란색 외곽선

---

## 10. 페이지별 상세 명세

### 10.1 홈 (/)

**목적**: 지도 기반 맛집 탐색

**레이아웃**:
```
┌─────────────────────────────┐
│ Header (로고, 검색바)         │
├─────────────────────────────┤
│                             │
│        지도 (전체 화면)       │
│                             │
│  [필터바 - 하단 고정]         │
│  [현재 위치 버튼 - 우측 하단] │
└─────────────────────────────┘
```

**컴포넌트**:
- `Header`: 로고, 검색바, 즐겨찾기 아이콘
- `NaverMap`: 지도 렌더링 및 마커 표시
- `CategoryFilter`: 카테고리 필터 버튼 (스크롤 가능)
- `CurrentLocationButton`: 현재 위치로 이동

**상태 관리** (Zustand):
```typescript
interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedCategory: string[];
  setCenter: (center) => void;
  setZoom: (zoom) => void;
  toggleCategory: (category) => void;
}
```

### 10.2 장소 상세 (/place/[placeId])

**목적**: 장소 정보 및 리뷰 확인

**레이아웃**:
```
┌─────────────────────────────┐
│ ← 뒤로가기                   │
├─────────────────────────────┤
│ 장소명 (H1)                  │
│ 주소, 카테고리               │
│ ★★★★☆ 4.5 (리뷰 12개)      │
├─────────────────────────────┤
│ [리뷰 작성] [★ 즐겨찾기]     │
├─────────────────────────────┤
│ 리뷰 목록 (무한 스크롤)       │
│ ┌─────────────────────────┐ │
│ │ 홍길동 | ★★★★★ | 2일 전  │ │
│ │ 정말 맛있어요!           │ │
│ │ [수정] [삭제]            │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**컴포넌트**:
- `PlaceHeader`: 장소 기본 정보, 평점, 리뷰 수
- `ActionButtons`: 리뷰 작성, 즐겨찾기, 공유 버튼
- `ReviewList`: 리뷰 목록 (무한 스크롤)
- `ReviewCard`: 개별 리뷰 카드

**데이터 패칭** (React Query):
```typescript
const { data: place } = useQuery(['place', placeId], () => fetchPlace(placeId));
const { data: reviews } = useInfiniteQuery(['reviews', placeId], ({ pageParam }) =>
  fetchReviews(placeId, pageParam)
);
```

### 10.3 리뷰 작성 (/place/[placeId]/review/new)

**목적**: 새 리뷰 작성

**레이아웃**:
```
┌─────────────────────────────┐
│ ← 뒤로가기 | 리뷰 작성       │
├─────────────────────────────┤
│ [장소명 - 고정 헤더]          │
├─────────────────────────────┤
│ 작성자명 [         ]         │
│ 평점      ☆☆☆☆☆           │
│ 리뷰 내용 [                 ]│
│          [                 ]│
│ 방문 날짜 [2025-10-21]       │
│ 비밀번호 [         ]         │
│                             │
│      [작성하기]              │
└─────────────────────────────┘
```

**컴포넌트**:
- `ReviewForm`: react-hook-form + zod 검증
- `StarRating`: 별점 선택 컴포넌트
- `DatePicker`: 방문 날짜 선택

**폼 검증** (Zod):
```typescript
const reviewSchema = z.object({
  authorName: z.string().min(2).max(10),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(500),
  visitDate: z.date().optional(),
  password: z.string().min(4).max(20),
});
```

### 10.4 즐겨찾기 목록 (/my-places)

**목적**: 저장한 장소 관리

**레이아웃**:
```
┌─────────────────────────────┐
│ 즐겨찾기 (H1)                │
├─────────────────────────────┤
│ [미니 지도 - 마커 표시]       │
├─────────────────────────────┤
│ 저장한 장소 (12개)            │
│ ┌─────────────────────────┐ │
│ │ 맛있는 한식당             │ │
│ │ ★★★★☆ 4.5 | 한식       │ │
│ │         [★ 제거]        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**컴포넌트**:
- `MiniMap`: 즐겨찾기 장소 마커 표시
- `FavoriteList`: 즐겨찾기 목록
- `FavoriteCard`: 개별 즐겨찾기 카드

**상태 관리** (로컬 스토리지):
```typescript
const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('mafia-favorites');
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  const addFavorite = (place) => { /* ... */ };
  const removeFavorite = (placeId) => { /* ... */ };

  return { favorites, addFavorite, removeFavorite };
};
```

---

## 11. 제약사항 및 가정사항

### 11.1 기술적 제약사항

| 제약사항 | 영향 | 대응 방안 |
|----------|------|----------|
| 네이버 API 무료 할당량 | 일 25,000건 호출 제한 | 검색 결과 캐싱, 디바운싱 |
| 로컬 스토리지 용량 | 5-10MB 제한 | 즐겨찾기 최대 100개 제한 |
| 비로그인 서비스 | 사용자 식별 불가 | 비밀번호 기반 리뷰 관리 |
| Supabase 무료 플랜 | DB 500MB, 월 50만 Read | 인덱스 최적화, 쿼리 효율화 |

### 11.2 비즈니스 제약사항

| 제약사항 | 설명 |
|----------|------|
| 비로그인 정책 | 회원가입 및 로그인 기능 미제공 |
| 익명성 보장 | 작성자 정보 최소 수집 (이름만) |
| 무료 서비스 | 수익 모델 없음 (개인 프로젝트) |
| 한국어 전용 | 다국어 지원 없음 |

### 11.3 가정사항

| 가정 | 근거 |
|------|------|
| 사용자는 모바일 우선 접근 | 맛집 검색은 이동 중 발생 |
| 리뷰 작성자는 정직하다 | 악의적 리뷰 방지 기능 미구현 (v1) |
| 네이버 API는 안정적이다 | 대체 API 미구현 |
| 사용자는 위치 권한을 허용한다 | 거부 시 서울시청 기본 위치 제공 |
| 즐겨찾기는 로컬 저장으로 충분하다 | 서버 동기화 불필요 |

---

## 12. 성공 지표 (KPI)

### 12.1 사용자 관련 지표

| 지표 | 목표 | 측정 주기 |
|------|------|----------|
| 일일 활성 사용자 (DAU) | 100명 | 일일 |
| 월간 활성 사용자 (MAU) | 500명 | 월간 |
| 사용자 유지율 (Retention) | 30% (D7) | 주간 |
| 평균 세션 시간 | 3분 | 주간 |
| 페이지당 평균 조회수 | 5페이지 | 주간 |

### 12.2 콘텐츠 관련 지표

| 지표 | 목표 | 측정 주기 |
|------|------|----------|
| 총 리뷰 수 | 1,000개 | 월간 |
| 일일 신규 리뷰 | 10개 | 일일 |
| 리뷰가 있는 장소 수 | 200개 | 월간 |
| 평균 리뷰 길이 | 50자 이상 | 월간 |
| 리뷰 삭제율 | < 5% | 월간 |

### 12.3 기술 관련 지표

| 지표 | 목표 | 측정 도구 |
|------|------|----------|
| Lighthouse 성능 점수 | > 90 | Lighthouse |
| Core Web Vitals (LCP) | < 2.5초 | Google Analytics |
| Core Web Vitals (FID) | < 100ms | Google Analytics |
| Core Web Vitals (CLS) | < 0.1 | Google Analytics |
| 에러율 | < 1% | Sentry (선택) |
| API 평균 응답 시간 | < 300ms | Server Timing |

### 12.4 비즈니스 관련 지표

| 지표 | 목표 | 측정 주기 |
|------|------|----------|
| 검색 성공률 | > 80% | 주간 |
| 리뷰 작성 완료율 | > 70% | 주간 |
| 즐겨찾기 사용률 | > 40% | 월간 |
| 재방문율 | > 50% | 월간 |

---

## 13. 출시 계획

### 13.1 마일스톤

#### Phase 1: MVP (2주)
- [ ] 프로젝트 초기 설정 (Next.js, Supabase, Hono)
- [ ] 데이터베이스 마이그레이션 작성 및 적용
- [ ] 네이버 지도 SDK 통합
- [ ] 지도 렌더링 및 기본 마커 표시
- [ ] 장소 검색 API 구현 (네이버 로컬 API)
- [ ] 리뷰 작성/조회 기능 구현
- [ ] 기본 UI 컴포넌트 구현 (shadcn-ui)

#### Phase 2: 핵심 기능 (2주)
- [ ] 리뷰 수정/삭제 (비밀번호 인증)
- [ ] 카테고리별 마커 아이콘 구분
- [ ] 카테고리 필터링 기능
- [ ] 지도 영역 기반 동적 로딩
- [ ] 무한 스크롤 페이지네이션
- [ ] 즐겨찾기 기능 (로컬 스토리지)
- [ ] 반응형 디자인 최적화

#### Phase 3: 성능 및 UX 개선 (1주)
- [ ] 마커 클러스터링 구현
- [ ] 검색어 디바운싱 적용
- [ ] 스켈레톤 UI 추가
- [ ] 토스트 메시지 통합
- [ ] 에러 핸들링 개선
- [ ] 접근성 개선 (ARIA 속성)
- [ ] Lighthouse 점수 최적화

#### Phase 4: 테스트 및 배포 (1주)
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 디바이스 테스트
- [ ] 성능 테스트 및 최적화
- [ ] 보안 체크리스트 검증
- [ ] Vercel 배포 환경 구성
- [ ] 환경변수 설정 (프로덕션)
- [ ] 사용자 피드백 수집 준비

### 13.2 런칭 체크리스트

**개발 완료**:
- [ ] 모든 핵심 기능 구현 완료
- [ ] 주요 버그 수정 완료
- [ ] 코드 리뷰 완료

**품질 보증**:
- [ ] Lighthouse 성능 점수 > 90
- [ ] 접근성 점수 > 90
- [ ] 모바일/데스크톱 테스트 통과
- [ ] 크로스 브라우저 테스트 통과

**보안 및 인프라**:
- [ ] 환경변수 설정 (프로덕션)
- [ ] HTTPS 적용 확인
- [ ] 네이버 API 도메인 제한 설정
- [ ] Supabase 데이터베이스 백업 설정

**문서화**:
- [ ] README.md 작성
- [ ] API 문서 작성
- [ ] 배포 가이드 작성

**모니터링**:
- [ ] Vercel Analytics 활성화
- [ ] 에러 로깅 설정 (선택)
- [ ] 성능 모니터링 도구 설정

---

## 14. 리스크 및 대응 방안

### 14.1 기술적 리스크

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|----------|----------|
| 네이버 API 할당량 초과 | 높음 | 중간 | 캐싱 전략 강화, 사용자당 검색 제한 |
| 네이버 API 장애 | 높음 | 낮음 | 에러 메시지 안내, 재시도 로직 |
| Supabase 용량 초과 | 중간 | 낮음 | 인덱스 최적화, 오래된 데이터 아카이빙 |
| 마커 렌더링 성능 저하 | 중간 | 중간 | 클러스터링, 렌더링 최적화 |
| 비밀번호 분실 | 낮음 | 높음 | 안내 메시지 (비밀번호 복구 불가) |

### 14.2 비즈니스 리스크

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|----------|----------|
| 사용자 유입 부족 | 높음 | 중간 | SNS 마케팅, 친구 초대 이벤트 |
| 악의적 리뷰 작성 | 중간 | 중간 | 신고 기능 추가 (Phase 2) |
| 저작권 문제 (장소 정보) | 낮음 | 낮음 | 네이버 API 이용 약관 준수 |
| 개인정보 보호 이슈 | 중간 | 낮음 | 개인정보 처리방침 작성 |

### 14.3 운영 리스크

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|----------|----------|
| 서비스 다운타임 | 높음 | 낮음 | Vercel 모니터링, 빠른 대응 |
| 데이터 손실 | 높음 | 매우 낮음 | Supabase 자동 백업 활용 |
| 유지보수 리소스 부족 | 중간 | 중간 | 코드 문서화, 간결한 아키텍처 |

---

## 15. 향후 개선 계획 (Post-MVP)

### 15.1 Phase 2 기능

- [ ] **사용자 인증 (선택적)**: 소셜 로그인 (카카오, 구글) 추가
- [ ] **리뷰 이미지 업로드**: Supabase Storage 활용
- [ ] **리뷰 좋아요 기능**: 유용한 리뷰 표시
- [ ] **신고 기능**: 악의적 리뷰 신고 및 관리자 검토
- [ ] **알림 기능**: 즐겨찾기 장소에 새 리뷰 작성 시 알림

### 15.2 Phase 3 기능

- [ ] **길찾기 연동**: 카카오맵/네이버맵 앱 연동
- [ ] **공유 기능**: 장소 링크 공유, SNS 공유
- [ ] **통계 페이지**: 내가 작성한 리뷰 통계, 방문한 장소 수
- [ ] **추천 시스템**: 유사한 장소 추천, 인기 맛집 TOP 10
- [ ] **다국어 지원**: 영어, 일본어 번역

### 15.3 기술 부채 해소

- [ ] **테스트 코드 작성**: Jest, React Testing Library
- [ ] **E2E 테스트**: Playwright
- [ ] **성능 모니터링 강화**: Sentry, LogRocket
- [ ] **CI/CD 파이프라인**: GitHub Actions
- [ ] **컴포넌트 문서화**: Storybook

---

## 16. 참고 자료

### 16.1 외부 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Hono 공식 문서](https://hono.dev/)
- [네이버 지도 API](https://navermaps.github.io/maps.js.ncp/)
- [네이버 로컬 검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [shadcn-ui 공식 문서](https://ui.shadcn.com/)

### 16.2 내부 문서

- [요구사항 명세서](/docs/requirement.md)
- [네이버 지도 연동 가이드](/docs/external/naver-map.md)
- [네이버 검색 연동 가이드](/docs/external/naver-search.md)
- [아키텍처 가이드라인](/CLAUDE.md)

### 16.3 디자인 참고

- [Airbnb](https://www.airbnb.co.kr/) - 지도 기반 탐색
- [망고플레이트](https://www.mangoplate.com/) - 맛집 리뷰
- [카카오맵](https://map.kakao.com/) - 지도 UI/UX

---

## 17. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-10-21 | Development Team | 초안 작성 |

---

## 18. 승인

| 역할 | 이름 | 승인 일자 | 서명 |
|------|------|----------|------|
| 프로덕트 오너 | - | - | - |
| 개발 리드 | - | - | - |
| 디자인 리드 | - | - | - |

---

**문서 끝**

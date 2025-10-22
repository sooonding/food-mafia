# 즐겨찾기 목록 페이지 구현 계획

## 문서 정보

- **버전**: 1.0.0
- **작성일**: 2025-10-22
- **페이지 경로**: `/my-places`
- **우선순위**: P1 (Should Have)

---

## 1. 개요

### 1.1 페이지 목적

사용자가 즐겨찾기에 추가한 장소 목록을 조회하고 관리하는 페이지입니다. 로컬 스토리지 기반으로 동작하며, 미니 지도에 마커를 표시하고 장소 카드 리스트로 정보를 제공합니다.

### 1.2 주요 기능

1. **즐겨찾기 목록 조회**: 로컬 스토리지에서 저장된 장소 목록 로드
2. **미니 지도 표시**: 즐겨찾기 장소들의 위치를 지도에 마커로 시각화
3. **장소 카드 리스트**: 각 장소의 상세 정보를 카드 형태로 표시
4. **즐겨찾기 제거**: 목록에서 직접 즐겨찾기 제거 가능
5. **장소 상세 이동**: 장소 카드 또는 마커 클릭 시 상세 페이지로 이동

### 1.3 관련 문서

- [PRD - 섹션 10.4 즐겨찾기 목록](/docs/prd.md)
- [사용자 플로우 - 섹션 5 즐겨찾기](/docs/userflow.md)
- [유스케이스 - UC-PLACE-004](/docs/usecases/place-management.md)
- [공통 모듈 - useFavorites](/docs/common-modules.md)

---

## 2. 페이지 구조

### 2.1 레이아웃

```
┌─────────────────────────────┐
│ ← 뒤로가기 | 즐겨찾기          │ (헤더)
├─────────────────────────────┤
│ 저장한 장소 (12개)           │ (카운터)
├─────────────────────────────┤
│                             │
│   [미니 지도 - 마커 표시]    │ (지도 섹션)
│                             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 맛있는 한식당             │ │
│ │ 서울특별시 종로구...      │ │ (장소 카드)
│ │ ★★★★☆ 4.5 | 한식       │ │
│ │         [★ 제거]        │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 신선한 초밥집            │ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 2.2 반응형 레이아웃

#### 모바일 (< 768px)
- 미니 지도와 장소 리스트를 수직 배치
- 미니 지도 높이: 300px
- 장소 카드는 전체 너비 사용

#### 태블릿/데스크톱 (≥ 768px)
- 미니 지도(좌측 40%)와 장소 리스트(우측 60%)를 수평 배치
- 미니 지도는 고정 높이 또는 뷰포트 높이 기준
- 장소 리스트는 스크롤 가능

---

## 3. 컴포넌트 설계

### 3.1 페이지 컴포넌트

**파일 경로**: `src/app/my-places/page.tsx`

**책임**:
- 페이지 전체 레이아웃 구성
- 즐겨찾기 데이터 로드 및 상태 관리
- 하위 컴포넌트 조합

**상태 관리**:
```typescript
// useFavorites 훅 사용 (이미 구현됨)
const { favorites, removeFavorite } = useFavorites();

// 로딩 상태
const [isLoading, setIsLoading] = useState(true);

// 장소 상세 정보 (API 조회 결과)
const [placesData, setPlacesData] = useState<Map<string, Place>>(new Map());
```

**주요 로직**:
1. 로컬 스토리지에서 즐겨찾기 목록 로드
2. 각 장소의 최신 정보를 API로 조회 (병렬 처리)
3. 조회된 데이터와 로컬 스토리지 데이터 병합
4. 로딩 완료 후 UI 렌더링

**Props**: 없음 (페이지 컴포넌트)

**구현 우선순위**: P0 (최우선)

---

### 3.2 미니 지도 컴포넌트

**파일 경로**: `src/app/my-places/_components/FavoritesMap.tsx`

**책임**:
- 즐겨찾기 장소들의 위치를 지도에 마커로 표시
- 지도 범위를 모든 마커를 포함하도록 자동 조정
- 마커 클릭 시 장소 상세 페이지로 이동

**Props**:
```typescript
interface FavoritesMapProps {
  favorites: Favorite[];
  onMarkerClick: (placeId: string) => void;
  className?: string;
}
```

**주요 로직**:
1. 네이버 지도 SDK 초기화
2. 즐겨찾기 목록의 위도/경도로 마커 생성
3. 카테고리별 아이콘 적용 (CATEGORY_ICONS 사용)
4. 모든 마커를 포함하는 bounds 계산 및 지도 범위 설정
5. 마커 클릭 이벤트 핸들링

**의존성**:
- `@/constants/map` (CATEGORY_ICONS, MAP_CONFIG)
- 네이버 지도 SDK (`window.naver.maps`)

**특이사항**:
- 즐겨찾기가 1개일 경우 해당 위치로 중심 이동 (zoom: 15)
- 즐겨찾기가 0개일 경우 서울시청 기본 위치 표시
- 마커 클러스터링은 적용하지 않음 (최대 100개 제한)

**구현 우선순위**: P0 (최우선)

---

### 3.3 장소 카드 컴포넌트

**파일 경로**: `src/app/my-places/_components/FavoriteCard.tsx`

**책임**:
- 개별 장소의 정보를 카드 형태로 표시
- 즐겨찾기 제거 버튼 제공
- 카드 클릭 시 장소 상세 페이지로 이동

**Props**:
```typescript
interface FavoriteCardProps {
  favorite: Favorite;
  placeData?: Place; // API에서 조회한 최신 데이터 (선택)
  onRemove: (placeId: string) => void;
  onCardClick: (placeId: string) => void;
}
```

**카드 구성 요소**:
1. **장소명** (H3, font-semibold)
2. **주소** (텍스트, text-gray-600)
3. **카테고리 태그** (뱃지 형태, 카테고리 색상 적용)
4. **평균 평점** (별점 시각화 + 숫자)
5. **리뷰 수** (예: "리뷰 12개")
6. **즐겨찾기 제거 버튼** (우측 상단 고정, 별 아이콘 또는 X 아이콘)

**상호작용**:
- 카드 전체 영역 클릭 시: `onCardClick` 호출 (장소 상세 페이지로 이동)
- 즐겨찾기 제거 버튼 클릭 시: `onRemove` 호출, 이벤트 전파 중지 (stopPropagation)

**스타일링**:
- Tailwind CSS 사용
- 호버 시 border 색상 변경 및 shadow 추가
- 터치 친화적 크기 (최소 높이 120px)

**구현 우선순위**: P0 (최우선)

---

### 3.4 빈 상태 컴포넌트

**파일 경로**: `src/components/common/EmptyState.tsx` (공통 컴포넌트 재사용)

**책임**:
- 즐겨찾기 목록이 비어있을 때 안내 메시지 표시
- 홈으로 이동 버튼 제공

**사용 방식**:
```tsx
<EmptyState
  icon={Heart}
  title="아직 즐겨찾기한 장소가 없습니다"
  description="마음에 드는 맛집을 찾아 즐겨찾기에 추가해보세요!"
  action={
    <Button onClick={() => router.push('/')}>
      홈으로 이동
    </Button>
  }
/>
```

**구현 우선순위**: P0 (이미 구현됨, 재사용만 필요)

---

### 3.5 로딩 스켈레톤 컴포넌트

**파일 경로**: `src/app/my-places/_components/FavoritesSkeleton.tsx`

**책임**:
- 데이터 로딩 중 스켈레톤 UI 표시

**구성**:
- 미니 지도 영역 스켈레톤 (회색 박스)
- 장소 카드 스켈레톤 3개 (기본)

**구현 우선순위**: P1 (Should Have)

---

## 4. 데이터 흐름

### 4.1 데이터 소스

1. **로컬 스토리지**: `mafia-favorites` 키
   - 즐겨찾기한 장소의 기본 정보 (placeId, placeName, category, averageRating, latitude, longitude, addedAt)

2. **API 조회**: `/api/places/:placeId`
   - 각 장소의 최신 정보 (평균 평점, 리뷰 수 업데이트)

### 4.2 데이터 로딩 플로우

```
1. 페이지 진입
   ↓
2. useFavorites 훅으로 로컬 스토리지 로드
   ↓
3. favorites 배열 획득 (placeId, placeName 등)
   ↓
4. 각 placeId에 대해 병렬로 API 호출 (Promise.allSettled 사용)
   ↓
5. 성공한 API 응답 데이터를 Map<placeId, Place>에 저장
   ↓
6. 실패한 API 응답은 로컬 스토리지 캐시 데이터 사용
   ↓
7. 로딩 완료, UI 렌더링
```

### 4.3 API 호출 최적화

**병렬 처리**:
```typescript
const fetchPlacesData = async (favorites: Favorite[]) => {
  const promises = favorites.map(fav =>
    fetch(`/api/places/${fav.placeId}`)
      .then(res => res.json())
      .catch(err => ({ placeId: fav.placeId, error: err }))
  );

  const results = await Promise.allSettled(promises);

  const placesMap = new Map<string, Place>();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      placesMap.set(favorites[index].placeId, result.value.data);
    }
  });

  return placesMap;
};
```

**에러 처리**:
- 일부 API 실패: 로컬 스토리지 캐시 데이터 사용, 경고 토스트 표시
- 전체 API 실패: 로컬 스토리지 캐시 데이터만 표시, 재시도 버튼 제공

---

## 5. 상태 관리

### 5.1 로컬 상태 (useState)

```typescript
// 즐겨찾기 목록 (useFavorites 훅에서 제공)
const { favorites, removeFavorite, isFavorite } = useFavorites();

// API 조회 결과
const [placesData, setPlacesData] = useState<Map<string, Place>>(new Map());

// 로딩 상태
const [isLoading, setIsLoading] = useState(true);

// 에러 상태
const [error, setError] = useState<string | null>(null);
```

### 5.2 즐겨찾기 제거 로직

```typescript
const handleRemoveFavorite = useCallback((placeId: string) => {
  // 확인 다이얼로그 표시 (선택 사항)
  const confirmed = window.confirm('이 장소를 즐겨찾기에서 제거하시겠습니까?');

  if (confirmed) {
    removeFavorite(placeId); // useFavorites 훅의 removeFavorite 호출
    toast.success('즐겨찾기에서 제거되었습니다');
  }
}, [removeFavorite]);
```

---

## 6. API 인터페이스

### 6.1 장소 상세 조회

**엔드포인트**: `GET /api/places/:placeId`

**응답**:
```typescript
{
  success: true;
  data: {
    id: string;
    name: string;
    address: string;
    roadAddress: string | null;
    category: string;
    latitude: number;
    longitude: number;
    telephone: string | null;
    averageRating: number;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
  }
}
```

**에러 응답**:
```typescript
{
  success: false;
  error: {
    code: 'PLACE_NOT_FOUND' | 'SERVER_ERROR' | 'NETWORK_ERROR';
    message: string;
  }
}
```

---

## 7. 라우팅 및 네비게이션

### 7.1 페이지 경로

- **즐겨찾기 목록 페이지**: `/my-places`

### 7.2 네비게이션 흐름

1. **헤더에서 진입**: 헤더의 "즐겨찾기" 메뉴 또는 아이콘 클릭
2. **장소 카드 클릭**: `/place/[placeId]`로 이동
3. **미니 지도 마커 클릭**: `/place/[placeId]`로 이동
4. **뒤로가기 버튼**: 이전 페이지로 복귀 (router.back())

### 7.3 라우터 사용

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// 장소 상세 페이지로 이동
const handleCardClick = (placeId: string) => {
  router.push(`/place/${placeId}`);
};

// 뒤로가기
const handleBackClick = () => {
  router.back();
};
```

---

## 8. 스타일링 가이드

### 8.1 컬러 팔레트

```css
/* 배경 */
--background: #ffffff;
--background-secondary: #f3f4f6; /* Gray 100 */

/* 텍스트 */
--text-primary: #1f2937; /* Gray 800 */
--text-secondary: #6b7280; /* Gray 500 */

/* 별점 */
--accent-rating: #fbbf24; /* Yellow 400 */

/* 버튼 */
--danger: #ef4444; /* Red 500 - 제거 버튼 */
--danger-hover: #dc2626; /* Red 600 */
```

### 8.2 카테고리 색상 (뱃지)

`CATEGORY_COLORS` 상수 사용:
```typescript
import { CATEGORY_COLORS } from '@/constants/map';

const categoryColor = CATEGORY_COLORS[favorite.category];
```

### 8.3 반응형 브레이크포인트

```css
/* 모바일 */
@media (max-width: 767px) {
  /* 수직 배치 */
}

/* 태블릿/데스크톱 */
@media (min-width: 768px) {
  /* 수평 배치 */
}
```

---

## 9. 에러 처리

### 9.1 에러 유형 및 처리 방안

| 에러 유형 | 발생 시점 | 처리 방안 |
|-----------|----------|----------|
| 로컬 스토리지 비지원 | 페이지 진입 | 에러 토스트 + 빈 상태 UI |
| 로컬 스토리지 데이터 손상 | 데이터 로드 시 | 로컬 스토리지 초기화, 경고 토스트 |
| 장소 정보 조회 실패 (일부) | API 호출 시 | 캐시 데이터 사용, 경고 토스트 |
| 장소 정보 조회 실패 (전체) | API 호출 시 | 캐시 데이터 사용, 재시도 버튼 |
| 장소가 삭제됨 (404) | API 호출 시 | 즐겨찾기에서 자동 제거, 안내 토스트 |

### 9.2 토스트 메시지

```typescript
// 성공
toast.success('즐겨찾기에서 제거되었습니다');

// 경고
toast.warning('일부 장소 정보를 불러올 수 없습니다. 캐시된 정보로 표시됩니다');

// 에러
toast.error('네트워크 연결을 확인해주세요');
```

---

## 10. 접근성 (Accessibility)

### 10.1 키보드 네비게이션

- 장소 카드는 `<button>` 또는 `tabIndex={0}` 적용
- 즐겨찾기 제거 버튼은 독립적으로 포커스 가능
- Tab 키로 순차적 네비게이션 지원

### 10.2 ARIA 속성

```tsx
// 미니 지도
<div role="region" aria-label="즐겨찾기 장소 지도">
  {/* 지도 컴포넌트 */}
</div>

// 장소 카드 리스트
<div role="list" aria-label="즐겨찾기 장소 목록">
  {favorites.map(fav => (
    <div role="listitem" key={fav.placeId}>
      {/* 카드 내용 */}
    </div>
  ))}
</div>

// 제거 버튼
<button
  aria-label={`${favorite.placeName} 즐겨찾기 제거`}
  onClick={handleRemove}
>
  <X aria-hidden="true" />
</button>
```

### 10.3 스크린 리더 지원

- 빈 상태 안내 메시지는 명확한 텍스트 제공
- 별점은 시각적 표현과 함께 숫자 표시 (예: "평점 4.5")
- 로딩 중에는 `aria-live="polite"` 영역에 상태 안내

---

## 11. 성능 최적화

### 11.1 최적화 전략

1. **병렬 API 호출**: `Promise.allSettled`로 모든 장소 정보 동시 조회
2. **메모이제이션**: `useMemo`로 지도 마커 데이터 캐싱
3. **이벤트 핸들러 최적화**: `useCallback`으로 함수 재생성 방지
4. **조건부 렌더링**: 로딩/에러/빈 상태에 따라 필요한 컴포넌트만 렌더링

### 11.2 메모이제이션 예시

```typescript
// 미니 지도에 전달할 마커 데이터
const markerData = useMemo(() => {
  return favorites.map(fav => ({
    id: fav.placeId,
    latitude: fav.latitude,
    longitude: fav.longitude,
    category: fav.category,
    name: fav.placeName,
  }));
}, [favorites]);
```

### 11.3 성능 목표

- 페이지 초기 로딩: < 2초
- 미니 지도 렌더링: < 1초
- API 병렬 호출 완료: < 1.5초 (최대 100개)

---

## 12. 테스트 시나리오

### 12.1 기능 테스트

| 시나리오 | 사전 조건 | 입력 | 예상 결과 |
|----------|----------|------|----------|
| 정상적인 목록 조회 | 즐겨찾기 5개 | 페이지 진입 | 5개 카드 표시, 미니 지도에 5개 마커 |
| 빈 목록 조회 | 즐겨찾기 0개 | 페이지 진입 | 빈 상태 UI, 홈으로 이동 버튼 |
| 장소 카드 클릭 | 즐겨찾기 5개 | 첫 번째 카드 클릭 | 장소 상세 페이지로 이동 |
| 미니 지도 마커 클릭 | 즐겨찾기 5개 | 마커 클릭 | 장소 상세 페이지로 이동 |
| 즐겨찾기 제거 | 즐겨찾기 5개 | 제거 버튼 클릭 | 카드 제거, 목록 4개로 감소 |
| 마지막 항목 제거 | 즐겨찾기 1개 | 제거 버튼 클릭 | 빈 상태 UI 표시 |
| 장소 정보 조회 실패 (일부) | 일부 장소 삭제됨 | 페이지 진입 | 캐시 데이터 표시, 경고 토스트 |
| 장소 정보 조회 실패 (전체) | 네트워크 단절 | 페이지 진입 | 캐시 데이터 표시, 재시도 버튼 |

### 12.2 반응형 테스트

- 모바일 (375px): 수직 배치, 미니 지도 높이 300px
- 태블릿 (768px): 수평 배치, 지도 40% + 리스트 60%
- 데스크톱 (1024px): 수평 배치, 지도 40% + 리스트 60%

---

## 13. 구현 순서 및 체크리스트

### Phase 1: 기본 구조 (2시간)

- [ ] 페이지 파일 생성 (`src/app/my-places/page.tsx`)
- [ ] 기본 레이아웃 구성 (헤더, 카운터, 컨테이너)
- [ ] useFavorites 훅 연동
- [ ] 빈 상태 UI 구현

### Phase 2: 장소 카드 컴포넌트 (2시간)

- [ ] FavoriteCard 컴포넌트 생성
- [ ] 카드 UI 구현 (장소명, 주소, 카테고리, 평점, 리뷰 수)
- [ ] 즐겨찾기 제거 버튼 추가
- [ ] 카드 클릭 이벤트 핸들링

### Phase 3: API 연동 (2시간)

- [ ] 장소 정보 API 호출 로직 구현
- [ ] 병렬 API 호출 (`Promise.allSettled`)
- [ ] 에러 처리 (일부 실패, 전체 실패)
- [ ] 로딩 상태 관리 및 스켈레톤 UI

### Phase 4: 미니 지도 구현 (3시간)

- [ ] FavoritesMap 컴포넌트 생성
- [ ] 네이버 지도 SDK 초기화
- [ ] 마커 생성 및 카테고리별 아이콘 적용
- [ ] 지도 범위 자동 조정 (bounds)
- [ ] 마커 클릭 이벤트 핸들링

### Phase 5: 반응형 레이아웃 (1시간)

- [ ] 모바일 레이아웃 구현 (수직 배치)
- [ ] 태블릿/데스크톱 레이아웃 구현 (수평 배치)
- [ ] CSS 미디어 쿼리 적용

### Phase 6: 에러 처리 및 토스트 (1시간)

- [ ] 로컬 스토리지 에러 처리
- [ ] API 에러 처리 및 토스트 메시지
- [ ] 삭제된 장소 자동 제거 로직

### Phase 7: 접근성 및 최적화 (1시간)

- [ ] ARIA 속성 추가
- [ ] 키보드 네비게이션 테스트
- [ ] 메모이제이션 적용 (`useMemo`, `useCallback`)
- [ ] 성능 측정 및 최적화

### Phase 8: 테스트 및 QA (1시간)

- [ ] 기능 테스트 (모든 시나리오)
- [ ] 반응형 테스트 (모바일/태블릿/데스크톱)
- [ ] 접근성 테스트 (키보드, 스크린 리더)
- [ ] 버그 수정 및 리팩토링

**총 예상 시간**: 약 13시간

---

## 14. 제약사항 및 주의사항

### 14.1 기술적 제약사항

1. **로컬 스토리지 의존성**
   - 로컬 스토리지가 비활성화된 경우 기능 동작 불가
   - 사용자에게 명확한 에러 메시지 제공 필요

2. **최대 100개 제한**
   - useFavorites 훅에서 자동으로 관리됨
   - 100개 초과 시 가장 오래된 항목 자동 제거

3. **네이버 지도 SDK 의존성**
   - 네이버 지도 API 키 필요
   - SDK 로딩 실패 시 지도 영역 에러 처리

### 14.2 주의사항

1. **데이터 동기화**
   - 로컬 스토리지와 API 응답 데이터의 불일치 가능성
   - API 조회 실패 시 로컬 스토리지 캐시 데이터 사용

2. **삭제된 장소 처리**
   - 장소가 DB에서 삭제된 경우 (404) 즐겨찾기에서 자동 제거
   - 사용자에게 안내 토스트 메시지 표시

3. **이벤트 전파 방지**
   - 즐겨찾기 제거 버튼 클릭 시 카드 클릭 이벤트 전파되지 않도록 `stopPropagation` 필수

4. **성능**
   - 즐겨찾기가 많을 경우 (50개 이상) 병렬 API 호출 지연 가능
   - 로딩 상태를 명확히 표시하여 사용자 경험 유지

---

## 15. 참고 자료

### 15.1 관련 코드

- `src/hooks/useFavorites.ts`: 즐겨찾기 상태 관리 훅 (이미 구현됨)
- `src/types/favorite.ts`: Favorite 타입 정의 (이미 구현됨)
- `src/constants/favorite.ts`: 즐겨찾기 설정 상수 (이미 구현됨)
- `src/constants/map.ts`: 지도 및 카테고리 상수 (이미 구현됨)

### 15.2 외부 문서

- [네이버 지도 API 문서](https://navermaps.github.io/maps.js.ncp/)
- [Next.js 공식 문서 - App Router](https://nextjs.org/docs/app)
- [React Query 공식 문서](https://tanstack.com/query/latest)

---

## 16. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-10-22 | Development Team | 초안 작성 - 즐겨찾기 목록 페이지 구현 계획 |

---

**문서 끝**

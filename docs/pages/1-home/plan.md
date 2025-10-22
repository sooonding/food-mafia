# 홈 페이지 (/) 구현 계획

## 문서 정보

- **버전**: 1.0.0
- **최종 수정일**: 2025-10-22
- **작성자**: Development Team
- **문서 상태**: Draft
- **페이지 경로**: `/` (홈)

---

## 1. 개요

### 1.1 페이지 목적

홈 페이지는 맛집 지도 서비스의 메인 진입점으로, 사용자가 지도를 통해 시각적으로 맛집을 탐색하고 검색할 수 있는 핵심 페이지입니다.

### 1.2 주요 기능

1. **네이버 지도 렌더링**: 네이버 지도 SDK를 활용한 인터랙티브 지도
2. **장소 마커 표시**: 리뷰가 있는 장소를 카테고리별 아이콘으로 표시
3. **검색 기능**: 장소명/음식 종류로 검색 (네이버 로컬 API)
4. **카테고리 필터**: 음식 카테고리별 장소 필터링
5. **현재 위치**: 사용자 현재 위치로 지도 이동
6. **영역 기반 로딩**: 지도 이동 시 보이는 영역의 장소만 동적 로딩

### 1.3 참조 문서

- [PRD - 홈 페이지 요구사항](/docs/prd.md#101-홈-)
- [사용자 플로우 - 홈 페이지](/docs/userflow.md#1-홈-페이지-)
- [유스케이스 - 지도 기능](/docs/usecases/map-features.md)
- [유스케이스 - 검색 및 탐색](/docs/usecases/search-and-exploration.md)
- [공통 모듈 문서](/docs/common-modules.md)

---

## 2. 화면 구성

### 2.1 레이아웃 구조

```
┌─────────────────────────────────────────┐
│ Header (고정)                            │
│  - 로고                                  │
│  - 검색바 (클릭 시 검색 모달)            │
│  - 즐겨찾기 아이콘                       │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│        지도 영역 (전체 화면)             │
│                                         │
│    [마커들 - 카테고리별 아이콘]          │
│                                         │
│                                         │
│  [현재 위치 버튼 - 우측 하단 플로팅]     │
├─────────────────────────────────────────┤
│ 카테고리 필터바 (하단 고정, 스크롤 가능) │
│  [전체] [한식] [일식] [양식] [중식] ... │
└─────────────────────────────────────────┘
```

### 2.2 반응형 디자인

#### 모바일 (< 768px)
- 헤더 높이: 56px
- 검색바: 전체 너비 (padding 고려)
- 즐겨찾기 아이콘: 우측 상단 (40x40px)
- 필터바: 하단 고정, 스크롤 가능 (높이 60px)
- 현재 위치 버튼: 우측 하단 (56x56px, 필터바 위)

#### 태블릿/데스크톱 (≥ 768px)
- 헤더 높이: 64px
- 검색바: 최대 너비 600px (중앙 정렬)
- 필터바: 중앙 정렬, 스크롤 가능
- 현재 위치 버튼: 우측 하단 (64x64px)

---

## 3. 컴포넌트 구조

### 3.1 페이지 컴포넌트

**파일 경로**: `src/app/page.tsx`

**역할**: 홈 페이지 루트 컴포넌트

**구현 내용**:
```typescript
'use client';

import { Header } from '@/components/layout/Header';
import { NaverMap } from '@/components/map/NaverMap';
import { CategoryFilter } from '@/components/map/CategoryFilter';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { SearchModal } from '@/components/search/SearchModal';
import { useMapStore } from '@/hooks/useMapStore';
import { useState } from 'react';

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      <div className="flex-1 relative">
        <NaverMap />
        <CurrentLocationButton />
      </div>

      <CategoryFilter />

      <SearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
```

**의존성**:
- 공통 훅: `useMapStore`
- 레이아웃 컴포넌트: `Header`
- 지도 컴포넌트: `NaverMap`, `CategoryFilter`, `CurrentLocationButton`
- 검색 컴포넌트: `SearchModal`

---

### 3.2 Header 컴포넌트

**파일 경로**: `src/components/layout/Header.tsx`

**역할**: 로고, 검색바, 즐겨찾기 아이콘을 포함한 헤더

**Props**:
```typescript
interface HeaderProps {
  onSearchClick: () => void;
}
```

**구현 내용**:
- 로고 (좌측): 클릭 시 홈으로 이동
- 검색바 (중앙): 클릭 시 `onSearchClick` 콜백 호출
- 즐겨찾기 아이콘 (우측): `/my-places` 페이지로 이동

**디자인**:
- 배경색: white
- 그림자: shadow-sm
- 고정: sticky top-0
- z-index: 50

---

### 3.3 NaverMap 컴포넌트

**파일 경로**: `src/components/map/NaverMap.tsx`

**역할**: 네이버 지도 SDK를 래핑한 메인 지도 컴포넌트

**구현 내용**:

1. **지도 초기화**
   - 네이버 지도 SDK 스크립트 동적 로딩
   - 초기 중심점: 사용자 현재 위치 또는 서울시청 (MAP_CONFIG.DEFAULT_CENTER)
   - 초기 줌 레벨: 15 (MAP_CONFIG.DEFAULT_ZOOM)
   - 지도 옵션:
     - `mapTypeControl`: false (지도 타입 컨트롤 숨김)
     - `scaleControl`: true (스케일 표시)
     - `logoControl`: true (네이버 로고 표시)
     - `zoomControl`: true (줌 컨트롤 표시, 우측 상단)

2. **위치 권한 요청**
   - 페이지 로드 시 자동으로 위치 권한 요청
   - 허용 시: 현재 위치를 지도 중심으로 설정
   - 거부 시: 기본 위치(서울시청) 사용, 토스트 메시지 표시

3. **마커 렌더링**
   - React Query로 장소 데이터 페칭
   - 현재 지도 영역(bounds) 계산
   - `GET /api/places?lat1=...&lng1=...&lat2=...&lng2=...&category=...` API 호출
   - 카테고리별 마커 아이콘 렌더링
   - 마커 클릭 시 `/place/[placeId]` 페이지로 이동

4. **영역 기반 동적 로딩**
   - 지도 `idle` 이벤트 감지 (드래그/줌 완료 시)
   - 디바운싱 적용 (300ms)
   - 새로운 영역의 장소 데이터 요청
   - 기존 마커 제거 후 새 마커 렌더링

5. **카테고리 필터 연동**
   - `useMapStore`의 `selectedCategories` 구독
   - 필터 변경 시 마커 재렌더링

**상태 관리**:
```typescript
// 로컬 상태
const [map, setMap] = useState<naver.maps.Map | null>(null);
const [markers, setMarkers] = useState<naver.maps.Marker[]>([]);
const [bounds, setBounds] = useState<MapBounds | null>(null);

// Zustand 스토어 (전역 상태)
const { center, zoom, selectedCategories, setCenter, setZoom } = useMapStore();
```

**데이터 페칭** (React Query):
```typescript
const { data: places, isLoading } = useQuery({
  queryKey: queryKeys.places.list(
    `${bounds?.sw.lat},${bounds?.sw.lng},${bounds?.ne.lat},${bounds?.ne.lng}`,
    selectedCategories.join(',')
  ),
  queryFn: () => fetchPlacesByBounds(bounds!, selectedCategories),
  enabled: !!bounds,
  staleTime: 5 * 60 * 1000, // 5분
});
```

**에러 처리**:
- 지도 SDK 로드 실패: 에러 페이지 표시
- 위치 권한 거부: 토스트 메시지, 기본 위치 사용
- API 호출 실패: 토스트 메시지, 재시도 버튼 제공

---

### 3.4 MapMarker 컴포넌트

**파일 경로**: `src/components/map/MapMarker.tsx`

**역할**: 개별 장소 마커 렌더링 및 인터랙션 관리

**Props**:
```typescript
interface MapMarkerProps {
  map: naver.maps.Map;
  place: PlaceMarker;
  onClick: (placeId: string) => void;
}
```

**구현 내용**:
- 카테고리별 아이콘 선택 (`getCategoryIcon` 유틸 사용)
- 마커 생성 및 지도에 추가
- 호버 시 장소명 툴팁 표시
- 클릭 시 `onClick` 콜백 호출
- 컴포넌트 언마운트 시 마커 제거

**마커 옵션**:
```typescript
const marker = new naver.maps.Marker({
  position: new naver.maps.LatLng(place.latitude, place.longitude),
  map,
  icon: {
    content: `<div class="marker-icon">${getCategoryIcon(place.category)}</div>`,
    size: new naver.maps.Size(32, 32),
    anchor: new naver.maps.Point(16, 32),
  },
  title: place.name,
  zIndex: Math.round(place.averageRating * 10), // 평점 높은 순으로 위에 표시
});
```

---

### 3.5 CategoryFilter 컴포넌트

**파일 경로**: `src/components/map/CategoryFilter.tsx`

**역할**: 카테고리 필터 UI 및 상태 관리

**구현 내용**:
- 모든 카테고리 버튼 렌더링 (`getAllCategories` 유틸 사용)
- 선택된 카테고리 강조 표시
- 다중 선택 지원 (토글 방식)
- "전체" 버튼: 모든 필터 해제
- 가로 스크롤 가능

**상태 관리**:
```typescript
const { selectedCategories, toggleCategory, clearCategories } = useMapStore();

const handleCategoryClick = (category: FoodCategory) => {
  toggleCategory(category);
};

const handleAllClick = () => {
  clearCategories();
};
```

**디자인**:
- 하단 고정: `fixed bottom-0 left-0 right-0`
- 배경: white
- 그림자: shadow-lg
- 패딩: p-4
- 가로 스크롤: `overflow-x-auto whitespace-nowrap`
- 버튼 스타일:
  - 기본: `bg-gray-100 text-gray-700`
  - 선택: `bg-primary text-white`
  - 크기: `px-4 py-2 rounded-full`
  - 아이콘 + 텍스트

---

### 3.6 CurrentLocationButton 컴포넌트

**파일 경로**: `src/components/map/CurrentLocationButton.tsx`

**역할**: 현재 위치로 지도 이동 버튼

**구현 내용**:

1. **버튼 클릭 시 플로우**
   ```typescript
   const handleClick = async () => {
     setIsLoading(true);

     try {
       // 1. 위치 권한 확인
       const permission = await navigator.permissions.query({ name: 'geolocation' });

       if (permission.state === 'denied') {
         toast.error('위치 권한이 필요합니다');
         return;
       }

       // 2. 현재 위치 획득
       const position = await getCurrentPosition();
       const { latitude, longitude } = position.coords;

       // 3. 지도 이동
       setCenter({ lat: latitude, lng: longitude });
       setCurrentLocation({ lat: latitude, lng: longitude });
       setZoom(15);

       toast.success('현재 위치로 이동했습니다');
     } catch (error) {
       toast.error('위치를 가져올 수 없습니다');
     } finally {
       setIsLoading(false);
     }
   };
   ```

2. **위치 획득 함수**
   ```typescript
   const getCurrentPosition = (): Promise<GeolocationPosition> => {
     return new Promise((resolve, reject) => {
       navigator.geolocation.getCurrentPosition(
         resolve,
         reject,
         GEOLOCATION_CONFIG
       );
     });
   };
   ```

**디자인**:
- 위치: `fixed bottom-24 right-4` (필터바 위)
- 크기: 56x56px (모바일), 64x64px (데스크톱)
- 배경: white
- 그림자: shadow-lg
- 아이콘: GPS/타겟 모양 (lucide-react)
- 로딩 중: 스피너 표시

---

### 3.7 SearchModal 컴포넌트

**파일 경로**: `src/components/search/SearchModal.tsx`

**역할**: 장소 검색 모달 UI

**Props**:
```typescript
interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}
```

**구현 내용**:

1. **검색 입력**
   - 검색어 입력 필드
   - 디바운싱 적용 (300ms)
   - 최소 2자 이상 입력 시 검색 실행

2. **최근 검색어**
   - 로컬 스토리지에서 로드 (`SEARCH_HISTORY_CONFIG.STORAGE_KEY`)
   - 최대 10개 표시
   - 개별 삭제 가능
   - 클릭 시 자동 검색

3. **검색 결과**
   - 네이버 로컬 검색 API 호출
   - 결과 리스트 렌더링 (장소명, 주소, 카테고리, 거리)
   - 정렬 옵션: 거리순, 평점순
   - 결과 클릭 시:
     - 검색어 최근 검색어에 추가
     - 지도 해당 위치로 이동
     - 장소 상세 페이지로 이동
     - 모달 닫기

4. **빈 상태**
   - 검색 결과 없음: 안내 메시지
   - 최근 검색어 없음: 안내 메시지

**데이터 페칭**:
```typescript
const { data: searchResults, isLoading } = useQuery({
  queryKey: queryKeys.search.results(debouncedQuery),
  queryFn: () => searchPlaces(debouncedQuery),
  enabled: debouncedQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH,
  staleTime: 3 * 60 * 1000, // 3분
});
```

**디자인**:
- 모바일: 전체 화면 (Sheet 컴포넌트)
- 데스크톱: 중앙 모달 (Dialog 컴포넌트, 최대 너비 600px)

---

## 4. API 연동

### 4.1 장소 목록 조회 (지도 영역 기반)

**엔드포인트**: `GET /api/places`

**요청**:
```typescript
interface PlacesQueryParams {
  lat1: number; // 남서쪽 위도
  lng1: number; // 남서쪽 경도
  lat2: number; // 북동쪽 위도
  lng2: number; // 북동쪽 경도
  category?: string; // 카테고리 필터 (쉼표 구분, 예: "한식,일식")
}
```

**응답**:
```typescript
interface PlacesResponse {
  success: true;
  data: {
    places: PlaceMarker[];
  };
}
```

**클라이언트 함수**:
```typescript
// src/features/places/hooks/usePlacesQuery.ts
export const usePlacesQuery = (bounds: MapBounds | null, categories: FoodCategory[]) => {
  return useQuery({
    queryKey: queryKeys.places.list(
      bounds ? `${bounds.sw.lat},${bounds.sw.lng},${bounds.ne.lat},${bounds.ne.lng}` : '',
      categories.join(',')
    ),
    queryFn: async () => {
      if (!bounds) return { places: [] };

      const params: PlacesQueryParams = {
        lat1: bounds.sw.lat,
        lng1: bounds.sw.lng,
        lat2: bounds.ne.lat,
        lng2: bounds.ne.lng,
      };

      if (categories.length > 0) {
        params.category = categories.join(',');
      }

      const response = await apiGet<{ places: PlaceMarker[] }>(
        '/places',
        { params }
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    enabled: !!bounds,
    staleTime: 5 * 60 * 1000,
  });
};
```

---

### 4.2 장소 검색 (네이버 로컬 API)

**엔드포인트**: `GET /api/search`

**요청**:
```typescript
interface SearchQueryParams {
  query: string;
  latitude?: number; // 현재 위치 위도 (거리 계산용)
  longitude?: number; // 현재 위치 경도
  display?: number; // 결과 개수 (기본 20)
}
```

**응답**:
```typescript
interface SearchResponse {
  success: true;
  data: {
    places: NaverSearchResult[];
  };
}
```

**클라이언트 함수**:
```typescript
// src/features/search/hooks/useSearchQuery.ts
export const useSearchQuery = (query: string) => {
  const { currentLocation } = useMapStore();

  return useQuery({
    queryKey: queryKeys.search.results(query),
    queryFn: async () => {
      const params: SearchQueryParams = {
        query,
        display: SEARCH_CONFIG.MAX_RESULTS,
      };

      if (currentLocation) {
        params.latitude = currentLocation.lat;
        params.longitude = currentLocation.lng;
      }

      const response = await apiGet<{ places: NaverSearchResult[] }>(
        '/search',
        { params }
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    enabled: query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH,
    staleTime: 3 * 60 * 1000,
  });
};
```

---

## 5. 상태 관리

### 5.1 전역 상태 (Zustand)

**스토어**: `useMapStore` (이미 구현됨)

```typescript
// src/hooks/useMapStore.ts
interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedCategories: FoodCategory[];
  currentLocation: { lat: number; lng: number } | null;

  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  toggleCategory: (category: FoodCategory) => void;
  clearCategories: () => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
}
```

**사용처**:
- `NaverMap`: 지도 중심, 줌 레벨, 현재 위치 동기화
- `CategoryFilter`: 선택된 카테고리 관리
- `CurrentLocationButton`: 현재 위치 설정

---

### 5.2 로컬 상태 (useState)

**컴포넌트별 로컬 상태**:

1. **HomePage**
   - `isSearchOpen`: 검색 모달 열림 여부

2. **NaverMap**
   - `map`: 네이버 지도 인스턴스
   - `markers`: 현재 렌더링된 마커 배열
   - `bounds`: 현재 지도 영역

3. **SearchModal**
   - `query`: 검색어 입력값
   - `sortBy`: 정렬 옵션 (거리순/평점순)

4. **CurrentLocationButton**
   - `isLoading`: 위치 획득 중 여부

---

### 5.3 서버 상태 (React Query)

**쿼리 키 팩토리** (이미 정의됨):
```typescript
// src/lib/react-query.ts
export const queryKeys = {
  places: {
    all: ['places'],
    lists: () => [...queryKeys.places.all, 'list'],
    list: (bounds: string, categories: string) =>
      [...queryKeys.places.lists(), bounds, categories],
  },
  search: {
    all: ['search'],
    results: (query: string) => [...queryKeys.search.all, query],
  },
};
```

**사용 예시**:
```typescript
// 장소 목록 조회
const { data, isLoading } = usePlacesQuery(bounds, selectedCategories);

// 장소 검색
const { data: searchResults, isLoading: isSearching } = useSearchQuery(debouncedQuery);
```

---

## 6. 구현 순서

### Phase 1: 기본 구조 및 레이아웃 (2시간)

1. **HomePage 컴포넌트**
   - 기본 레이아웃 구조 구현
   - Header, 지도 영역, 필터바 배치
   - 반응형 스타일링

2. **Header 컴포넌트**
   - 로고, 검색바, 즐겨찾기 아이콘 배치
   - 클릭 이벤트 처리

3. **CategoryFilter 컴포넌트**
   - 카테고리 버튼 렌더링
   - Zustand 스토어 연동
   - 스타일링 (가로 스크롤)

---

### Phase 2: 네이버 지도 통합 (4시간)

1. **네이버 지도 SDK 로딩**
   - 스크립트 동적 로딩 유틸 작성
   - 환경 변수에서 Client ID 가져오기
   - 로딩 실패 에러 처리

2. **NaverMap 컴포넌트 - 기본 구현**
   - 지도 초기화
   - 초기 중심점 및 줌 레벨 설정
   - 지도 컨트롤 옵션 설정

3. **위치 권한 요청**
   - Geolocation API 사용
   - 권한 허용 시 현재 위치로 설정
   - 권한 거부 시 기본 위치 사용

4. **지도 이벤트 핸들링**
   - `idle` 이벤트 리스너 등록
   - 디바운싱 적용
   - 영역(bounds) 계산 함수

---

### Phase 3: 마커 렌더링 및 API 연동 (3시간)

1. **API 라우트 구현** (백엔드)
   - `GET /api/places` 엔드포인트
   - Supabase에서 영역 기반 장소 조회
   - 카테고리 필터 처리

2. **usePlacesQuery 훅**
   - React Query 쿼리 훅 작성
   - 에러 처리 및 재시도 로직

3. **MapMarker 컴포넌트**
   - 네이버 마커 생성 및 렌더링
   - 카테고리별 아이콘 적용
   - 클릭 이벤트 처리

4. **NaverMap - 마커 렌더링 로직**
   - 장소 데이터 페칭
   - 마커 배열 생성 및 관리
   - 마커 클릭 시 페이지 이동

---

### Phase 4: 검색 기능 (3시간)

1. **API 라우트 구현** (백엔드)
   - `GET /api/search` 엔드포인트
   - 네이버 로컬 검색 API 호출
   - 결과 변환 및 정렬

2. **SearchModal 컴포넌트 - 기본 구조**
   - Sheet/Dialog UI 구현
   - 검색 입력 필드
   - 디바운싱 적용

3. **최근 검색어 기능**
   - 로컬 스토리지 읽기/쓰기
   - 최대 10개 제한
   - 개별 삭제 기능

4. **검색 결과 렌더링**
   - useSearchQuery 훅 작성
   - 결과 리스트 UI
   - 정렬 옵션 처리
   - 결과 클릭 시 처리

---

### Phase 5: 현재 위치 기능 (1시간)

1. **CurrentLocationButton 컴포넌트**
   - 버튼 UI 및 플로팅 배치
   - 클릭 이벤트 처리
   - 로딩 상태 표시

2. **위치 획득 로직**
   - Geolocation API 호출
   - 에러 처리 (권한 거부, 타임아웃 등)
   - 지도 이동 및 마커 표시

---

### Phase 6: 최적화 및 테스트 (2시간)

1. **성능 최적화**
   - 마커 렌더링 최적화 (React.memo)
   - 디바운싱 시간 조정
   - 불필요한 리렌더링 방지

2. **에러 처리 강화**
   - API 호출 실패 시 토스트 메시지
   - 재시도 로직
   - 빈 상태 UI

3. **접근성 개선**
   - 키보드 네비게이션
   - ARIA 속성 추가
   - 스크린 리더 지원

4. **테스트**
   - 지도 초기화 테스트
   - 마커 클릭 테스트
   - 검색 플로우 테스트
   - 카테고리 필터 테스트

---

## 7. 기술 스택 및 의존성

### 7.1 라이브러리

**프론트엔드**:
- `react`, `next` (기본 프레임워크)
- `@tanstack/react-query` (서버 상태 관리)
- `zustand` (전역 상태 관리)
- `lucide-react` (아이콘)
- `react-use` (유틸 훅)
- `date-fns` (날짜 처리)

**네이버 지도**:
- 네이버 지도 SDK (스크립트 동적 로딩)
- Client ID: 환경 변수 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

**백엔드**:
- `hono` (API 라우터)
- `@supabase/supabase-js` (데이터베이스)
- `zod` (스키마 검증)

---

### 7.2 환경 변수

**.env.local**:
```bash
# 네이버 지도 API (클라이언트)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id

# 네이버 로컬 검색 API (서버)
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

---

## 8. 에러 처리 및 예외 상황

### 8.1 지도 SDK 로드 실패

**발생 시나리오**: 네이버 지도 SDK 스크립트 로드 실패

**처리 방법**:
1. 에러 바운더리에서 캐치
2. 에러 페이지 표시: "지도를 불러올 수 없습니다"
3. 새로고침 버튼 제공

---

### 8.2 위치 권한 거부

**발생 시나리오**: 사용자가 위치 권한을 거부

**처리 방법**:
1. 토스트 메시지 표시: "위치 권한이 필요합니다"
2. 기본 위치(서울시청)로 지도 초기화
3. 현재 위치 버튼 활성화 유지 (재시도 가능)

---

### 8.3 API 호출 실패

**발생 시나리오**: 장소 데이터 또는 검색 API 호출 실패

**처리 방법**:
1. 토스트 메시지 표시: "데이터를 불러올 수 없습니다"
2. 재시도 버튼 제공
3. 이전 데이터 유지 (가능한 경우)

---

### 8.4 검색 결과 없음

**발생 시나리오**: 검색어에 해당하는 결과가 없음

**처리 방법**:
1. 빈 상태 UI 표시: "검색 결과가 없습니다"
2. 다른 검색어 시도 유도

---

### 8.5 영역 내 장소 없음

**발생 시나리오**: 현재 지도 영역에 리뷰가 있는 장소가 없음

**처리 방법**:
1. 마커 제거
2. 지도 하단에 안내 메시지 표시 (3초 후 자동 사라짐): "이 지역에는 아직 리뷰가 없습니다"

---

## 9. 테스트 시나리오

### 9.1 지도 초기화 테스트

**시나리오**:
1. 홈 페이지 접속
2. 지도가 정상적으로 렌더링되는지 확인
3. 초기 중심점 및 줌 레벨 확인

**예상 결과**:
- 위치 권한 허용 시: 현재 위치 중심
- 위치 권한 거부 시: 서울시청 중심

---

### 9.2 마커 렌더링 테스트

**시나리오**:
1. 지도가 로드된 후 마커가 표시되는지 확인
2. 카테고리별 아이콘이 올바르게 표시되는지 확인
3. 마커 클릭 시 장소 상세 페이지로 이동하는지 확인

**예상 결과**:
- 마커가 카테고리별 아이콘으로 표시됨
- 마커 클릭 시 `/place/[placeId]` 페이지로 이동

---

### 9.3 검색 플로우 테스트

**시나리오**:
1. 검색바 클릭
2. 검색 모달 열림 확인
3. 검색어 입력 (예: "강남역 맛집")
4. 검색 결과 표시 확인
5. 결과 클릭 시 지도 이동 및 페이지 이동 확인

**예상 결과**:
- 검색 결과가 리스트로 표시됨
- 결과 클릭 시 지도가 해당 위치로 이동하고 장소 상세 페이지로 이동

---

### 9.4 카테고리 필터 테스트

**시나리오**:
1. 카테고리 필터에서 "한식" 선택
2. 한식 마커만 표시되는지 확인
3. "일식" 추가 선택
4. 한식 + 일식 마커가 표시되는지 확인
5. "전체" 선택
6. 모든 카테고리 마커가 표시되는지 확인

**예상 결과**:
- 선택한 카테고리의 마커만 표시됨
- 다중 선택 지원
- "전체" 선택 시 모든 마커 표시

---

### 9.5 현재 위치 이동 테스트

**시나리오**:
1. 현재 위치 버튼 클릭
2. 위치 권한 허용
3. 지도가 현재 위치로 이동하는지 확인
4. 현재 위치 마커가 표시되는지 확인

**예상 결과**:
- 지도가 현재 위치로 부드럽게 이동
- 파란색 펄스 애니메이션 마커 표시

---

## 10. 성능 최적화

### 10.1 마커 렌더링 최적화

**전략**:
- 최대 100개 마커만 표시 (MAP_CONFIG.MAX_MARKERS)
- 마커 컴포넌트에 React.memo 적용
- 마커 생성 시 불필요한 재생성 방지

**구현**:
```typescript
const MapMarker = React.memo(({ map, place, onClick }: MapMarkerProps) => {
  // ...
});
```

---

### 10.2 디바운싱 적용

**전략**:
- 지도 이동 이벤트: 300ms 디바운싱
- 검색 입력: 300ms 디바운싱

**구현**:
```typescript
const debouncedQuery = useDebounce(query, SEARCH_CONFIG.DEBOUNCE_DELAY);
```

---

### 10.3 React Query 캐싱

**전략**:
- 장소 데이터: staleTime 5분
- 검색 결과: staleTime 3분
- 불필요한 재요청 방지

---

### 10.4 지도 SDK 지연 로딩

**전략**:
- 네이버 지도 SDK를 페이지 로드 시 동적으로 로딩
- 캐시 활용

---

## 11. 접근성 (Accessibility)

### 11.1 키보드 네비게이션

- 검색바: Tab 키로 포커스, Enter 키로 검색 모달 열기
- 카테고리 필터: Tab 키로 이동, Space/Enter 키로 선택
- 현재 위치 버튼: Tab 키로 포커스, Space/Enter 키로 실행

---

### 11.2 ARIA 속성

**Header**:
```tsx
<button
  aria-label="장소 검색"
  onClick={onSearchClick}
>
  검색
</button>

<a
  href="/my-places"
  aria-label="즐겨찾기 목록"
>
  <Heart />
</a>
```

**CategoryFilter**:
```tsx
<button
  aria-label={`${category} 카테고리 필터`}
  aria-pressed={isSelected}
  onClick={() => toggleCategory(category)}
>
  {getCategoryIcon(category)} {category}
</button>
```

**CurrentLocationButton**:
```tsx
<button
  aria-label="현재 위치로 이동"
  aria-busy={isLoading}
  onClick={handleClick}
>
  {isLoading ? <Loader2 className="animate-spin" /> : <MapPin />}
</button>
```

---

### 11.3 색상 대비

- 모든 텍스트와 배경 색상 대비 최소 4.5:1 (WCAG AA 기준)
- 카테고리 버튼: 선택 상태 명확히 구분

---

## 12. 추가 고려사항

### 12.1 마커 클러스터링 (P2)

**구현 시기**: Phase 2 이후 (선택 사항)

**조건**: 줌 레벨 13 미만일 때 활성화

**라이브러리**: `@googlemaps/markerclusterer` 또는 네이버 지도 클러스터링 API

---

### 12.2 오프라인 지원

**구현 시기**: Phase 3 이후 (선택 사항)

**전략**:
- Service Worker 등록
- 지도 타일 캐싱
- 최근 조회한 장소 데이터 캐싱

---

### 12.3 실시간 업데이트

**구현 시기**: Phase 3 이후 (선택 사항)

**전략**:
- Supabase Realtime 구독
- 새 리뷰 작성 시 마커 실시간 업데이트

---

## 13. 체크리스트

### 구현 완료 기준

- [ ] 네이버 지도가 정상적으로 렌더링됨
- [ ] 위치 권한 요청 및 처리가 올바르게 작동함
- [ ] 지도 영역 기반 장소 마커가 표시됨
- [ ] 카테고리별 아이콘이 올바르게 표시됨
- [ ] 마커 클릭 시 장소 상세 페이지로 이동함
- [ ] 검색 기능이 정상 작동함 (디바운싱 포함)
- [ ] 최근 검색어 저장/삭제가 작동함
- [ ] 카테고리 필터가 정상 작동함 (다중 선택 포함)
- [ ] 현재 위치 버튼이 정상 작동함
- [ ] 모든 에러 상황에 적절한 메시지가 표시됨
- [ ] 반응형 디자인이 모바일/데스크톱에서 작동함
- [ ] 접근성 요구사항이 충족됨 (키보드, ARIA)

---

## 14. 참고 자료

### 14.1 네이버 지도 API

- [네이버 지도 SDK 공식 문서](https://navermaps.github.io/maps.js.ncp/)
- [네이버 로컬 검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md)

### 14.2 관련 문서

- [공통 모듈 문서](/docs/common-modules.md)
- [데이터베이스 설계](/docs/database.md)
- [유스케이스 - 지도 기능](/docs/usecases/map-features.md)
- [유스케이스 - 검색 및 탐색](/docs/usecases/search-and-exploration.md)

---

**문서 끝**

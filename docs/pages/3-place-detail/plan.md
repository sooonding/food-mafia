# 장소 상세 페이지 구현 계획

## 문서 정보

- **버전**: 1.0.0
- **최종 수정일**: 2025-10-22
- **작성자**: Development Team
- **페이지 경로**: `/place/[placeId]`
- **우선순위**: P0 (Must Have)

---

## 1. 개요

### 1.1 페이지 목적

장소 상세 페이지는 사용자가 특정 장소의 상세 정보와 리뷰 목록을 확인하고, 리뷰 작성 및 즐겨찾기 추가 등의 액션을 수행할 수 있는 핵심 페이지입니다.

### 1.2 관련 문서

- [PRD - 섹션 10.2](/docs/prd.md#102-장소-상세-placeplaceid)
- [사용자 플로우 - 섹션 2](/docs/userflow.md#2-장소-상세-페이지-placeplaceid)
- [유스케이스 - 장소 관리](/docs/usecases/place-management.md#uc-place-001-장소-상세-정보-조회)
- [유스케이스 - 리뷰 관리](/docs/usecases/review-management.md#uc-002-리뷰-목록-조회)
- [공통 모듈](/docs/common-modules.md)
- [데이터베이스 설계](/docs/database.md)

### 1.3 주요 기능

1. **장소 정보 표시**: 장소명, 주소, 카테고리, 평균 평점, 리뷰 수 표시
2. **리뷰 목록 조회**: 무한 스크롤로 리뷰 목록 표시, 정렬 옵션 제공
3. **액션 버튼**: 리뷰 작성, 즐겨찾기 추가/제거, 뒤로가기
4. **리뷰 정렬**: 최신순, 평점순 정렬 기능
5. **빈 상태 처리**: 리뷰가 없을 때 안내 메시지 및 CTA 표시

---

## 2. 페이지 구조

### 2.1 파일 구조

```
src/
├── app/
│   └── place/
│       └── [placeId]/
│           └── page.tsx              # 메인 페이지 컴포넌트
│
├── features/
│   └── place-detail/
│       ├── components/
│       │   ├── PlaceHeader.tsx       # 장소 정보 헤더
│       │   ├── PlaceInfo.tsx         # 장소 상세 정보 (주소, 카테고리 등)
│       │   ├── PlaceRating.tsx       # 평균 평점 및 리뷰 수 표시
│       │   ├── ActionButtons.tsx     # 리뷰 작성, 즐겨찾기, 뒤로가기 버튼
│       │   ├── ReviewList.tsx        # 리뷰 목록 컨테이너
│       │   ├── ReviewCard.tsx        # 개별 리뷰 카드
│       │   ├── ReviewSortFilter.tsx  # 리뷰 정렬 드롭다운
│       │   └── EmptyReviewState.tsx  # 리뷰 없을 때 빈 상태 UI
│       │
│       ├── hooks/
│       │   ├── usePlaceDetail.ts     # 장소 정보 조회 훅
│       │   ├── usePlaceReviews.ts    # 리뷰 목록 조회 훅 (무한 스크롤)
│       │   └── usePlaceFavorite.ts   # 즐겨찾기 상태 관리 훅
│       │
│       ├── lib/
│       │   └── utils.ts              # 페이지별 유틸리티 함수
│       │
│       └── constants/
│           └── index.ts              # 페이지별 상수
│
└── (공통 모듈 - 이미 구현됨)
    ├── types/
    │   ├── place.ts
    │   ├── review.ts
    │   └── favorite.ts
    ├── hooks/
    │   ├── useFavorites.ts
    │   └── useDebounce.ts
    ├── components/common/
    │   ├── StarRating.tsx
    │   ├── Skeleton.tsx
    │   └── EmptyState.tsx
    └── lib/
        ├── api-client.ts
        ├── react-query.ts
        └── utils/
            ├── date.ts
            └── category.ts
```

### 2.2 컴포넌트 계층 구조

```
page.tsx (서버 컴포넌트)
  └── PlaceDetailClient (클라이언트 컴포넌트)
      ├── PlaceHeader
      │   ├── BackButton
      │   └── PlaceTitle
      ├── PlaceInfo
      │   ├── PlaceAddress
      │   ├── PlaceCategory
      │   └── PlaceRating
      │       └── StarRating (공통)
      ├── ActionButtons
      │   ├── ReviewWriteButton
      │   └── FavoriteButton
      └── ReviewList
          ├── ReviewSortFilter
          └── [ReviewCard] (무한 스크롤)
              ├── ReviewAuthor
              ├── StarRating (공통)
              ├── ReviewContent
              ├── ReviewDate
              └── ReviewActions (수정/삭제 버튼)
```

---

## 3. 데이터 흐름

### 3.1 데이터 페칭 전략

```typescript
// 장소 정보 조회 (React Query)
const { data: place, isLoading, error } = usePlaceDetail(placeId);

// 리뷰 목록 조회 (무한 스크롤)
const {
  data: reviewPages,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = usePlaceReviews(placeId, sortOption);

// 즐겨찾기 상태 (로컬 스토리지 + Zustand/useState)
const { isFavorite, toggleFavorite } = usePlaceFavorite(placeId);
```

### 3.2 API 엔드포인트

| API | Method | URL | 설명 |
|-----|--------|-----|------|
| 장소 정보 조회 | GET | `/api/places/:placeId` | 장소 상세 정보 반환 |
| 리뷰 목록 조회 | GET | `/api/places/:placeId/reviews?page=1&limit=20&sort=latest` | 페이지네이션된 리뷰 목록 반환 |

### 3.3 상태 관리

**로컬 상태 (useState/useReducer)**:
- `sortOption`: 리뷰 정렬 옵션 (latest, rating)
- `isFavorite`: 즐겨찾기 여부 (로컬 스토리지와 동기화)

**서버 상태 (React Query)**:
- `place`: 장소 정보
- `reviews`: 리뷰 목록 (무한 스크롤)

**전역 상태 (Zustand - 선택사항)**:
- 필요 시 즐겨찾기 상태를 전역으로 관리 (현재는 로컬 스토리지 기반)

---

## 4. 단계별 구현 계획

### Phase 1: 기본 페이지 및 데이터 페칭 (4시간)

#### 4.1.1 페이지 라우트 설정 (30분)

**파일**: `src/app/place/[placeId]/page.tsx`

**작업 내용**:
1. Next.js 동적 라우트 생성
2. params를 Promise로 받아오기 (Next.js 15 대응)
3. 메타데이터 설정 (SEO)
4. 서버 컴포넌트에서 클라이언트 컴포넌트로 위임

**구현 예시**:
```typescript
'use server';

import { Metadata } from 'next';
import { PlaceDetailClient } from '@/features/place-detail/components/PlaceDetailClient';

interface PageProps {
  params: Promise<{ placeId: string }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { placeId } = await params;
  // TODO: 필요 시 서버에서 장소 정보를 미리 fetch하여 메타데이터 생성
  return {
    title: '장소 상세 | 맛집 지도',
    description: '맛집 정보와 리뷰를 확인하세요',
  };
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { placeId } = await params;

  return <PlaceDetailClient placeId={placeId} />;
}
```

**검증**:
- [ ] `/place/[placeId]` 경로 접근 가능
- [ ] params가 정상적으로 전달됨

---

#### 4.1.2 장소 정보 조회 훅 구현 (1시간)

**파일**: `src/features/place-detail/hooks/usePlaceDetail.ts`

**작업 내용**:
1. React Query의 `useQuery` 훅 사용
2. 장소 정보 조회 API 호출
3. 에러 처리 및 재시도 로직
4. 캐싱 전략 설정 (staleTime: 5분)

**구현 예시**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';
import type { Place } from '@/types/place';
import type { ApiResponse } from '@/types/api';

export function usePlaceDetail(placeId: string) {
  return useQuery({
    queryKey: queryKeys.places.detail(placeId),
    queryFn: async () => {
      const response = await apiGet<Place>(`/places/${placeId}`);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    retry: 1,
    enabled: !!placeId, // placeId가 있을 때만 실행
  });
}
```

**검증**:
- [ ] 유효한 placeId로 장소 정보 조회 성공
- [ ] 잘못된 placeId로 404 에러 처리
- [ ] 네트워크 에러 시 재시도 로직 동작
- [ ] React Query DevTools에서 캐싱 확인

---

#### 4.1.3 리뷰 목록 조회 훅 구현 (무한 스크롤) (1.5시간)

**파일**: `src/features/place-detail/hooks/usePlaceReviews.ts`

**작업 내용**:
1. React Query의 `useInfiniteQuery` 훅 사용
2. 페이지네이션된 리뷰 목록 조회
3. 무한 스크롤을 위한 `fetchNextPage` 로직
4. 정렬 옵션 (latest, rating) 지원

**구현 예시**:
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';
import type { ReviewListResponse } from '@/types/review';
import type { ApiResponse } from '@/types/api';

export type ReviewSortOption = 'latest' | 'rating';

export function usePlaceReviews(
  placeId: string,
  sort: ReviewSortOption = 'latest'
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.reviews.list(placeId, sort)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiGet<ReviewListResponse>(
        `/places/${placeId}/reviews?page=${pageParam}&limit=20&sort=${sort}`
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5분
    enabled: !!placeId,
  });
}
```

**검증**:
- [ ] 첫 페이지(20개) 리뷰 로딩 성공
- [ ] `fetchNextPage` 호출 시 다음 페이지 로딩
- [ ] `hasNextPage`가 false일 때 추가 로딩 중지
- [ ] 정렬 옵션 변경 시 새로운 쿼리 실행

---

#### 4.1.4 기본 페이지 컴포넌트 구현 (1시간)

**파일**: `src/features/place-detail/components/PlaceDetailClient.tsx`

**작업 내용**:
1. 클라이언트 컴포넌트 래퍼 생성
2. 장소 정보 및 리뷰 목록 페칭
3. 로딩 상태 처리 (Skeleton UI)
4. 에러 상태 처리 (에러 페이지)
5. 기본 레이아웃 구성

**구현 예시**:
```typescript
'use client';

import { useState } from 'react';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import { usePlaceReviews, ReviewSortOption } from '../hooks/usePlaceReviews';
import { PlaceHeader } from './PlaceHeader';
import { PlaceInfo } from './PlaceInfo';
import { ActionButtons } from './ActionButtons';
import { ReviewList } from './ReviewList';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PlaceDetailClientProps {
  placeId: string;
}

export function PlaceDetailClient({ placeId }: PlaceDetailClientProps) {
  const router = useRouter();
  const [sortOption, setSortOption] = useState<ReviewSortOption>('latest');

  const {
    data: place,
    isLoading: isLoadingPlace,
    error: placeError,
  } = usePlaceDetail(placeId);

  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingReviews,
    error: reviewsError,
  } = usePlaceReviews(placeId, sortOption);

  // 로딩 상태
  if (isLoadingPlace || isLoadingReviews) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 에러 상태 - 장소를 찾을 수 없음
  if (placeError || !place) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="장소를 찾을 수 없습니다"
        description="삭제되었거나 존재하지 않는 장소입니다."
        action={
          <Button onClick={() => router.push('/')}>
            홈으로 돌아가기
          </Button>
        }
      />
    );
  }

  // 리뷰 목록 평탄화
  const reviews = reviewPages?.pages.flatMap((page) => page.reviews) ?? [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PlaceHeader place={place} />
      <PlaceInfo place={place} />
      <ActionButtons placeId={placeId} />
      <ReviewList
        reviews={reviews}
        sortOption={sortOption}
        onSortChange={setSortOption}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}
```

**검증**:
- [ ] 로딩 중 Skeleton UI 표시
- [ ] 장소 정보 표시 성공
- [ ] 리뷰 목록 표시 성공
- [ ] 장소 없을 때 에러 페이지 표시

---

### Phase 2: UI 컴포넌트 구현 (5시간)

#### 4.2.1 PlaceHeader 컴포넌트 (30분)

**파일**: `src/features/place-detail/components/PlaceHeader.tsx`

**작업 내용**:
1. 뒤로가기 버튼 구현
2. 장소명 표시 (H1)
3. 모바일/데스크톱 반응형 레이아웃

**구현 예시**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Place } from '@/types/place';

interface PlaceHeaderProps {
  place: Place;
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        aria-label="뒤로가기"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 flex-1">
        {place.name}
      </h1>
    </div>
  );
}
```

**검증**:
- [ ] 뒤로가기 버튼 동작 확인
- [ ] 장소명 표시 확인
- [ ] 모바일/데스크톱 반응형 확인

---

#### 4.2.2 PlaceInfo 컴포넌트 (1시간)

**파일**: `src/features/place-detail/components/PlaceInfo.tsx`

**작업 내용**:
1. 주소 표시
2. 카테고리 태그 표시 (아이콘 포함)
3. 평균 평점 및 리뷰 수 표시
4. StarRating 공통 컴포넌트 재사용

**구현 예시**:
```typescript
'use client';

import { StarRating } from '@/components/common/StarRating';
import { getCategoryIcon, getCategoryColor } from '@/lib/utils/category';
import type { Place } from '@/types/place';

interface PlaceInfoProps {
  place: Place;
}

export function PlaceInfo({ place }: PlaceInfoProps) {
  const categoryIcon = getCategoryIcon(place.category);
  const categoryColor = getCategoryColor(place.category);

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      {/* 주소 */}
      <div className="flex items-start gap-2">
        <span className="text-sm text-gray-500">주소</span>
        <span className="text-sm text-gray-900 flex-1">
          {place.address || place.roadAddress}
        </span>
      </div>

      {/* 카테고리 */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          <span>{categoryIcon}</span>
          <span>{place.category}</span>
        </span>
      </div>

      {/* 평점 및 리뷰 수 */}
      <div className="flex items-center gap-3">
        <StarRating rating={place.averageRating} readonly size="md" />
        <span className="text-lg font-semibold text-gray-900">
          {place.averageRating.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">
          리뷰 {place.reviewCount}개
        </span>
      </div>
    </div>
  );
}
```

**검증**:
- [ ] 주소 표시 확인
- [ ] 카테고리 태그 및 아이콘 표시
- [ ] 평균 평점 및 별점 시각화
- [ ] 리뷰 수 표시 확인

---

#### 4.2.3 ActionButtons 컴포넌트 (1시간)

**파일**: `src/features/place-detail/components/ActionButtons.tsx`

**작업 내용**:
1. 리뷰 작성 버튼 (라우팅)
2. 즐겨찾기 버튼 (토글)
3. 즐겨찾기 상태 관리 (로컬 스토리지)

**구현 예시**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { PlusCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import { useToast } from '@/hooks/use-toast';

interface ActionButtonsProps {
  placeId: string;
}

export function ActionButtons({ placeId }: ActionButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: place } = usePlaceDetail(placeId);
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = place ? isFavorite(placeId) : false;

  const handleToggleFavorite = () => {
    if (!place) return;

    const favorite = {
      placeId: place.id,
      placeName: place.name,
      category: place.category,
      averageRating: place.averageRating,
      reviewCount: place.reviewCount,
      latitude: place.latitude,
      longitude: place.longitude,
      addedAt: new Date().toISOString(),
    };

    toggleFavorite(favorite);

    toast({
      title: isFav ? '즐겨찾기에서 제거되었습니다' : '즐겨찾기에 추가되었습니다',
      duration: 3000,
    });
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => router.push(`/place/${placeId}/review/new`)}
        className="flex-1"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        리뷰 작성
      </Button>
      <Button
        variant={isFav ? 'default' : 'outline'}
        onClick={handleToggleFavorite}
        aria-label={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
      >
        <Heart
          className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}
        />
      </Button>
    </div>
  );
}
```

**검증**:
- [ ] 리뷰 작성 버튼 클릭 시 `/place/[placeId]/review/new` 이동
- [ ] 즐겨찾기 버튼 토글 동작
- [ ] 즐겨찾기 상태 로컬 스토리지 저장
- [ ] 토스트 메시지 표시

---

#### 4.2.4 ReviewList 및 ReviewCard 컴포넌트 (2시간)

**파일**: `src/features/place-detail/components/ReviewList.tsx`

**작업 내용**:
1. 리뷰 정렬 드롭다운
2. 리뷰 카드 목록 렌더링
3. 무한 스크롤 구현 (Intersection Observer)
4. 빈 상태 처리

**구현 예시**:
```typescript
'use client';

import { useEffect, useRef } from 'react';
import { ReviewCard } from './ReviewCard';
import { ReviewSortFilter } from './ReviewSortFilter';
import { EmptyReviewState } from './EmptyReviewState';
import { Skeleton } from '@/components/common/Skeleton';
import type { Review } from '@/types/review';
import type { ReviewSortOption } from '../hooks/usePlaceReviews';

interface ReviewListProps {
  reviews: Review[];
  sortOption: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function ReviewList({
  reviews,
  sortOption,
  onSortChange,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ReviewListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // 무한 스크롤 구현
  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // 빈 상태
  if (reviews.length === 0) {
    return <EmptyReviewState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          리뷰 {reviews.length}개
        </h2>
        <ReviewSortFilter value={sortOption} onChange={onSortChange} />
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <div ref={observerTarget} className="py-4">
          {isFetchingNextPage && (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**파일**: `src/features/place-detail/components/ReviewCard.tsx`

```typescript
'use client';

import { StarRating } from '@/components/common/StarRating';
import { formatRelativeTime, formatDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { Review } from '@/types/review';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="bg-white border rounded-lg p-4 space-y-3">
      {/* 작성자 및 평점 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            {review.authorName}
          </span>
          <StarRating rating={review.rating} readonly size="sm" />
        </div>
        <span className="text-sm text-gray-500">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      {/* 리뷰 내용 */}
      <p className="text-sm text-gray-700 leading-relaxed">
        {review.content}
      </p>

      {/* 방문 날짜 */}
      {review.visitedAt && (
        <div className="text-xs text-gray-500">
          방문일: {formatDate(review.visitedAt, 'yyyy년 MM월 dd일')}
        </div>
      )}

      {/* 수정/삭제 버튼 */}
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm">
          <Edit className="w-4 h-4 mr-1" />
          수정
        </Button>
        <Button variant="ghost" size="sm">
          <Trash2 className="w-4 h-4 mr-1" />
          삭제
        </Button>
      </div>
    </article>
  );
}
```

**검증**:
- [ ] 리뷰 목록 표시 확인
- [ ] 무한 스크롤 동작 확인
- [ ] 정렬 옵션 변경 시 목록 갱신
- [ ] 빈 상태 UI 표시 확인

---

#### 4.2.5 ReviewSortFilter 컴포넌트 (30분)

**파일**: `src/features/place-detail/components/ReviewSortFilter.tsx`

**작업 내용**:
1. 정렬 옵션 드롭다운
2. 최신순, 평점순 선택

**구현 예시**:
```typescript
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReviewSortOption } from '../hooks/usePlaceReviews';

interface ReviewSortFilterProps {
  value: ReviewSortOption;
  onChange: (value: ReviewSortOption) => void;
}

export function ReviewSortFilter({ value, onChange }: ReviewSortFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">최신순</SelectItem>
        <SelectItem value="rating">평점순</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

**검증**:
- [ ] 드롭다운 열기/닫기 동작
- [ ] 정렬 옵션 선택 시 onChange 호출
- [ ] 현재 선택된 옵션 표시

---

#### 4.2.6 EmptyReviewState 컴포넌트 (30분)

**파일**: `src/features/place-detail/components/EmptyReviewState.tsx`

**작업 내용**:
1. 리뷰 없을 때 안내 메시지
2. 리뷰 작성 CTA 버튼

**구현 예시**:
```typescript
'use client';

import { useRouter, useParams } from 'next/navigation';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyReviewState() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.placeId as string;

  return (
    <EmptyState
      icon={MessageSquare}
      title="아직 리뷰가 없습니다"
      description="첫 번째 리뷰를 작성해보세요!"
      action={
        <Button onClick={() => router.push(`/place/${placeId}/review/new`)}>
          리뷰 작성하기
        </Button>
      }
    />
  );
}
```

**검증**:
- [ ] 빈 상태 UI 표시
- [ ] 리뷰 작성 버튼 클릭 시 라우팅

---

### Phase 3: 에러 처리 및 최적화 (2시간)

#### 4.3.1 에러 바운더리 및 에러 페이지 (1시간)

**작업 내용**:
1. 장소 없음 에러 처리
2. 네트워크 에러 처리
3. 재시도 버튼 구현
4. 에러 토스트 메시지

**구현 위치**: `PlaceDetailClient.tsx`에서 이미 기본 처리됨

**추가 개선**:
- 네트워크 에러 시 재시도 버튼 추가
- 에러 메시지 명확화

---

#### 4.3.2 성능 최적화 (1시간)

**작업 내용**:
1. React Query 캐싱 전략 조정
2. 컴포넌트 메모이제이션 (`React.memo`)
3. 무한 스크롤 성능 최적화 (debounce)
4. 이미지 최적화 (향후 리뷰 이미지 추가 시)

**구현 예시**:
```typescript
// ReviewCard 메모이제이션
export const ReviewCard = React.memo(function ReviewCard({ review }: ReviewCardProps) {
  // ... 기존 코드
});

// 무한 스크롤 debounce
const debouncedLoadMore = useMemo(
  () => debounce(onLoadMore, 300),
  [onLoadMore]
);
```

**검증**:
- [ ] React DevTools Profiler로 불필요한 리렌더링 확인
- [ ] 무한 스크롤 시 과도한 API 호출 방지
- [ ] 캐싱으로 중복 요청 제거

---

### Phase 4: 접근성 및 반응형 (1시간)

#### 4.4.1 접근성 개선 (30분)

**작업 내용**:
1. ARIA 속성 추가
2. 키보드 네비게이션 지원
3. 스크린 리더 지원

**체크리스트**:
- [ ] 모든 인터랙티브 요소에 `aria-label` 추가
- [ ] 별점에 "5점 만점에 4점" 형식의 `aria-label`
- [ ] 무한 스크롤 로딩 시 `aria-live="polite"` 영역 추가
- [ ] 키보드로 모든 버튼 접근 가능

---

#### 4.4.2 반응형 디자인 (30분)

**작업 내용**:
1. 모바일(360px-767px) 레이아웃
2. 태블릿(768px-1023px) 레이아웃
3. 데스크톱(1024px+) 레이아웃

**Tailwind CSS 클래스 활용**:
```typescript
// 모바일: 세로 배치, 데스크톱: 가로 배치
<div className="flex flex-col md:flex-row gap-4">
```

**검증**:
- [ ] 모바일에서 정상 표시
- [ ] 태블릿에서 정상 표시
- [ ] 데스크톱에서 정상 표시

---

## 5. 데이터 타입 정의

### 5.1 사용할 공통 타입

**이미 구현된 타입** (`/docs/common-modules.md` 참조):
- `Place` (`src/types/place.ts`)
- `Review`, `ReviewListResponse` (`src/types/review.ts`)
- `Favorite` (`src/types/favorite.ts`)
- `ApiResponse` (`src/types/api.ts`)

### 5.2 페이지별 추가 타입

**파일**: `src/features/place-detail/types/index.ts` (필요 시)

```typescript
// 현재 페이지에서는 추가 타입 불필요
// 공통 타입으로 충분히 커버 가능
```

---

## 6. 스타일링 가이드

### 6.1 Tailwind CSS 클래스 컨벤션

- **컨테이너**: `container mx-auto p-4`
- **카드**: `bg-white border rounded-lg p-4`
- **간격**: `space-y-{n}` (세로), `gap-{n}` (가로)
- **텍스트 크기**: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- **폰트 굵기**: `font-medium`, `font-semibold`, `font-bold`
- **색상**: `text-gray-{n}`, `bg-gray-{n}`, `border-gray-{n}`

### 6.2 반응형 브레이크포인트

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

---

## 7. 테스트 계획

### 7.1 단위 테스트 (선택사항)

**테스트 대상**:
- `usePlaceDetail` 훅
- `usePlaceReviews` 훅
- `usePlaceFavorite` 훅

**도구**: Jest, React Testing Library

### 7.2 통합 테스트

**시나리오**:
1. 장소 상세 페이지 접근 → 장소 정보 및 리뷰 목록 표시
2. 무한 스크롤 → 추가 리뷰 로딩
3. 정렬 옵션 변경 → 리뷰 재정렬
4. 즐겨찾기 추가/제거 → 로컬 스토리지 업데이트
5. 리뷰 작성 버튼 클릭 → 리뷰 작성 페이지 이동

### 7.3 수동 테스트 체크리스트

- [ ] 유효한 placeId로 접근 시 정상 표시
- [ ] 잘못된 placeId로 접근 시 에러 페이지 표시
- [ ] 리뷰 없을 때 빈 상태 UI 표시
- [ ] 무한 스크롤로 리뷰 20개씩 로딩
- [ ] 정렬 옵션 변경 시 리뷰 재정렬
- [ ] 즐겨찾기 추가/제거 동작
- [ ] 리뷰 작성 버튼 클릭 시 라우팅
- [ ] 뒤로가기 버튼 동작
- [ ] 모바일/태블릿/데스크톱 반응형
- [ ] 키보드 네비게이션 가능

---

## 8. 의존성 및 기술 스택

### 8.1 사용할 라이브러리 (이미 설치됨)

- **Next.js 15.1.0**: App Router, 동적 라우트
- **React 19.0.0**: Client Component
- **@tanstack/react-query 5.x**: 서버 상태 관리
- **react-hook-form 7.x**: 폼 관리 (리뷰 작성 페이지에서 사용)
- **zod 3.x**: 스키마 검증
- **date-fns 4.x**: 날짜 포맷팅
- **lucide-react 0.469.0**: 아이콘
- **shadcn-ui**: UI 컴포넌트 (Button, Select 등)

### 8.2 설치 필요한 shadcn-ui 컴포넌트

```bash
$ npx shadcn@latest add button
$ npx shadcn@latest add select
$ npx shadcn@latest add toast
```

---

## 9. 주의사항 및 베스트 프랙티스

### 9.1 DRY 원칙 준수

- **StarRating**: 공통 컴포넌트 재사용
- **Skeleton**: 공통 컴포넌트 재사용
- **EmptyState**: 공통 컴포넌트 재사용
- **날짜 포맷팅**: `src/lib/utils/date.ts` 유틸리티 함수 사용
- **카테고리 아이콘/색상**: `src/lib/utils/category.ts` 유틸리티 함수 사용

### 9.2 타입 안전성

- 모든 props에 TypeScript 타입 정의
- API 응답에 Zod 스키마 검증 (백엔드에서 처리)
- `any` 타입 사용 금지

### 9.3 성능 최적화

- React Query 캐싱 활용
- 무한 스크롤 debounce 적용
- 컴포넌트 메모이제이션 (`React.memo`)
- 이미지 lazy loading (향후)

### 9.4 에러 처리

- 모든 API 호출에 try-catch
- 사용자에게 명확한 에러 메시지 제공
- 재시도 버튼 제공 (네트워크 에러 시)

### 9.5 접근성

- 모든 인터랙티브 요소에 키보드 접근 가능
- ARIA 속성 적절히 사용
- 색상 대비 4.5:1 이상 유지

---

## 10. 예상 이슈 및 해결 방안

### 10.1 무한 스크롤 성능 저하

**문제**: 리뷰가 수백 개일 때 DOM 노드 과다로 성능 저하

**해결**:
- 가상 스크롤 라이브러리 도입 고려 (`react-window`, `react-virtual`)
- 현재는 20개씩만 로딩하므로 큰 문제 없음

### 10.2 즐겨찾기 동기화 문제

**문제**: 여러 탭에서 즐겨찾기 추가/제거 시 동기화 안 됨

**해결**:
- `window.addEventListener('storage', ...)` 이벤트로 동기화
- 또는 BroadcastChannel API 사용

### 10.3 리뷰 수정/삭제 시 캐시 무효화

**문제**: 리뷰 수정/삭제 후 목록 갱신 안 됨

**해결**:
- React Query의 `invalidateQueries` 사용
- 리뷰 작성/수정/삭제 후 `queryClient.invalidateQueries(['reviews', placeId])`

---

## 11. 완료 기준

### 11.1 기능 완료 기준

- [ ] 장소 정보 표시 (장소명, 주소, 카테고리, 평점, 리뷰 수)
- [ ] 리뷰 목록 표시 (무한 스크롤)
- [ ] 리뷰 정렬 기능 (최신순, 평점순)
- [ ] 리뷰 작성 버튼 (라우팅)
- [ ] 즐겨찾기 추가/제거 기능
- [ ] 뒤로가기 버튼
- [ ] 빈 상태 UI (리뷰 없음)
- [ ] 에러 처리 (장소 없음, 네트워크 에러)
- [ ] 로딩 상태 (Skeleton UI)

### 11.2 비기능 완료 기준

- [ ] 페이지 초기 로딩 < 2초
- [ ] API 응답 시간 < 500ms (p95)
- [ ] 무한 스크롤 부드럽게 동작
- [ ] 모바일/태블릿/데스크톱 반응형
- [ ] 키보드 네비게이션 가능
- [ ] ARIA 속성 적절히 적용
- [ ] 색상 대비 4.5:1 이상 유지
- [ ] React Query 캐싱 정상 동작

### 11.3 코드 품질 기준

- [ ] TypeScript 타입 에러 0개
- [ ] ESLint 경고 0개
- [ ] 모든 컴포넌트에 JSDoc 주석
- [ ] DRY 원칙 준수 (공통 컴포넌트/유틸리티 재사용)
- [ ] 파일 구조 명확 (기능별 분리)

---

## 12. 참고 자료

### 12.1 내부 문서

- [PRD](/docs/prd.md)
- [사용자 플로우](/docs/userflow.md)
- [데이터베이스 설계](/docs/database.md)
- [공통 모듈](/docs/common-modules.md)
- [유스케이스 - 장소 관리](/docs/usecases/place-management.md)
- [유스케이스 - 리뷰 관리](/docs/usecases/review-management.md)

### 12.2 외부 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [shadcn-ui 공식 문서](https://ui.shadcn.com/)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [date-fns 공식 문서](https://date-fns.org/)

---

## 13. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-10-22 | Development Team | 초안 작성 - 장소 상세 페이지 구현 계획 |

---

**문서 끝**

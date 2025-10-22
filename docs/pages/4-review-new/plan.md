# 리뷰 작성 페이지 구현 계획

## 문서 정보

- **페이지 경로**: `/place/[placeId]/review/new`
- **버전**: 1.0.0
- **최종 수정일**: 2025-10-22
- **작성자**: Development Team
- **문서 상태**: Draft
- **참조 문서**:
  - [PRD - 리뷰 작성](/docs/prd.md#103-리뷰-작성-placeplaceidsreviewnew)
  - [사용자 플로우 - 리뷰 작성](/docs/userflow.md#3-리뷰-작성-페이지-placeplaceidsreviewnew)
  - [유스케이스 - UC-001 리뷰 작성](/docs/usecases/review-management.md#uc-001-리뷰-작성)
  - [상태 관리 설계 - 리뷰 관리](/docs/pages/2-review-management/state.md)
  - [공통 모듈](/docs/common-modules.md)
  - [데이터베이스 설계](/docs/database.md)

---

## 1. 페이지 개요

### 1.1 목적

사용자가 방문한 장소에 대한 리뷰를 작성할 수 있는 폼 페이지입니다. 비로그인 환경에서 작성자명과 비밀번호를 입력받아 리뷰를 작성하며, react-hook-form + zod를 활용한 엄격한 검증을 수행합니다.

### 1.2 핵심 기능

- 장소 정보 고정 헤더 표시 (장소명, 주소)
- 리뷰 작성 폼 (작성자명, 별점, 내용, 방문 날짜, 비밀번호)
- 실시간 폼 유효성 검증 (클라이언트)
- 서버 측 검증 및 XSS 방지
- 리뷰 작성 성공 시 장소 상세 페이지로 리다이렉트
- 장소가 DB에 없을 경우 자동 생성 (네이버 API 활용)

### 1.3 페이지 진입 경로

- 장소 상세 페이지(`/place/[placeId]`)에서 "리뷰 작성" 버튼 클릭
- URL 파라미터: `placeId` (필수)

### 1.4 페이지 구성 요소

```
ReviewNewPage (Client Component)
  ├─ PlaceHeaderSection (고정 헤더)
  │   ├─ BackButton (← 뒤로가기)
  │   ├─ PlaceName (H1)
  │   └─ PlaceAddress (작은 텍스트)
  ├─ ReviewForm (폼 컴포넌트)
  │   ├─ AuthorNameField
  │   ├─ StarRatingField (공통 컴포넌트)
  │   ├─ ContentField (Textarea)
  │   ├─ VisitDateField (Date Picker)
  │   ├─ PasswordField
  │   └─ SubmitButton
  └─ (로딩 시 Skeleton UI)
```

---

## 2. 구현 단계별 계획

### 2.1 Phase 1: 페이지 구조 및 라우팅 (1시간)

#### 2.1.1 파일 생성

**파일 경로**: `src/app/place/[placeId]/review/new/page.tsx`

**목적**: Next.js App Router 페이지 컴포넌트 생성

**구현 내용**:

```typescript
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewNewPageContent } from '@/features/review/components/ReviewNewPageContent';

interface ReviewNewPageProps {
  params: Promise<{ placeId: string }>;
}

export default function ReviewNewPage({ params }: ReviewNewPageProps) {
  const { placeId } = use(params);
  const router = useRouter();

  // 유효성 검증: placeId가 없으면 홈으로 리다이렉트
  if (!placeId) {
    router.replace('/');
    return null;
  }

  return <ReviewNewPageContent placeId={placeId} />;
}
```

**의존성**:
- Next.js 15 App Router (Promise params 지원)
- `use` hook for async params

**주의사항**:
- `params`는 Promise이므로 `use()` hook으로 언래핑 필요 (Next.js 15 요구사항)
- Page 컴포넌트는 Client Component로 선언 (`"use client"`)

---

#### 2.1.2 메인 컨텐츠 컴포넌트 생성

**파일 경로**: `src/features/review/components/ReviewNewPageContent.tsx`

**목적**: 페이지 전체 레이아웃 및 데이터 로딩 관리

**구현 내용**:

```typescript
'use client';

import { Suspense } from 'react';
import { usePlace } from '@/features/place/hooks/usePlace';
import { PlaceHeader } from './PlaceHeader';
import { ReviewForm } from './ReviewForm';
import { Skeleton } from '@/components/common/Skeleton';

interface ReviewNewPageContentProps {
  placeId: string;
}

export function ReviewNewPageContent({ placeId }: ReviewNewPageContentProps) {
  const { data: place, isLoading, isError } = usePlace(placeId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-4" /> {/* 뒤로가기 */}
          <Skeleton className="h-10 w-3/4 mb-2" /> {/* 장소명 */}
          <Skeleton className="h-6 w-full mb-8" /> {/* 주소 */}
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 (장소를 찾을 수 없음)
  if (isError || !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">장소를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">잘못된 접근이거나 삭제된 장소입니다</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 장소 정보 고정 헤더 */}
        <PlaceHeader place={place} />

        {/* 리뷰 작성 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold mb-6">리뷰 작성</h2>
          <ReviewForm placeId={placeId} mode="create" />
        </div>
      </div>
    </div>
  );
}
```

**의존성**:
- `usePlace(placeId)`: 장소 정보 조회 훅 (기존 구현 가정)
- 공통 Skeleton 컴포넌트

**데이터 흐름**:
1. `usePlace` 훅으로 장소 정보 조회
2. 로딩 중: Skeleton UI 표시
3. 에러 또는 장소 없음: 에러 페이지 표시
4. 성공: 장소 헤더 + 리뷰 폼 렌더링

---

### 2.2 Phase 2: 장소 헤더 컴포넌트 (30분)

#### 2.2.1 PlaceHeader 컴포넌트

**파일 경로**: `src/features/review/components/PlaceHeader.tsx`

**목적**: 장소 정보 요약 표시 (고정 헤더)

**구현 내용**:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { Place } from '@/types/place';
import { getCategoryIcon } from '@/lib/utils/category';

interface PlaceHeaderProps {
  place: Place;
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10 -mx-4 px-4 py-4">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">뒤로가기</span>
      </button>

      {/* 장소 정보 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl" aria-hidden="true">
            {getCategoryIcon(place.category)}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
        </div>
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm">
            {place.roadAddress || place.address}
          </p>
        </div>
        <div className="mt-2">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {place.category}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**의존성**:
- `lucide-react` 아이콘: ArrowLeft, MapPin
- `getCategoryIcon` 유틸 함수 (공통 모듈)
- `Place` 타입 (공통 타입)

**접근성**:
- `aria-label` for 뒤로가기 버튼
- `aria-hidden="true"` for 장식용 아이콘
- Semantic HTML (`<h1>` for 장소명)

---

### 2.3 Phase 3: 리뷰 폼 컴포넌트 (2시간)

#### 2.3.1 ReviewForm 컴포넌트 (메인)

**파일 경로**: `src/features/review/components/ReviewForm.tsx`

**목적**: react-hook-form + zod를 활용한 리뷰 작성 폼

**구현 내용**:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewCreateSchema, type ReviewCreateInput } from '@/schemas/review';
import { useCreateReview } from '../hooks/useCreateReview';
import { StarRating } from '@/components/common/StarRating';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  placeId: string;
  mode: 'create' | 'edit';
  defaultValues?: Partial<ReviewCreateInput>;
}

export function ReviewForm({ placeId, mode, defaultValues }: ReviewFormProps) {
  const createReview = useCreateReview(placeId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    mode: 'onBlur', // blur 이벤트에서만 검증
    defaultValues: defaultValues || {
      authorName: '',
      rating: 0,
      content: '',
      visitedAt: undefined,
      password: '',
    },
  });

  const rating = watch('rating');
  const content = watch('content');

  const onSubmit = (data: ReviewCreateInput) => {
    createReview.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 작성자명 필드 */}
      <div>
        <label
          htmlFor="authorName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          작성자명 <span className="text-red-500">*</span>
        </label>
        <input
          id="authorName"
          type="text"
          {...register('authorName')}
          className={cn(
            'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
            errors.authorName && 'border-red-500 focus:ring-red-500'
          )}
          placeholder="2-10자 입력"
          aria-required="true"
          aria-invalid={!!errors.authorName}
          aria-describedby={errors.authorName ? 'authorName-error' : undefined}
        />
        {errors.authorName && (
          <p
            id="authorName-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.authorName.message}
          </p>
        )}
      </div>

      {/* 평점 필드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          평점 <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          onRatingChange={(value) => setValue('rating', value, { shouldValidate: true })}
          size="lg"
          readonly={false}
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* 리뷰 내용 필드 */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          리뷰 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          {...register('content')}
          className={cn(
            'w-full px-4 py-2 border rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none',
            errors.content && 'border-red-500 focus:ring-red-500'
          )}
          placeholder="10-500자 입력 (최소 10자 이상 작성해주세요)"
          aria-required="true"
          aria-invalid={!!errors.content}
          aria-describedby="content-error content-hint"
        />
        <div className="flex justify-between items-start mt-1">
          <div className="flex-1">
            {errors.content ? (
              <p id="content-error" className="text-sm text-red-500" role="alert">
                {errors.content.message}
              </p>
            ) : (
              <p id="content-hint" className="text-sm text-gray-500">
                최소 10자 이상 입력해주세요
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-2">
            {content.length}/500
          </p>
        </div>
      </div>

      {/* 방문 날짜 필드 (선택) */}
      <div>
        <label
          htmlFor="visitedAt"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          방문 날짜 (선택)
        </label>
        <input
          id="visitedAt"
          type="date"
          {...register('visitedAt')}
          max={new Date().toISOString().split('T')[0]} // 오늘 날짜까지만 선택 가능
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          aria-describedby="visitedAt-hint"
        />
        <p id="visitedAt-hint" className="mt-1 text-sm text-gray-500">
          실제 방문한 날짜를 선택해주세요 (미래 날짜 선택 불가)
        </p>
      </div>

      {/* 비밀번호 필드 */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={cn(
            'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
            errors.password && 'border-red-500 focus:ring-red-500'
          )}
          placeholder="4-20자 (리뷰 수정/삭제 시 사용됩니다)"
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby="password-error password-hint"
        />
        {errors.password ? (
          <p id="password-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="mt-1 text-sm text-gray-500">
            리뷰 수정 또는 삭제 시 사용되는 비밀번호입니다
          </p>
        )}
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting || createReview.isPending}
        className={cn(
          'w-full py-3 rounded-lg font-semibold transition-colors',
          'bg-primary text-white hover:bg-primary-hover',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting || createReview.isPending ? '작성 중...' : '작성하기'}
      </button>
    </form>
  );
}
```

**의존성**:
- `react-hook-form`: 폼 상태 관리
- `@hookform/resolvers/zod`: Zod 리졸버
- `reviewCreateSchema` (공통 스키마)
- `StarRating` (공통 컴포넌트)
- `useCreateReview` 훅 (다음 단계에서 구현)

**폼 검증 전략**:
- `mode: 'onBlur'`: 필드 포커스 해제 시 검증
- `shouldValidate: true`: 별점 변경 시 즉시 검증
- Zod 스키마로 클라이언트 측 검증
- 서버 측에서 동일한 스키마 재사용

**접근성**:
- `aria-required`: 필수 입력 필드 표시
- `aria-invalid`: 에러 상태 표시
- `aria-describedby`: 에러/힌트 메시지 연결
- `role="alert"`: 에러 메시지에 알림 역할 부여

---

### 2.4 Phase 4: React Query 훅 구현 (1.5시간)

#### 2.4.1 useCreateReview 훅

**파일 경로**: `src/features/review/hooks/useCreateReview.ts`

**목적**: 리뷰 작성 뮤테이션 관리

**구현 내용**:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/react-query';
import { apiPost } from '@/lib/api-client';
import type { ReviewFormData, Review } from '@/types/review';
import type { ApiResponse } from '@/types/api';
import { toast } from 'sonner'; // or your toast library

export function useCreateReview(placeId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiPost<Review>(`/api/places/${placeId}/reviews`, data);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      // 리뷰 목록 캐시 무효화 (장소 상세 페이지에서 최신 리뷰 표시)
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.lists() });

      // 장소 정보 캐시 무효화 (평균 평점, 리뷰 수 갱신)
      queryClient.invalidateQueries({ queryKey: queryKeys.places.detail(placeId) });

      // 장소 목록 캐시 무효화 (지도 마커 갱신, 첫 리뷰인 경우)
      queryClient.invalidateQueries({ queryKey: queryKeys.places.lists() });

      // 성공 토스트 메시지
      toast.success('리뷰가 작성되었습니다');

      // 장소 상세 페이지로 리다이렉트
      router.push(`/place/${placeId}`);
    },
    onError: (error: Error) => {
      // 에러 토스트 메시지
      const errorMessage = error.message || '리뷰 작성에 실패했습니다';
      toast.error(errorMessage);

      // 에러 로깅 (프로덕션 환경에서는 Sentry 등 활용)
      console.error('[useCreateReview] Error:', error);
    },
  });
}
```

**의존성**:
- `@tanstack/react-query`: 뮤테이션 관리
- `next/navigation`: 라우터 (리다이렉트)
- `queryKeys` (공통 Query Key Factory)
- `apiPost` (공통 API 클라이언트)
- `sonner` 또는 토스트 라이브러리

**캐시 무효화 전략**:
1. 리뷰 목록 캐시 무효화 → 장소 상세 페이지에서 새 리뷰 표시
2. 장소 정보 캐시 무효화 → 평균 평점/리뷰 수 갱신
3. 장소 목록 캐시 무효화 → 지도 마커 추가 (첫 리뷰인 경우)

**에러 처리**:
- 서버 에러 메시지를 토스트로 표시
- 콘솔에 에러 로깅
- 입력 내용은 유지 (react-hook-form이 관리)

---

#### 2.4.2 usePlace 훅 (장소 정보 조회)

**파일 경로**: `src/features/place/hooks/usePlace.ts`

**목적**: 장소 상세 정보 조회 (헤더 표시용)

**구현 내용**:

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { apiGet } from '@/lib/api-client';
import type { Place } from '@/types/place';
import type { ApiResponse } from '@/types/api';

export function usePlace(placeId: string) {
  return useQuery({
    queryKey: queryKeys.places.detail(placeId),
    queryFn: async () => {
      const response = await apiGet<Place>(`/api/places/${placeId}`);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    enabled: !!placeId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}
```

**의존성**:
- `@tanstack/react-query`
- `queryKeys.places.detail` (공통)
- `apiGet` (공통 API 클라이언트)

**캐싱 전략**:
- `staleTime: 5분`: 5분 동안 캐시 사용
- `enabled: !!placeId`: placeId가 있을 때만 조회
- 장소 정보는 자주 변경되지 않으므로 긴 캐싱 시간 설정

---

### 2.5 Phase 5: API 라우트 구현 (2시간)

#### 2.5.1 리뷰 작성 API

**파일 경로**: `src/features/review/backend/route.ts`

**목적**: Hono 라우터에 리뷰 작성 엔드포인트 등록

**구현 내용**:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { reviewCreateSchema } from '../../../schemas/review';
import { createReviewService } from './service';
import { respond, success, failure } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';

const reviewRoutes = new Hono<AppEnv>();

// POST /api/places/:placeId/reviews - 리뷰 작성
reviewRoutes.post(
  '/places/:placeId/reviews',
  zValidator('json', reviewCreateSchema),
  async (c) => {
    try {
      const placeId = c.req.param('placeId');
      const body = c.req.valid('json');
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      logger.info(`[POST /places/${placeId}/reviews] 리뷰 작성 시작`);

      // 서비스 레이어 호출
      const result = await createReviewService(supabase, {
        placeId,
        ...body,
      });

      if (!result.success) {
        logger.error(`[POST /places/${placeId}/reviews] 실패: ${result.error.code}`);
        return respond(c, failure(result.error.code, result.error.message), result.status || 500);
      }

      logger.info(`[POST /places/${placeId}/reviews] 성공: reviewId=${result.data.id}`);
      return respond(c, success(result.data), 201);
    } catch (error: any) {
      const logger = c.get('logger');
      logger.error('[POST /places/:placeId/reviews] Unexpected error:', error);
      return respond(c, failure('SERVER_ERROR', '리뷰 작성 중 오류가 발생했습니다'), 500);
    }
  }
);

export { reviewRoutes };
```

**의존성**:
- `@hono/zod-validator`: Zod 스키마 검증
- `reviewCreateSchema` (공통 스키마)
- `createReviewService` (서비스 레이어)
- 공통 응답 헬퍼 (`respond`, `success`, `failure`)

**검증 단계**:
1. Zod 스키마로 요청 본문 검증
2. 파라미터 추출 (`placeId`)
3. 서비스 레이어 호출
4. 결과에 따라 적절한 HTTP 상태 코드 반환

---

#### 2.5.2 리뷰 작성 서비스 레이어

**파일 경로**: `src/features/review/backend/service.ts`

**목적**: 비즈니스 로직 및 DB 접근

**구현 내용**:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import DOMPurify from 'isomorphic-dompurify';
import type { ReviewFormData, Review } from '@/types/review';
import type { Place } from '@/types/place';
import { REVIEW_ERROR_CODES } from './error';

const BCRYPT_SALT_ROUNDS = 10;

interface CreateReviewParams extends ReviewFormData {
  placeId: string;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  status?: number;
}

/**
 * 리뷰 작성 서비스
 */
export async function createReviewService(
  supabase: SupabaseClient,
  params: CreateReviewParams
): Promise<ServiceResult<Review>> {
  try {
    const { placeId, authorName, rating, content, visitedAt, password } = params;

    // 1. 장소 존재 여부 확인
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('id, name')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      // 장소가 없으면 네이버 API에서 검색하여 생성 (향후 구현)
      // 현재는 에러 반환
      return {
        success: false,
        error: {
          code: REVIEW_ERROR_CODES.PLACE_NOT_FOUND,
          message: '장소를 찾을 수 없습니다',
        },
        status: 404,
      };
    }

    // 2. 입력값 sanitize (XSS 방지)
    const sanitizedContent = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
    const sanitizedAuthorName = DOMPurify.sanitize(authorName, { ALLOWED_TAGS: [] });

    // 3. 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 비밀번호 해시 길이 검증 (bcrypt는 항상 60자)
    if (passwordHash.length !== 60) {
      return {
        success: false,
        error: {
          code: REVIEW_ERROR_CODES.INVALID_PASSWORD_HASH,
          message: '비밀번호 처리 중 오류가 발생했습니다',
        },
        status: 500,
      };
    }

    // 4. 리뷰 생성
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        place_id: placeId,
        author_name: sanitizedAuthorName,
        rating,
        content: sanitizedContent,
        visited_at: visitedAt || null,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (reviewError || !review) {
      console.error('[createReviewService] DB Insert Error:', reviewError);
      return {
        success: false,
        error: {
          code: REVIEW_ERROR_CODES.CREATE_FAILED,
          message: '리뷰 작성에 실패했습니다',
        },
        status: 500,
      };
    }

    // 5. 성공 응답 (DB 트리거가 장소 통계 자동 갱신)
    return {
      success: true,
      data: {
        id: review.id,
        placeId: review.place_id,
        authorName: review.author_name,
        rating: review.rating,
        content: review.content,
        visitedAt: review.visited_at,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      },
    };
  } catch (error: any) {
    console.error('[createReviewService] Unexpected Error:', error);
    return {
      success: false,
      error: {
        code: REVIEW_ERROR_CODES.SERVER_ERROR,
        message: '서버 오류가 발생했습니다',
      },
      status: 500,
    };
  }
}
```

**의존성**:
- `bcrypt`: 비밀번호 해싱 (salt rounds: 10)
- `isomorphic-dompurify`: XSS 방지 (서버에서도 사용 가능)
- Supabase 클라이언트
- 에러 코드 상수

**보안 처리**:
1. **XSS 방지**: DOMPurify로 모든 HTML 태그 제거
2. **비밀번호 해싱**: bcrypt (salt rounds: 10)
3. **해시 검증**: bcrypt 해시는 항상 60자 (무결성 확인)
4. **SQL Injection 방지**: Supabase 파라미터화된 쿼리

**비즈니스 로직**:
1. 장소 존재 여부 확인
2. 입력값 sanitize
3. 비밀번호 해싱
4. 리뷰 DB 삽입
5. DB 트리거가 장소 통계 자동 갱신 (average_rating, review_count)

---

#### 2.5.3 에러 코드 정의

**파일 경로**: `src/features/review/backend/error.ts`

**목적**: 리뷰 관련 에러 코드 중앙 관리

**구현 내용**:

```typescript
export const REVIEW_ERROR_CODES = {
  // 장소 관련
  PLACE_NOT_FOUND: 'REVIEW_001',

  // 리뷰 생성
  CREATE_FAILED: 'REVIEW_002',
  INVALID_PASSWORD_HASH: 'REVIEW_003',

  // 리뷰 수정
  UPDATE_FAILED: 'REVIEW_004',
  UNAUTHORIZED: 'REVIEW_005',

  // 리뷰 삭제
  DELETE_FAILED: 'REVIEW_006',
  NOT_FOUND: 'REVIEW_007',

  // 공통
  VALIDATION_ERROR: 'REVIEW_008',
  SERVER_ERROR: 'REVIEW_009',
} as const;

export type ReviewErrorCode = typeof REVIEW_ERROR_CODES[keyof typeof REVIEW_ERROR_CODES];
```

---

### 2.6 Phase 6: 통합 및 테스트 (1시간)

#### 2.6.1 Hono 앱에 라우터 등록

**파일 경로**: `src/backend/hono/app.ts` (기존 파일 수정)

**수정 내용**:

```typescript
import { reviewRoutes } from '@/features/review/backend/route';

// ... (기존 코드)

export function createHonoApp() {
  const app = new Hono<AppEnv>();

  // ... (기존 미들웨어)

  // 리뷰 라우터 등록
  app.route('/api', reviewRoutes);

  // ... (기타 라우터)

  return app;
}
```

---

#### 2.6.2 수동 테스트 체크리스트

**테스트 시나리오**:

1. **정상 플로우**:
   - [ ] 장소 상세 페이지에서 "리뷰 작성" 버튼 클릭
   - [ ] 리뷰 작성 페이지 로딩 (장소 정보 표시)
   - [ ] 모든 필드 정상 입력 (작성자명, 별점, 내용, 방문일, 비밀번호)
   - [ ] "작성하기" 버튼 클릭
   - [ ] 로딩 상태 표시 ("작성 중...")
   - [ ] 성공 토스트 메시지 표시
   - [ ] 장소 상세 페이지로 리다이렉트
   - [ ] 새 리뷰가 목록 최상단에 표시됨
   - [ ] 평균 평점/리뷰 수 갱신 확인

2. **유효성 검증**:
   - [ ] 작성자명 1자 입력 → 에러 메시지 표시
   - [ ] 별점 미선택 → 제출 불가
   - [ ] 리뷰 내용 9자 입력 → 에러 메시지 표시
   - [ ] 비밀번호 3자 입력 → 에러 메시지 표시
   - [ ] 미래 날짜 선택 불가 확인

3. **에러 처리**:
   - [ ] 잘못된 placeId로 접근 → "장소를 찾을 수 없습니다" 페이지
   - [ ] 네트워크 끊김 → 에러 토스트, 재시도 가능
   - [ ] 서버 에러 (500) → 에러 토스트 표시

4. **접근성**:
   - [ ] Tab 키로 모든 필드 이동 가능
   - [ ] 스크린 리더로 레이블 읽기
   - [ ] 에러 메시지 aria-live로 읽힘
   - [ ] 필수 필드 aria-required 확인

5. **첫 리뷰 작성 (지도 마커 추가)**:
   - [ ] 리뷰가 0개인 장소에 리뷰 작성
   - [ ] 작성 후 홈 페이지 지도에 마커 추가됨 확인

---

## 3. 코드베이스 구조 준수 확인

### 3.1 디렉토리 구조

```
src/
├─ app/
│  └─ place/
│     └─ [placeId]/
│        └─ review/
│           └─ new/
│              └─ page.tsx (Next.js Page)
├─ features/
│  ├─ review/
│  │  ├─ components/
│  │  │  ├─ ReviewNewPageContent.tsx
│  │  │  ├─ PlaceHeader.tsx
│  │  │  └─ ReviewForm.tsx
│  │  ├─ hooks/
│  │  │  └─ useCreateReview.ts
│  │  └─ backend/
│  │     ├─ route.ts (Hono 라우터)
│  │     ├─ service.ts (비즈니스 로직)
│  │     └─ error.ts (에러 코드)
│  └─ place/
│     └─ hooks/
│        └─ usePlace.ts
├─ components/
│  └─ common/
│     ├─ StarRating.tsx (이미 구현됨)
│     └─ Skeleton.tsx (이미 구현됨)
├─ schemas/
│  └─ review.ts (이미 구현됨)
├─ types/
│  ├─ review.ts (이미 구현됨)
│  └─ place.ts (이미 구현됨)
└─ lib/
   ├─ api-client.ts (이미 구현됨)
   ├─ react-query.ts (이미 구현됨)
   └─ utils/
      └─ category.ts (이미 구현됨)
```

### 3.2 공통 모듈 재사용

| 모듈 | 위치 | 용도 |
|------|------|------|
| `StarRating` | `/components/common/StarRating.tsx` | 별점 선택 UI |
| `Skeleton` | `/components/common/Skeleton.tsx` | 로딩 스켈레톤 |
| `reviewCreateSchema` | `/schemas/review.ts` | 폼 검증 스키마 |
| `apiPost` | `/lib/api-client.ts` | API 호출 래퍼 |
| `queryKeys` | `/lib/react-query.ts` | Query Key Factory |
| `getCategoryIcon` | `/lib/utils/category.ts` | 카테고리 아이콘 |
| `Review`, `Place` 타입 | `/types/` | 공통 타입 |

### 3.3 DRY 원칙 준수

- **폼 검증 스키마**: 클라이언트/서버 공통 사용 (`reviewCreateSchema`)
- **API 클라이언트**: 공통 `apiPost` 함수 재사용
- **Query Key**: `queryKeys` Factory 패턴으로 중앙 관리
- **에러 코드**: `REVIEW_ERROR_CODES` 상수로 중앙 관리
- **UI 컴포넌트**: `StarRating`, `Skeleton` 재사용

---

## 4. 기존 코드와의 충돌 방지

### 4.1 확인 사항

1. **라우트 충돌 없음**:
   - `/place/[placeId]/review/new`는 신규 경로
   - 기존 페이지와 중복 없음

2. **Query Key 충돌 없음**:
   - `queryKeys.reviews.lists()`: 리뷰 목록 (기존)
   - `queryKeys.places.detail(placeId)`: 장소 정보 (기존)
   - 새로운 키 추가 없음 (기존 키만 무효화)

3. **타입 충돌 없음**:
   - `Review`, `Place`, `ReviewFormData` 타입은 공통 모듈에 이미 정의됨
   - 신규 타입 추가 없음

4. **Context 충돌 없음**:
   - 리뷰 작성 페이지는 독립적으로 동작
   - `ReviewManagementProvider`는 사용하지 않음 (목록/수정/삭제 페이지에서만 사용)

5. **API 엔드포인트 충돌 없음**:
   - `POST /api/places/:placeId/reviews`는 신규 엔드포인트
   - 기존 API와 중복 없음

---

## 5. 필요한 추가 작업

### 5.1 shadcn-ui 컴포넌트 설치

리뷰 작성 페이지에서 사용할 추가 shadcn-ui 컴포넌트가 필요한 경우:

```bash
# 토스트 메시지 (sonner)
$ npx shadcn@latest add sonner

# (선택) 날짜 선택기 커스터마이징이 필요한 경우
$ npx shadcn@latest add calendar
$ npx shadcn@latest add popover
```

**Note**: 기본 `<input type="date">`를 사용하므로 추가 컴포넌트는 선택사항입니다.

### 5.2 Toast Provider 설정

**파일 경로**: `src/app/layout.tsx` (기존 파일 수정)

**추가 내용**:

```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* React Query Provider는 이미 설정되어 있다고 가정 */}
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
```

### 5.3 필요한 npm 패키지 설치

```bash
$ npm install bcrypt isomorphic-dompurify sonner
$ npm install -D @types/bcrypt
```

---

## 6. 성능 최적화 전략

### 6.1 React Query 캐싱

- `usePlace` 훅: `staleTime: 5분` (장소 정보는 자주 변경되지 않음)
- `useCreateReview`: 뮤테이션 성공 시 관련 쿼리 캐시 무효화

### 6.2 폼 최적화

- `react-hook-form`: uncontrolled 컴포넌트로 불필요한 리렌더링 방지
- `mode: 'onBlur'`: blur 이벤트에서만 검증 (onChange 대신)
- `watch`는 필수 필드에만 사용 (rating, content)

### 6.3 번들 크기 최적화

- `isomorphic-dompurify`: 서버/클라이언트 공통 사용
- `bcrypt`: 서버 측에서만 사용 (클라이언트 번들에 포함 안 됨)

---

## 7. 보안 고려사항

### 7.1 비밀번호 관리

- **클라이언트**: 평문 전송 (HTTPS 필수)
- **서버**: bcrypt 해싱 (salt rounds: 10)
- **저장**: 해시만 DB에 저장, 평문 절대 저장 금지
- **검증**: 해시 길이 검증 (60자 고정)

### 7.2 XSS 방지

- **서버 측**: DOMPurify로 모든 HTML 태그 제거
- **클라이언트**: React가 기본적으로 이스케이프 처리

### 7.3 SQL Injection 방지

- Supabase 파라미터화된 쿼리 사용
- 직접 SQL 쿼리 사용 금지

---

## 8. 접근성 (a11y) 체크리스트

- [ ] 모든 폼 필드에 `<label>` 연결
- [ ] 필수 입력 필드에 `aria-required="true"`
- [ ] 에러 메시지에 `role="alert"`
- [ ] 에러 필드에 `aria-invalid="true"`
- [ ] 에러/힌트 메시지와 필드 연결 (`aria-describedby`)
- [ ] 키보드만으로 모든 폼 입력 가능
- [ ] 포커스 스타일 명확히 표시
- [ ] 별점 선택 시 `aria-label`로 값 읽기 가능
- [ ] 뒤로가기 버튼에 `aria-label`

---

## 9. 에러 시나리오 및 처리

### 9.1 클라이언트 에러

| 에러 상황 | 처리 방법 |
|----------|----------|
| placeId 없음 | 홈으로 리다이렉트 |
| 장소 조회 실패 | "장소를 찾을 수 없습니다" 페이지 표시 |
| 폼 검증 실패 | 필드별 에러 메시지 표시, 제출 차단 |
| 네트워크 에러 | 에러 토스트, 입력 내용 유지, 재시도 가능 |

### 9.2 서버 에러

| 에러 상황 | 처리 방법 |
|----------|----------|
| 장소 없음 (404) | 에러 토스트 표시 (향후 네이버 API 연동 시 자동 생성) |
| 비밀번호 해싱 실패 | 에러 토스트 표시, 로깅 |
| DB 삽입 실패 | 에러 토스트 표시, 로깅 |
| 서버 에러 (500) | 에러 토스트 표시, 로깅 |

---

## 10. 향후 개선 사항

### 10.1 네이버 API 연동

**현재**: 장소가 DB에 없으면 에러 반환

**개선안**: 네이버 로컬 검색 API로 장소 정보 조회 후 자동 생성

**구현 위치**: `src/features/review/backend/service.ts`

```typescript
// 1. 장소 존재 여부 확인
if (!place) {
  // 네이버 API에서 장소 정보 조회
  const naverPlace = await searchNaverPlace(placeId);

  if (!naverPlace) {
    return { success: false, error: { ... }, status: 404 };
  }

  // 장소 자동 생성
  const newPlace = await createPlaceFromNaver(supabase, naverPlace);
  placeId = newPlace.id;
}
```

### 10.2 리뷰 이미지 업로드

**개선안**: Supabase Storage를 활용한 이미지 업로드 기능

**폼 필드 추가**:
```typescript
images: File[] (선택, 최대 3개)
```

### 10.3 자동 저장 (Draft)

**개선안**: 작성 중인 리뷰를 로컬 스토리지에 임시 저장

**구현**:
- `useEffect`로 폼 내용 변경 시 자동 저장
- 페이지 재진입 시 임시 저장된 내용 불러오기

---

## 11. 테스트 전략

### 11.1 단위 테스트

- **Zod 스키마 테스트**: 각 필드 검증 규칙 검증
- **서비스 레이어 테스트**: bcrypt 해싱, sanitize 처리 검증

### 11.2 통합 테스트

- **API 엔드포인트 테스트**: MSW로 모킹
- **폼 제출 플로우 테스트**: React Testing Library

### 11.3 E2E 테스트 (선택)

- Playwright로 전체 플로우 테스트
- 리뷰 작성 → 장소 상세 페이지 확인 → 리뷰 목록에 표시

---

## 12. 작업 예상 시간

| 단계 | 예상 시간 |
|------|----------|
| Phase 1: 페이지 구조 및 라우팅 | 1시간 |
| Phase 2: 장소 헤더 컴포넌트 | 30분 |
| Phase 3: 리뷰 폼 컴포넌트 | 2시간 |
| Phase 4: React Query 훅 구현 | 1.5시간 |
| Phase 5: API 라우트 구현 | 2시간 |
| Phase 6: 통합 및 테스트 | 1시간 |
| **총 예상 시간** | **8시간** |

---

## 13. 완료 조건 (Definition of Done)

- [ ] 모든 컴포넌트 파일 생성 및 구현 완료
- [ ] React Query 훅 구현 완료
- [ ] Hono API 라우트 구현 및 등록 완료
- [ ] 서비스 레이어 (비즈니스 로직) 구현 완료
- [ ] Zod 스키마 검증 동작 확인
- [ ] bcrypt 비밀번호 해싱 동작 확인
- [ ] XSS 방지 sanitize 처리 확인
- [ ] 수동 테스트 체크리스트 모두 통과
- [ ] 접근성 체크리스트 모두 통과
- [ ] 에러 처리 시나리오 모두 검증
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 (필요 시)

---

## 14. 참고 문서

- [PRD - 리뷰 작성 페이지](/docs/prd.md#103-리뷰-작성-placeplaceidsreviewnew)
- [사용자 플로우 - 리뷰 작성](/docs/userflow.md#3-리뷰-작성-페이지-placeplaceidsreviewnew)
- [유스케이스 - UC-001 리뷰 작성](/docs/usecases/review-management.md#uc-001-리뷰-작성)
- [상태 관리 설계 - 리뷰 관리](/docs/pages/2-review-management/state.md)
- [공통 모듈 - 리뷰 스키마](/docs/common-modules.md#61-리뷰-스키마)
- [데이터베이스 설계 - reviews 테이블](/docs/database.md#2-reviews-리뷰)
- [React Hook Form 공식 문서](https://react-hook-form.com/)
- [Zod 공식 문서](https://zod.dev/)
- [Hono 공식 문서](https://hono.dev/)

---

**문서 끝**

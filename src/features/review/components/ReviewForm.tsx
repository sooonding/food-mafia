'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reviewCreateSchema,
  type ReviewCreateInput
} from '@/schemas/review';
import { StarRating } from '@/components/common/StarRating';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/remote/api-client';
import type { SearchResultItem } from '@/features/search/backend/schema';
import type { CreatePlaceRequest, CreatePlaceResponse } from '@/features/places/backend/schema';
import type { ApiErrorResponse } from '@/types/api';
import { toast } from 'sonner';

interface ReviewFormProps {
  // placeId 또는 place 중 하나는 필수
  placeId?: string;
  place?: SearchResultItem;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
  reviewId?: string;
  defaultValues?: Partial<ReviewCreateInput>;
}

export function ReviewForm({ placeId, place, onSuccess, mode = 'create', reviewId, defaultValues }: ReviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!placeId && !place) {
    throw new Error('ReviewForm: placeId 또는 place 중 하나는 필수입니다');
  }

  // mode와 reviewId는 향후 edit 기능에서 사용 예정
  const _ = { mode, reviewId };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    mode: 'onBlur',
    defaultValues: {
      authorName: '',
      rating: 0,
      content: '',
      visitedAt: undefined,
      password: '',
    },
  });

  const rating = watch('rating');
  const content = watch('content');

  const onSubmit = async (data: ReviewCreateInput) => {
    setIsSubmitting(true);

    try {
      let finalPlaceId = placeId;

      // place가 있으면 먼저 장소를 DB에 저장 (또는 기존 장소 조회)
      if (place) {
        const placeData: CreatePlaceRequest = {
          name: place.title,
          address: place.address,
          roadAddress: place.roadAddress,
          category: place.category || '기타',
          telephone: place.telephone,
          latitude: place.latitude,
          longitude: place.longitude,
          naverPlaceId: null,
          naverLink: place.link,
        };

        const placeResponse = await apiPost<CreatePlaceResponse>('/places', placeData);

        if (!placeResponse.success) {
          const errorResponse = placeResponse as ApiErrorResponse;
          const errorMessage = errorResponse.error?.message || '장소 저장에 실패했습니다';
          toast.error(errorMessage);
          setIsSubmitting(false);
          return;
        }

        finalPlaceId = placeResponse.data.placeId;
      }

      // 리뷰 저장
      const reviewResponse = await apiPost(`/places/${finalPlaceId}/reviews`, data);

      if (!reviewResponse.success) {
        const errorResponse = reviewResponse as ApiErrorResponse;
        const errorMessage = errorResponse.error?.message || '리뷰 작성에 실패했습니다';
        toast.error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // 성공 처리
      toast.success('리뷰가 작성되었습니다');
      onSuccess?.();
      router.push('/');
    } catch (error) {
      console.error('[ReviewForm] 에러:', error);
      const errorMessage = error instanceof Error ? error.message : '오류가 발생했습니다';
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
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
            {content?.length || 0}/500
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
        disabled={isSubmitting}
        className={cn(
          'w-full py-3 rounded-lg font-semibold transition-colors',
          'bg-primary text-white hover:bg-primary-hover',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting ? '작성 중...' : '작성하기'}
      </button>
    </form>
  );
}

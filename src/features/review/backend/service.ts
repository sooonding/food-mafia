import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// 간단한 HTML sanitization 함수
function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ReviewResponseSchema,
  ReviewTableRowSchema,
  type ReviewResponse,
  type ReviewRow,
  type ReviewCreateInput,
  type ReviewUpdateInput,
} from '@/features/review/backend/schema';
import {
  reviewErrorCodes,
  type ReviewServiceError,
} from '@/features/review/backend/error';

const REVIEWS_TABLE = 'reviews';
const SALT_ROUNDS = 10;

// DB Row를 API Response로 매핑하는 헬퍼
const mapReviewRowToResponse = (row: ReviewRow): ReviewResponse => ({
  id: row.id,
  placeId: row.place_id,
  authorName: row.author_name,
  rating: row.rating,
  content: row.content,
  visitedAt: row.visited_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// 리뷰 상세 조회
export const getReviewById = async (
  client: SupabaseClient,
  reviewId: string,
): Promise<HandlerResult<ReviewResponse, ReviewServiceError, unknown>> => {
  const { data, error } = await client
    .from(REVIEWS_TABLE)
    .select(
      'id, place_id, author_name, rating, content, visited_at, created_at, updated_at',
    )
    .eq('id', reviewId)
    .maybeSingle<Omit<ReviewRow, 'password_hash'>>();

  if (error) {
    return failure(500, reviewErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, reviewErrorCodes.notFound, '리뷰를 찾을 수 없습니다');
  }

  const rowParse = ReviewTableRowSchema.omit({ password_hash: true }).safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      'Review row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = mapReviewRowToResponse(rowParse.data as ReviewRow);

  const parsed = ReviewResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      'Review payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 리뷰 수정
export const updateReview = async (
  client: SupabaseClient,
  reviewId: string,
  input: ReviewUpdateInput,
): Promise<HandlerResult<ReviewResponse, ReviewServiceError, unknown>> => {
  // 1. 기존 리뷰 조회 (비밀번호 해시 포함)
  const { data: existingReview, error: fetchError } = await client
    .from(REVIEWS_TABLE)
    .select('*')
    .eq('id', reviewId)
    .maybeSingle<ReviewRow>();

  if (fetchError) {
    return failure(500, reviewErrorCodes.fetchError, fetchError.message);
  }

  if (!existingReview) {
    return failure(404, reviewErrorCodes.notFound, '리뷰를 찾을 수 없습니다');
  }

  // 2. 비밀번호 검증
  const isPasswordValid = await bcrypt.compare(
    input.password,
    existingReview.password_hash,
  );

  if (!isPasswordValid) {
    return failure(
      401,
      reviewErrorCodes.unauthorized,
      '비밀번호가 일치하지 않습니다',
    );
  }

  // 3. XSS 방지 sanitization
  const sanitizedContent = sanitizeHtml(input.content);

  // 4. 리뷰 업데이트
  const { data: updatedReview, error: updateError } = await client
    .from(REVIEWS_TABLE)
    .update({
      rating: input.rating,
      content: sanitizedContent,
      visited_at: input.visitedAt || null,
    })
    .eq('id', reviewId)
    .select(
      'id, place_id, author_name, rating, content, visited_at, created_at, updated_at',
    )
    .maybeSingle<Omit<ReviewRow, 'password_hash'>>();

  if (updateError) {
    return failure(500, reviewErrorCodes.updateError, updateError.message);
  }

  if (!updatedReview) {
    return failure(
      500,
      reviewErrorCodes.updateError,
      '리뷰 수정에 실패했습니다',
    );
  }

  const rowParse = ReviewTableRowSchema.omit({ password_hash: true }).safeParse(updatedReview);

  if (!rowParse.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      'Updated review row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = mapReviewRowToResponse(rowParse.data as ReviewRow);

  const parsed = ReviewResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      'Updated review payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 리뷰 작성
export const createReview = async (
  client: SupabaseClient,
  placeId: string,
  input: ReviewCreateInput,
): Promise<HandlerResult<ReviewResponse, ReviewServiceError, unknown>> => {
  // 1. 비밀번호 해싱
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // 2. XSS 방지 sanitization
  const sanitizedContent = sanitizeHtml(input.content);

  // 3. 리뷰 생성
  const { data: newReview, error: createError } = await client
    .from(REVIEWS_TABLE)
    .insert({
      place_id: placeId,
      author_name: input.authorName,
      rating: input.rating,
      content: sanitizedContent,
      visited_at: input.visitedAt || null,
      password_hash: passwordHash,
    })
    .select(
      'id, place_id, author_name, rating, content, visited_at, created_at, updated_at',
    )
    .maybeSingle<Omit<ReviewRow, 'password_hash'>>();

  if (createError) {
    return failure(500, reviewErrorCodes.createError, createError.message);
  }

  if (!newReview) {
    return failure(
      500,
      reviewErrorCodes.createError,
      '리뷰 작성에 실패했습니다',
    );
  }

  const rowParse = ReviewTableRowSchema.omit({ password_hash: true }).safeParse(newReview);

  if (!rowParse.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      'Created review row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = mapReviewRowToResponse(rowParse.data as ReviewRow);

  const parsed = ReviewResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      'Created review payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 리뷰 삭제
export const deleteReview = async (
  client: SupabaseClient,
  reviewId: string,
  password: string,
): Promise<HandlerResult<{ id: string }, ReviewServiceError, unknown>> => {
  // 1. 기존 리뷰 조회 (비밀번호 해시 포함)
  const { data: existingReview, error: fetchError } = await client
    .from(REVIEWS_TABLE)
    .select('*')
    .eq('id', reviewId)
    .maybeSingle<ReviewRow>();

  if (fetchError) {
    return failure(500, reviewErrorCodes.fetchError, fetchError.message);
  }

  if (!existingReview) {
    return failure(404, reviewErrorCodes.notFound, '리뷰를 찾을 수 없습니다');
  }

  // 2. 비밀번호 검증
  const isPasswordValid = await bcrypt.compare(
    password,
    existingReview.password_hash,
  );

  if (!isPasswordValid) {
    return failure(
      401,
      reviewErrorCodes.unauthorized,
      '비밀번호가 일치하지 않습니다',
    );
  }

  // 3. 리뷰 삭제
  const { error: deleteError } = await client
    .from(REVIEWS_TABLE)
    .delete()
    .eq('id', reviewId);

  if (deleteError) {
    return failure(500, reviewErrorCodes.deleteError, deleteError.message);
  }

  return success({ id: reviewId });
};

// 장소별 리뷰 목록 조회 (페이지네이션 + 정렬)
export const getReviewsByPlaceId = async (
  client: SupabaseClient,
  placeId: string,
  page: number = 1,
  limit: number = 20,
  sort: 'latest' | 'rating' = 'latest',
): Promise<HandlerResult<{
  reviews: ReviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}, ReviewServiceError, unknown>> => {
  const offset = (page - 1) * limit;

  // 정렬 기준 설정
  const orderColumn = sort === 'rating' ? 'rating' : 'created_at';
  const orderAscending = sort === 'rating' ? false : false; // 둘 다 내림차순

  // 전체 개수 조회
  const { count, error: countError } = await client
    .from(REVIEWS_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('place_id', placeId);

  if (countError) {
    return failure(500, reviewErrorCodes.fetchError, countError.message);
  }

  const total = count || 0;

  // 리뷰 목록 조회
  const { data, error } = await client
    .from(REVIEWS_TABLE)
    .select(
      'id, place_id, author_name, rating, content, visited_at, created_at, updated_at',
    )
    .eq('place_id', placeId)
    .order(orderColumn, { ascending: orderAscending })
    .range(offset, offset + limit - 1);

  if (error) {
    return failure(500, reviewErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return success({
      reviews: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasNext: false,
      },
    });
  }

  // 데이터 검증 및 매핑
  const reviews: ReviewResponse[] = [];
  for (const row of data) {
    const rowParse = ReviewTableRowSchema.omit({ password_hash: true }).safeParse(row);
    if (rowParse.success) {
      const mapped = mapReviewRowToResponse(rowParse.data as ReviewRow);
      const parsed = ReviewResponseSchema.safeParse(mapped);
      if (parsed.success) {
        reviews.push(parsed.data);
      }
    }
  }

  return success({
    reviews,
    pagination: {
      page,
      limit,
      total,
      hasNext: offset + limit < total,
    },
  });
};

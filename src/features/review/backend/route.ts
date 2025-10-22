import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  ReviewParamsSchema,
  PlaceIdParamsSchema,
  ReviewCreateSchema,
  ReviewUpdateSchema,
  ReviewDeleteSchema,
  ReviewListQuerySchema,
} from '@/features/review/backend/schema';
import {
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getReviewsByPlaceId,
} from './service';
import {
  reviewErrorCodes,
  type ReviewServiceError,
} from './error';

export const registerReviewRoutes = (app: Hono<AppEnv>) => {
  // 장소별 리뷰 목록 조회
  app.get('/places/:placeId/reviews', async (c) => {
    const parsedParams = PlaceIdParamsSchema.safeParse({
      placeId: c.req.param('placeId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_PLACE_PARAMS',
          'The provided place id is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const rawQuery = c.req.query();
    const parsedQuery = ReviewListQuerySchema.safeParse(rawQuery);

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_QUERY_PARAMS',
          'The provided query parameters are invalid.',
          parsedQuery.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getReviewsByPlaceId(
      supabase,
      parsedParams.data.placeId,
      parsedQuery.data.page,
      parsedQuery.data.limit,
      parsedQuery.data.sort,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.fetchError) {
        logger.error('Failed to fetch reviews', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // 리뷰 상세 조회
  app.get('/reviews/:reviewId', async (c) => {
    const parsedParams = ReviewParamsSchema.safeParse({
      reviewId: c.req.param('reviewId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_PARAMS',
          'The provided review id is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getReviewById(supabase, parsedParams.data.reviewId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.fetchError) {
        logger.error('Failed to fetch review', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // 리뷰 작성
  app.post('/places/:placeId/reviews', async (c) => {
    const parsedParams = PlaceIdParamsSchema.safeParse({
      placeId: c.req.param('placeId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_PLACE_PARAMS',
          'The provided place id is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const body = await c.req.json();
    const parsedBody = ReviewCreateSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_DATA',
          'The provided review data is invalid.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createReview(
      supabase,
      parsedParams.data.placeId,
      parsedBody.data,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.createError) {
        logger.error('Failed to create review', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // 리뷰 수정
  app.patch('/reviews/:reviewId', async (c) => {
    const parsedParams = ReviewParamsSchema.safeParse({
      reviewId: c.req.param('reviewId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_PARAMS',
          'The provided review id is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const body = await c.req.json();
    const parsedBody = ReviewUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_UPDATE_DATA',
          'The provided review update data is invalid.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await updateReview(
      supabase,
      parsedParams.data.reviewId,
      parsedBody.data,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.updateError) {
        logger.error('Failed to update review', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // 리뷰 삭제
  app.delete('/reviews/:reviewId', async (c) => {
    const parsedParams = ReviewParamsSchema.safeParse({
      reviewId: c.req.param('reviewId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_PARAMS',
          'The provided review id is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const body = await c.req.json();
    const parsedBody = ReviewDeleteSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_DELETE_DATA',
          'The provided delete data is invalid.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await deleteReview(
      supabase,
      parsedParams.data.reviewId,
      parsedBody.data.password,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.deleteError) {
        logger.error('Failed to delete review', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};

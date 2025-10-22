import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { success, failure, respond } from '@/backend/http/response';
import { placesQuerySchema, createPlaceSchema } from './schema';
import { fetchPlacesByBounds, upsertPlace, fetchPlaceById } from './service';
import { PLACE_ERROR_CODES } from './error';

const placesRouter = new Hono<AppEnv>();

/**
 * GET /api/places
 * 지도 영역 내 장소 목록 조회
 */
placesRouter.get('/', async (c) => {
  try {
    const supabase = c.get('supabase');
    const rawQuery = c.req.query();

    // 쿼리 파라미터 검증
    const parseResult = placesQuerySchema.safeParse(rawQuery);

    if (!parseResult.success) {
      return respond(
        c,
        failure(400, PLACE_ERROR_CODES.INVALID_BOUNDS, '유효하지 않은 영역입니다')
      );
    }

    const { lat1, lng1, lat2, lng2, category } = parseResult.data;

    // 장소 목록 조회
    const places = await fetchPlacesByBounds({
      supabase,
      lat1,
      lng1,
      lat2,
      lng2,
      categories: category,
    });

    return respond(c, success({ places }));
  } catch (error) {
    console.error('GET /api/places 에러:', error);
    return respond(
      c,
      failure(500, PLACE_ERROR_CODES.FETCH_FAILED, '장소 목록을 불러올 수 없습니다')
    );
  }
});

/**
 * POST /api/places
 * 장소 생성 또는 조회 (upsert)
 */
placesRouter.post('/', zValidator('json', createPlaceSchema), async (c) => {
  try {
    const supabase = c.get('supabase');
    const placeData = c.req.valid('json');

    const result = await upsertPlace(supabase, placeData);

    return respond(c, success(result));
  } catch (error) {
    console.error('POST /api/places 에러:', error);
    return respond(
      c,
      failure(500, PLACE_ERROR_CODES.CREATE_FAILED, '장소를 생성할 수 없습니다')
    );
  }
});

/**
 * GET /api/places/:placeId
 * 특정 장소 상세 정보 조회
 */
placesRouter.get('/:placeId', async (c) => {
  try {
    const supabase = c.get('supabase');
    const placeId = c.req.param('placeId');

    const place = await fetchPlaceById(supabase, placeId);

    if (!place) {
      return respond(
        c,
        failure(404, PLACE_ERROR_CODES.PLACE_NOT_FOUND, '장소를 찾을 수 없습니다')
      );
    }

    return respond(c, success(place));
  } catch (error) {
    console.error('GET /api/places/:placeId 에러:', error);
    return respond(
      c,
      failure(500, PLACE_ERROR_CODES.FETCH_FAILED, '장소 정보를 불러올 수 없습니다')
    );
  }
});

export { placesRouter };

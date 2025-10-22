import type { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { SearchQuerySchema } from './schema';
import { searchPlaces } from './service';
import type { SearchErrorCode } from './error';
import type { SearchResponse } from './schema';

export const registerSearchRoutes = (app: Hono<AppEnv>) => {
  // GET /api/search
  app.get('/search', async (c) => {
    try {
      const rawQuery = {
        query: c.req.query('query'),
        display: c.req.query('display'),
      };

      console.log('[Search] Raw query:', rawQuery);

      const parseResult = SearchQuerySchema.safeParse(rawQuery);

      if (!parseResult.success) {
        console.log('[Search] Validation failed:', parseResult.error.format());
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_QUERY',
              message: 'Invalid query parameters',
              details: parseResult.error.format(),
            },
          },
          400
        );
      }

      const query = parseResult.data;
      console.log('[Search] Validated query:', query);

      const config = c.get('config');

      // 네이버 API 인증 정보
      const clientId = config.NAVER_CLIENT_ID;
      const clientSecret = config.NAVER_CLIENT_SECRET;

      const result = await searchPlaces(query, { clientId, clientSecret });

      return respond<SearchResponse, SearchErrorCode, unknown>(c, result);
    } catch (error) {
      console.error('[Search] Error:', error);
      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        500
      );
    }
  });
};

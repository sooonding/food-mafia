import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerReviewRoutes } from '@/features/review/backend/route';
import { placesRouter } from '@/features/places/backend/route';
import { registerSearchRoutes } from '@/features/search/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  // 개발 환경에서는 싱글톤 비활성화 (HMR 지원)
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (singletonApp && !isDevelopment) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerReviewRoutes(app);
  registerSearchRoutes(app);
  app.route('/places', placesRouter);

  // 개발 환경에서 등록된 라우트 로깅
  if (isDevelopment) {
    console.log('[Hono] Routes registered:');
    app.routes.forEach((route) => {
      console.log(`  ${route.method} ${route.path}`);
    });
  }

  if (!isDevelopment) {
    singletonApp = app;
  }

  return app;
};

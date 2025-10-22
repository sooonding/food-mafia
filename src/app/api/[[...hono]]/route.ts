import { createHonoApp } from '@/backend/hono/app';

const app = createHonoApp();

export const runtime = 'nodejs';

const handler = (req: Request) => {
  // Next.js App Router는 전체 URL을 전달하므로, /api를 제거해야 함
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';

  // Hono가 인식할 수 있도록 URL 수정
  const honoUrl = new URL(path + url.search, url.origin);

  // GET, HEAD 요청은 body가 없으므로 제외
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  // 새로운 Request 객체 생성
  const honoReq = new Request(honoUrl.toString(), {
    method: req.method,
    headers: req.headers,
    ...(hasBody && {
      body: req.body,
      duplex: 'half',
    }),
  } as RequestInit);

  return app.fetch(honoReq);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

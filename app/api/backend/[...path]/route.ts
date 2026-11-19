// ----------------------------------------------------------------------
// BFF catch-all 프록시(가이드 A6.2) — `/api/backend/v1/...` → 서버 `/api/v1/...`.
// httpOnly 쿠키의 access token 을 Bearer 로 바꿔 붙인다. 서버가 401 이면 쿠키를 지운다(만료·로그아웃된 토큰).
// 갱신 토큰은 없다(develop FN-08 — 7일 토큰, 단일 운영자).
// ----------------------------------------------------------------------
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { ADMIN_COOKIE, clearAdminCookie } from '@/src/server/auth-cookie';
import { relayResponse } from '@/src/server/relay-response';
import { callUpstream } from '@/src/server/upstream';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const upstream = await callUpstream({
    method: request.method,
    path: `/${path.map(encodeURIComponent).join('/')}`,
    search: request.nextUrl.search,
    token,
    contentType: request.headers.get('content-type'),
    body: hasBody ? await request.arrayBuffer() : null,
  });
  const response = await relayResponse(upstream);
  if (upstream.status === 401 && token) clearAdminCookie(response);
  return response;
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};

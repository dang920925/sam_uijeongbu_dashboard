// ----------------------------------------------------------------------
// BFF catch-all 프록시(가이드 A6.2) — `/api/backend/v1/...` → 서버 `/api/v1/...`.
// httpOnly 쿠키의 access token 을 Bearer 로 바꿔 붙인다. 서버가 401 이면 쿠키를 지운다(만료·로그아웃된 토큰).
// 갱신 토큰은 없다(develop FN-08 — 7일 토큰, 단일 운영자).
// - 상태 변경(POST·PATCH·PUT·DELETE)은 출처·JSON 검사 뒤에만 중계한다(qa1 QA1-005, request-guard).
// - 중계 비밀·방문자 IP 부착과 서버 연결 실패 503 은 callUpstream 이 한다(qa1 U11·U13).
// ----------------------------------------------------------------------
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { ADMIN_COOKIE, clearAdminCookie } from '@/src/server/auth-cookie';
import {
  rejectedRequestResponse,
  relayResponse,
} from '@/src/server/relay-response';
import { checkStateChangingRequest } from '@/src/server/request-guard';
import { readServerConfig } from '@/src/server/server-config';
import { callUpstream } from '@/src/server/upstream';
import { visitorIpOf } from '@/src/server/visitor-ip';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

/** 목 백엔드의 서명 업로드 흉내(`__mock-storage`)만 이미지 본문을 받는다 — 실서버 모드에는 없는 경로 */
function isMockStorageUpload(path: string[]): boolean {
  return path[0] === '__mock-storage' && readServerConfig().isMockBackend;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : null;
  const rejection = checkStateChangingRequest(
    request.method,
    request.headers,
    request.nextUrl.origin,
    (body?.byteLength ?? 0) > 0 && !isMockStorageUpload(path)
  );
  if (rejection) {
    return rejectedRequestResponse(rejection, request.nextUrl.pathname);
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  const upstream = await callUpstream({
    method: request.method,
    path: `/${path.map(encodeURIComponent).join('/')}`,
    search: request.nextUrl.search,
    token,
    contentType: request.headers.get('content-type'),
    body,
    visitorIp: visitorIpOf(request.headers),
    bffPath: request.nextUrl.pathname,
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
